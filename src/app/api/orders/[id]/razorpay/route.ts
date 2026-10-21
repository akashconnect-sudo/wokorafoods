import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { displayOrderNumber } from "@/lib/constants";
import { createRazorpayOrder } from "@/lib/razorpay";
import { assertSameOrigin, rateLimit } from "@/lib/security";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;
  const limited = rateLimit(`razorpay:${session.user.id}:${params.id}`, 12, 10 * 60 * 1000);
  if (limited) return limited;

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (session.user.role === "admin" || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (order.status === "cancelled" || order.paymentStatus === "paid") {
    return NextResponse.json({ error: "Payment is closed" }, { status: 409 });
  }
  if (order.paymentMethod === "cash") {
    return NextResponse.json({ error: "Payment is not available" }, { status: 409 });
  }

  const amountPaise = Math.round(order.totalAmount * 100);
  if (amountPaise < 100) {
    return NextResponse.json({ error: "Payment is not available" }, { status: 400 });
  }

  const razorpay = await createRazorpayOrder(amountPaise, order.id);
  if (!razorpay || "error" in razorpay) {
    const status = razorpay && razorpay.error === "auth" ? 401 : 500;
    return NextResponse.json({ error: "Payment is not available" }, { status });
  }

  return NextResponse.json({
    keyId: razorpay.keyId,
    razorpayOrderId: razorpay.id,
    amount: razorpay.amount,
    currency: "INR",
    name: "Wokora Foods",
    description: `Order ${displayOrderNumber(order.serialNumber)}`,
    prefill: {
      name: session.user.name || "",
      email: session.user.email || "",
      contact: session.user.phone || "",
    },
  });
}
