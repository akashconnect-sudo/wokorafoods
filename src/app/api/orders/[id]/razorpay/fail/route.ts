import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { afterPaymentChanged } from "@/lib/orderEvents";
import { recordPayment } from "@/lib/payments";
import { sanitizePaymentReason } from "@/lib/razorpay";
import { assertSameOrigin, paymentRateLimit, rateLimit } from "@/lib/security";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;
  const burst = paymentRateLimit(request, session.user.id, "fail");
  if (burst) return burst;
  const limited = rateLimit(`razorpay-fail:${session.user.id}:${params.id}`, 8, 10 * 60 * 1000);
  if (limited) return limited;

  if (!/^[a-z0-9]{10,40}$/i.test(params.id)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let reason = "Payment failed";
  try {
    const body = await request.json();
    if (typeof body.reason === "string" && body.reason.trim()) {
      reason = sanitizePaymentReason(body.reason) || "Payment failed";
    }
  } catch {
    // optional body
  }

  const existing = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (session.user.role === "admin" || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (existing.paymentStatus === "paid" || existing.status === "cancelled") {
    return NextResponse.json({ error: "Payment is closed" }, { status: 409 });
  }

  const updated = await prisma.order.updateMany({
    where: {
      id: existing.id,
      paymentStatus: { notIn: ["paid"] },
      status: { not: "cancelled" },
    },
    data: { paymentStatus: "failed", paymentMethod: existing.paymentMethod || "upi" },
  });
  if (updated.count === 0) {
    return NextResponse.json({ ok: true });
  }

  await recordPayment({
    storeId: existing.storeId,
    orderId: existing.id,
    userId: existing.userId,
    method: existing.paymentMethod || "upi",
    status: "failed",
    amount: existing.totalAmount,
    failureReason: reason,
  });

  await afterPaymentChanged({
    storeId: existing.storeId,
    orderId: existing.id,
    serialNumber: existing.serialNumber,
    paymentStatus: "failed",
    totalAmount: existing.totalAmount,
    userId: existing.userId,
  });

  return NextResponse.json({ ok: true });
}
