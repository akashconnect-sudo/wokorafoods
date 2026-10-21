import { prisma } from "./prisma";
import { notifyOrderPlaced } from "./notify";
import { BRAND, displayOrderNumber } from "./constants";
import { paymentStatusLabel } from "./orderLabels";

export type OrderPlacedEvent = {
  type: "OrderPlaced";
  storeId: string;
  orderId: string;
  userId: string;
  serialNumber: number;
  tableNumber: string | null;
  orderType: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  customer: { name: string; phone: string; email?: string | null };
  items: { name: string; quantity: number; price: number; isVeg: boolean; customization?: string }[];
};

export type OrderUpdatedEvent = {
  type: "OrderUpdated";
  storeId: string;
  orderId: string;
  userId: string;
  serialNumber: number;
  status: string;
  etaMinutes?: number | null;
};

async function kitchenStaffIds(storeId: string) {
  const cooks = await prisma.user.findMany({
    where: { storeId, role: "admin" },
    select: { id: true },
  });
  return cooks.map((row) => row.id);
}

async function notifyKitchen(storeId: string, orderId: string, title: string, body: string) {
  const ids = await kitchenStaffIds(storeId);
  if (!ids.length) return;
  await prisma.notification.createMany({
    data: ids.map((userId) => ({
      storeId,
      userId,
      title,
      body,
      orderId,
    })),
  });
}

async function printTicket(event: OrderPlacedEvent) {
  await prisma.printJob.create({
    data: {
      storeId: event.storeId,
      orderId: event.orderId,
      status: "pending",
      payload: JSON.stringify({
        id: event.orderId,
        tableNumber: event.tableNumber,
        type: event.orderType,
        items: event.items,
        subtotal: event.subtotal,
        taxAmount: event.taxAmount,
        totalAmount: event.totalAmount,
        createdAt: event.createdAt,
        customerName: event.customer.name,
        customerPhone: event.customer.phone,
      }),
    },
  });
}

async function notify(event: OrderPlacedEvent | OrderUpdatedEvent) {
  if (event.type === "OrderPlaced") {
    await notifyOrderPlaced({
      id: event.orderId,
      serialNumber: event.serialNumber,
      userId: event.userId,
      storeId: event.storeId,
      tableNumber: event.tableNumber,
      totalAmount: event.totalAmount,
      user: event.customer,
    });
    return;
  }

  await prisma.notification.create({
    data: {
      storeId: event.storeId,
      userId: event.userId,
      title: `${BRAND.name}: Order ${displayOrderNumber(event.serialNumber)} ${event.status}`,
      body: event.etaMinutes
        ? `Kitchen ETA is ${event.etaMinutes} minutes.`
        : `Your order is now ${event.status}.`,
      orderId: event.orderId,
    },
  });
}

export async function afterOrderPlaced(event: OrderPlacedEvent) {
  const number = displayOrderNumber(event.serialNumber);
  await Promise.allSettled([
    printTicket(event),
    notify(event),
    notifyKitchen(
      event.storeId,
      event.orderId,
      `New order ${number}`,
      `${event.customer.name} · ${paymentStatusLabel(event.paymentStatus)} · ₹${Math.round(event.totalAmount)}`
    ),
  ]);
}

export async function afterOrderUpdated(event: OrderUpdatedEvent) {
  await notify(event);
}

export async function afterTableAssigned(event: {
  storeId: string;
  orderId: string;
  userId: string;
  serialNumber: number;
  tableNumber: string;
}) {
  await prisma.notification.create({
    data: {
      storeId: event.storeId,
      userId: event.userId,
      orderId: event.orderId,
      title: "Your assigned table",
      body: `Your assigned table is Table ${event.tableNumber} for order ${displayOrderNumber(event.serialNumber)}.`,
    },
  });
}

export async function afterPaymentChanged(event: {
  storeId: string;
  orderId: string;
  serialNumber: number;
  paymentStatus: string;
  totalAmount: number;
  userId?: string;
}) {
  const number = displayOrderNumber(event.serialNumber);
  const label = paymentStatusLabel(event.paymentStatus);
  await notifyKitchen(
    event.storeId,
    event.orderId,
    `Payment · ${number}`,
    `${label} · ₹${Math.round(event.totalAmount)}`
  );
  if (event.userId && (event.paymentStatus === "failed" || event.paymentStatus === "paid")) {
    await prisma.notification.create({
      data: {
        storeId: event.storeId,
        userId: event.userId,
        orderId: event.orderId,
        title: event.paymentStatus === "failed" ? "Payment failed" : "Payment received",
        body:
          event.paymentStatus === "failed"
            ? `Payment failed for order ${number}. Open the bill and try again.`
            : `Payment received for order ${number}.`,
      },
    });
  }
}
