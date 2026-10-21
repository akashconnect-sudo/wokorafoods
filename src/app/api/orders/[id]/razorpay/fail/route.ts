import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { afterPaymentChanged } from "@/lib/orderEvents";
import { recordPayment } from "@/lib/payments";
import { assertSameOrigin, rateLimit } from "@/lib/security";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;
  const limited = rateLimit(`razorpay-fail:${session.user.id}:${params.id}`, 12, 10 * 60 * 1000);
  if (limited) return limited;

  let reason = "Payment failed";
  try {
    const body = await request.json();
    if (typeof body.reason === "string" && body.reason.trim()) {
      reason = body.reason.trim().slice(0, 180);
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

  const order = await prisma.order.update({
    where: { id: existing.id },
    data: { paymentStatus: "failed", paymentMethod: existing.paymentMethod || "upi" },
  });

  await recordPayment({
    storeId: order.storeId,
    orderId: order.id,
    userId: order.userId,
    method: order.paymentMethod || "upi",
    status: "failed",
    amount: order.totalAmount,
    failureReason: reason,
  });

  await afterPaymentChanged({
    storeId: order.storeId,
    orderId: order.id,
    serialNumber: order.serialNumber,
    paymentStatus: "failed",
    totalAmount: order.totalAmount,
    userId: order.userId,
  });

  return NextResponse.json({ ok: true });
}
