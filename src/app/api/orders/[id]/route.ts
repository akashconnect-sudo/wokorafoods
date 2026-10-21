import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { buildReceiptHtml, printReceipt } from "@/lib/printReceipt";
import { afterOrderUpdated, afterPaymentChanged, afterTableAssigned, type OrderUpdatedEvent } from "@/lib/orderEvents";
import { DEFAULT_STORE_ID } from "@/lib/store";
import { TABLE_COUNT } from "@/lib/constants";
import { attachItemCustomizations } from "@/lib/cartPersistence";
import { recordPayment, hidePayoutFields, type PaymentStatus } from "@/lib/payments";
import {
  assertSameOrigin,
  paymentToken,
  rateLimit,
  safePayMethod,
  safePayStatus,
  verifyPaymentToken,
} from "@/lib/security";

const STATUSES = new Set(["placed", "preparing", "ready", "served", "cancelled"]);

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { menuItem: true } },
      payments: { orderBy: { createdAt: "desc" } },
      user: { select: { name: true, phone: true, email: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (session.user.role !== "admin" && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.user.role === "admin" && order.storeId !== (session.user.storeId || DEFAULT_STORE_ID)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    order: hidePayoutFields((await attachItemCustomizations([order]))[0]),
    payToken: paymentToken(order.id, order.userId),
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({
    where: { id: params.id },
    include: { user: { select: { name: true, phone: true, email: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (body.pay === true || body.pay === false) {
    const limited = rateLimit(`pay:${session.user.id}:${existing.id}`, 8, 10 * 60 * 1000);
    if (limited) return limited;
    if (session.user.role !== "admin" && existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.user.role !== "admin" && !verifyPaymentToken(existing.id, existing.userId, typeof body.payToken === "string" ? body.payToken : "")) {
      return NextResponse.json({ error: "Invalid payment token" }, { status: 403 });
    }
    if (existing.status === "cancelled") {
      return NextResponse.json({ error: "Order cancelled" }, { status: 409 });
    }
    if (existing.paymentStatus === "paid") {
      const current = await prisma.order.findUnique({
        where: { id: existing.id },
        include: {
          items: { include: { menuItem: true } },
          payments: { orderBy: { createdAt: "desc" } },
          user: { select: { name: true, phone: true, email: true } },
        },
      });
      if (!current) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json({ order: hidePayoutFields(current) });
    }
    const method = safePayMethod(body.paymentMethod, existing.paymentMethod || "upi");
    const paymentStatus: PaymentStatus = body.pay ? "paid" : "failed";
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        paymentStatus,
        paymentMethod: method,
      },
      include: {
        items: { include: { menuItem: true } },
        payments: { orderBy: { createdAt: "desc" } },
        user: { select: { name: true, phone: true, email: true } },
      },
    });
    await recordPayment({
      storeId: existing.storeId,
      orderId: existing.id,
      userId: existing.userId,
      method,
      status: paymentStatus,
      amount: existing.totalAmount,
      upiApp: typeof body.upiApp === "string" ? body.upiApp.slice(0, 32) : "",
      txnRef: existing.id,
      failureReason: body.pay
        ? ""
        : typeof body.failureReason === "string"
          ? body.failureReason.slice(0, 180)
          : "Payment failed in UPI app",
    });
    const withPay = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: { include: { menuItem: true } },
        payments: { orderBy: { createdAt: "desc" } },
        user: { select: { name: true, phone: true, email: true } },
      },
    });
    await afterPaymentChanged({
      storeId: existing.storeId,
      orderId: existing.id,
      serialNumber: existing.serialNumber,
      paymentStatus,
      totalAmount: existing.totalAmount,
    });
    return NextResponse.json({ order: hidePayoutFields(withPay || order) });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.reprint) {
    const printItems = (
      await prisma.orderItem.findMany({
        where: { orderId: existing.id },
        include: { menuItem: true },
      })
    );
    const withNotes = (await attachItemCustomizations([{ items: printItems }]))[0];
    const printable = {
      id: existing.id,
      tableNumber: existing.tableNumber,
      type: existing.type as "dine_in" | "takeaway",
      items: withNotes.items.map((item) => ({
        name: item.menuItem.name,
        customization: item.customization || "",
        quantity: item.quantity,
        price: item.priceAtOrder,
      })),
      subtotal: existing.subtotal,
      taxAmount: existing.taxAmount,
      totalAmount: existing.totalAmount,
      createdAt: existing.createdAt,
      customerName: existing.user.name,
      customerPhone: existing.user.phone,
    };
    await printReceipt(printable);
    return NextResponse.json({ ok: true, html: buildReceiptHtml(printable) });
  }

  const data: {
    status?: string;
    etaMinutes?: number;
    etaSetAt?: Date;
    paymentStatus?: string;
    tableNumber?: string;
  } = {};
  let assignedTable = "";

  if (typeof body.status === "string" && STATUSES.has(body.status)) {
    data.status = body.status;
  }

  if (body.etaMinutes !== undefined) {
    const etaMinutes = Number(body.etaMinutes);
    if (!Number.isFinite(etaMinutes) || etaMinutes < 1 || etaMinutes > 180) {
      return NextResponse.json({ error: "Enter wait time between 1 and 180 minutes" }, { status: 400 });
    }
    data.etaMinutes = etaMinutes;
    data.etaSetAt = new Date();
    if (!body.status) data.status = "preparing";
  }

  const payStatus = safePayStatus(body.paymentStatus);
  if (payStatus) {
    data.paymentStatus = payStatus;
  }

  if (typeof body.tableNumber === "string") {
    const nextTable = body.tableNumber.trim();
    const allowed = new Set(Array.from({ length: TABLE_COUNT }, (_, index) => String(index + 1)));
    if (!allowed.has(nextTable)) {
      return NextResponse.json({ error: "Choose table 1, 2, or 3" }, { status: 400 });
    }
    if (existing.type === "dine_in" && nextTable !== (existing.tableNumber || "")) {
      data.tableNumber = nextTable;
      assignedTable = nextTable;
    }
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data,
    include: {
      items: { include: { menuItem: true } },
      payments: { orderBy: { createdAt: "desc" } },
      user: { select: { name: true, phone: true, email: true } },
    },
  });

  if (payStatus) {
    await recordPayment({
      storeId: order.storeId,
      orderId: order.id,
      userId: order.userId,
      method: order.paymentMethod || "cash",
      status: payStatus as PaymentStatus,
      amount: order.totalAmount,
    });
    await afterPaymentChanged({
      storeId: order.storeId,
      orderId: order.id,
      serialNumber: order.serialNumber,
      paymentStatus: payStatus,
      totalAmount: order.totalAmount,
    });
  }

  if (assignedTable) {
    await afterTableAssigned({
      storeId: order.storeId,
      orderId: order.id,
      userId: order.userId,
      serialNumber: order.serialNumber,
      tableNumber: assignedTable,
    });
  }

  if (!assignedTable || data.status !== undefined || data.etaMinutes !== undefined) {
    const updated: OrderUpdatedEvent = {
      type: "OrderUpdated",
      storeId: order.storeId,
      orderId: order.id,
      userId: order.userId,
      serialNumber: order.serialNumber,
      status: order.status,
      etaMinutes: order.etaMinutes,
    };
    await afterOrderUpdated(updated);
  }

  return NextResponse.json({ order });
}
