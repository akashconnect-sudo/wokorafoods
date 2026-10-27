import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  fetchRazorpayPayment,
  isValidRazorpayOrderId,
  isValidRazorpayPaymentId,
  isValidRazorpaySignature,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import { recordPayment } from "@/lib/payments";
import { afterPaymentChanged } from "@/lib/orderEvents";
import { assertSameOrigin, paymentRateLimit, rateLimit } from "@/lib/security";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;
  const burst = paymentRateLimit(request, session.user.id, "verify");
  if (burst) return burst;
  const limited = rateLimit(`razorpay-verify:${session.user.id}:${params.id}`, 8, 10 * 60 * 1000);
  if (limited) return limited;

  if (!/^[a-z0-9]{10,40}$/i.test(params.id)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let body: { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const razorpayOrderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id.trim() : "";
  const razorpayPaymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id.trim() : "";
  const razorpaySignature = typeof body.razorpay_signature === "string" ? body.razorpay_signature.trim() : "";

  if (
    !isValidRazorpayOrderId(razorpayOrderId) ||
    !isValidRazorpayPaymentId(razorpayPaymentId) ||
    !isValidRazorpaySignature(razorpaySignature)
  ) {
    return NextResponse.json({ error: "Payment is not available" }, { status: 400 });
  }

  if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    console.error("[razorpay] Signature mismatch");
    return NextResponse.json({ error: "Payment is not available" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (session.user.role === "admin" || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (existing.status === "cancelled") {
    return NextResponse.json({ error: "Order cancelled" }, { status: 409 });
  }
  if (existing.paymentStatus === "paid") {
    return NextResponse.json({ ok: true });
  }
  if (existing.paymentMethod === "cash" || existing.paymentStatus === "pay_at_counter") {
    return NextResponse.json({ error: "Payment is not available" }, { status: 409 });
  }

  const expectedPaise = Math.round(Number(existing.totalAmount) * 100);
  if (!Number.isFinite(expectedPaise) || expectedPaise < 100) {
    return NextResponse.json({ error: "Payment is not available" }, { status: 400 });
  }

  const pending = await prisma.payment.findFirst({
    where: {
      orderId: existing.id,
      txnRef: razorpayOrderId,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
  });
  if (!pending) {
    console.error("[razorpay] Unknown Razorpay order for Wokora order");
    return NextResponse.json({ error: "Payment is not available" }, { status: 400 });
  }

  const reused = await prisma.payment.findFirst({
    where: { txnRef: razorpayPaymentId, status: "paid" },
  });
  if (reused && reused.orderId !== existing.id) {
    console.error("[razorpay] Payment id already used on another order");
    return NextResponse.json({ error: "Payment is not available" }, { status: 400 });
  }

  const payment = await fetchRazorpayPayment(razorpayPaymentId);
  if (!payment) {
    return NextResponse.json({ error: "Payment is not available" }, { status: 400 });
  }
  if (payment.orderId !== razorpayOrderId) {
    console.error("[razorpay] Payment order_id mismatch");
    return NextResponse.json({ error: "Payment is not available" }, { status: 400 });
  }
  if (payment.amountPaise !== expectedPaise || payment.currency.toUpperCase() !== "INR") {
    console.error("[razorpay] Amount/currency mismatch");
    return NextResponse.json({ error: "Payment is not available" }, { status: 400 });
  }
  if (!payment.captured && payment.status !== "captured" && payment.status !== "authorized") {
    console.error("[razorpay] Payment not captured", payment.status);
    return NextResponse.json({ error: "Payment is not available" }, { status: 400 });
  }

  const updated = await prisma.order.updateMany({
    where: {
      id: existing.id,
      paymentStatus: { not: "paid" },
      status: { not: "cancelled" },
    },
    data: { paymentStatus: "paid", paymentMethod: "upi" },
  });
  if (updated.count === 0) {
    return NextResponse.json({ ok: true });
  }

  await recordPayment({
    storeId: existing.storeId,
    orderId: existing.id,
    userId: existing.userId,
    method: "upi",
    status: "paid",
    amount: existing.totalAmount,
    txnRef: razorpayPaymentId.slice(0, 64),
  });
  await afterPaymentChanged({
    storeId: existing.storeId,
    orderId: existing.id,
    serialNumber: existing.serialNumber,
    paymentStatus: "paid",
    totalAmount: existing.totalAmount,
    userId: existing.userId,
  });

  return NextResponse.json({ ok: true });
}
