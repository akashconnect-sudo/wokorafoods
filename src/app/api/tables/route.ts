import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TABLE_COUNT } from "@/lib/constants";
import { DEFAULT_STORE_ID } from "@/lib/store";

export async function GET() {
  const numbers = Array.from({ length: TABLE_COUNT }, (_, index) => String(index + 1));
  const active = await prisma.order.findMany({
    where: {
      storeId: DEFAULT_STORE_ID,
      type: "dine_in",
      status: { notIn: ["served", "cancelled"] },
    },
    select: {
      id: true,
      serialNumber: true,
      tableNumber: true,
      totalAmount: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const byTable = new Map<string, (typeof active)[number]>();
  for (const order of active) {
    if (order.tableNumber && numbers.includes(order.tableNumber) && !byTable.has(order.tableNumber)) {
      byTable.set(order.tableNumber, order);
    }
  }

  const waiting = active
    .filter((order) => !order.tableNumber)
    .map((order) => ({
      id: order.id,
      serialNumber: order.serialNumber,
      totalAmount: order.totalAmount,
      userName: order.user.name,
    }));

  return NextResponse.json({
    tables: numbers.map((number) => {
      const order = byTable.get(number);
      return {
        number,
        occupied: Boolean(order),
        order: order
          ? {
              id: order.id,
              serialNumber: order.serialNumber,
              totalAmount: order.totalAmount,
              userName: order.user.name,
            }
          : null,
      };
    }),
    waiting,
  });
}
