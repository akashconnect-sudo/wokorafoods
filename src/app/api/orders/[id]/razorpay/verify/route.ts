import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { recordPayment } from "@/lib/payments";
import { afterPaymentChanged } from "@/lib/orderEvents";
import { assertSameOrigin, rateLimit } from "@/lib/security";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;
  const limited = rateLimit(`razorpay-verify:${session.user.id}:${params.id}`, 12, 10 * 60 * 1000);
  if (limited) return limited;

  let body: { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const razorpayOrderId = body.razorpay_order_id || "";
  const razorpayPaymentId = body.razorpay_payment_id || "";
  const razorpaySignature = body.razorpay_signature || "";
  if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
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

  const amountPaise = Math.round(existing.totalAmount * 100);
  const keysReady = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!keysReady || amountPaise < 100) {
    return NextResponse.json({ error: "Payment is not available" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: existing.id },
    data: { paymentStatus: "paid", paymentMethod: "upi" },
  });
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
