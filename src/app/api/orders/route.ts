import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { orderSchema } from "@/lib/validations";
import { GST_RATE, TABLE_COUNT, loyaltyFromTotal } from "@/lib/constants";
import { DEFAULT_STORE_ID, ensureDefaultStore } from "@/lib/store";
import { afterOrderPlaced, type OrderPlacedEvent } from "@/lib/orderEvents";
import { attachItemCustomizations, saveOrderItemCustomizations } from "@/lib/cartPersistence";
import { recordPayment } from "@/lib/payments";
import { assertSameOrigin, rateLimit } from "@/lib/security";
import { serverErrorJson } from "@/lib/publicError";
import {
  basePriceForItem,
  optionGroupsFor,
  sanitizeSelections,
  summaryFromSelections,
  unitPriceFromSelections,
} from "@/lib/customizations";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const storeId = session.user.storeId || DEFAULT_STORE_ID;
    const isAdmin = session.user.role === "admin";
    const orders = await prisma.order.findMany({
      where: isAdmin ? { storeId } : { storeId, userId: session.user.id },
      include: {
        items: { include: { menuItem: true } },
        user: { select: { name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders: await attachItemCustomizations(orders) });
  } catch (error) {
    console.error("[orders GET]", error);
    return serverErrorJson();
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ error: "Login required to place an order" }, { status: 401 });
  }
  const originBlock = assertSameOrigin(request);
  if (originBlock) return originBlock;
  const limited = rateLimit(`order:${session.user.id}`, 20, 10 * 60 * 1000);
  if (limited) return limited;
  if (session.user.role === "admin") {
    return NextResponse.json({ error: "Kitchen accounts cannot place customer orders" }, { status: 403 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = orderSchema.safeParse(parsedBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { items, type, tableNumber, notes, paymentMethod } = parsed.data;
  const storeId = session.user.storeId || DEFAULT_STORE_ID;
  await ensureDefaultStore();

  if (type === "dine_in" && tableNumber) {
    const allowed = new Set(Array.from({ length: TABLE_COUNT }, (_, index) => String(index + 1)));
    if (!allowed.has(tableNumber)) {
      return NextResponse.json({ error: "Choose table 1, 2, or 3" }, { status: 400 });
    }
  }

  try {
  const menuIds = Array.from(new Set(items.map((item) => item.menuItemId)));
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuIds }, isAvailable: true, storeId },
    include: { category: true },
  });

  if (menuItems.length !== menuIds.length) {
    return NextResponse.json({ error: "One or more items are unavailable" }, { status: 400 });
  }

  const priced = items.map((item) => {
    const menuItem = menuItems.find((row) => row.id === item.menuItemId)!;
    const portions = {
      price: menuItem.price,
      halfPrice: menuItem.halfPrice,
      fullPrice: menuItem.fullPrice,
    };
    const groups = optionGroupsFor(menuItem.category.slug, menuItem.isVeg, portions);
    const selections = sanitizeSelections(groups, item.selections);
    const base = basePriceForItem(portions);
    const unitPrice = unitPriceFromSelections(base, groups, selections);
    const customization = item.customization || summaryFromSelections(groups, selections);
    return {
      menuItem,
      quantity: item.quantity,
      unitPrice,
      customization,
      lineTotal: unitPrice * item.quantity,
    };
  });

  const subtotal = priced.reduce((sum, row) => sum + row.lineTotal, 0);
  const taxAmount = Math.round(subtotal * GST_RATE);
  const totalAmount = subtotal + taxAmount;

  const last = await prisma.order.findFirst({
    where: { storeId },
    orderBy: { serialNumber: "desc" },
    select: { serialNumber: true },
  });
  const serialNumber = (last?.serialNumber || 0) + 1;

  const order = await prisma.order.create({
    data: {
      storeId,
      serialNumber,
      userId: session.user.id,
      tableNumber: type === "dine_in" ? tableNumber || null : null,
      type,
      status: "placed",
      paymentMethod: paymentMethod || null,
      paymentStatus: paymentMethod === "cash" ? "pay_at_counter" : "pending",
      subtotal,
      taxAmount,
      totalAmount,
      notes: notes || null,
      items: {
        create: priced.map((row) => ({
          menuItemId: row.menuItem.id,
          quantity: row.quantity,
          priceAtOrder: row.unitPrice,
        })),
      },
    },
    include: {
      items: { include: { menuItem: true } },
      user: { select: { name: true, phone: true, email: true } },
    },
  });

  await saveOrderItemCustomizations(
    order.items,
    priced.map((row) => row.customization || "")
  );
  await recordPayment({
    storeId,
    orderId: order.id,
    userId: order.userId,
    method: paymentMethod || "upi",
    status: paymentMethod === "cash" ? "pay_at_counter" : "pending",
    amount: totalAmount,
  });
  const itemsWithNotes = (await attachItemCustomizations([order]))[0];

  await prisma.user.update({
    where: { id: session.user.id },
    data: { loyaltyPoints: { increment: loyaltyFromTotal(totalAmount) } },
  });

  const event: OrderPlacedEvent = {
    type: "OrderPlaced",
    storeId,
    orderId: order.id,
    userId: order.userId,
    serialNumber: order.serialNumber,
    tableNumber: order.tableNumber,
    orderType: order.type,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    customer: { name: order.user.name, phone: order.user.phone, email: order.user.email },
    items: itemsWithNotes.items.map((item, index) => ({
      name: item.menuItem.name,
      customization: item.customization || priced[index]?.customization || "",
      quantity: item.quantity,
      price: item.priceAtOrder,
      isVeg: item.menuItem.isVeg,
    })),
  };

  await afterOrderPlaced(event);

  return NextResponse.json({ order: itemsWithNotes });
  } catch (error) {
    console.error("[orders POST]", error);
    return serverErrorJson();
  }
}
