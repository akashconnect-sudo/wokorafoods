import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { displayOrderNumber } from "@/lib/constants";
import { createRazorpayOrder } from "@/lib/razorpay";
import { assertSameOrigin, paymentRateLimit, rateLimit } from "@/lib/security";
import { recordPayment } from "@/lib/payments";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;
  const burst = paymentRateLimit(request, session.user.id, "create");
  if (burst) return burst;
  const limited = rateLimit(`razorpay:${session.user.id}:${params.id}`, 6, 10 * 60 * 1000);
  if (limited) return limited;

  if (!/^[a-z0-9]{10,40}$/i.test(params.id)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (session.user.role === "admin" || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (order.status === "cancelled" || order.paymentStatus === "paid") {
    return NextResponse.json({ error: "Payment is closed" }, { status: 409 });
  }
  if (order.paymentMethod === "cash" || order.paymentStatus === "pay_at_counter") {
    return NextResponse.json({ error: "Payment is not available" }, { status: 409 });
  }

  const amountPaise = Math.round(Number(order.totalAmount) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    return NextResponse.json({ error: "Payment is not available" }, { status: 400 });
  }

  const razorpay = await createRazorpayOrder(amountPaise, order.id);
  if (!razorpay || "error" in razorpay) {
    const status = razorpay && razorpay.error === "auth" ? 401 : 500;
    return NextResponse.json({ error: "Payment is not available" }, { status });
  }

  await recordPayment({
    storeId: order.storeId,
    orderId: order.id,
    userId: order.userId,
    method: "upi",
    status: "pending",
    amount: order.totalAmount,
    txnRef: razorpay.id,
  });

  return NextResponse.json({
    keyId: razorpay.keyId,
    razorpayOrderId: razorpay.id,
    amount: razorpay.amount,
    currency: "INR",
    name: "Wokora Foods",
    description: `Order ${displayOrderNumber(order.serialNumber)}`,
    prefill: {
      name: (session.user.name || "").slice(0, 80),
      email: (session.user.email || "").slice(0, 120),
      contact: (session.user.phone || "").replace(/\D/g, "").slice(-10),
    },
  });
}
