import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { DEFAULT_STORE_ID } from "@/lib/store";
import { buildOrderUpiQuery, upiOpenUri } from "@/lib/upiIntent";
import { assertSameOriginIfPresent, rateLimit, safeUpiApp } from "@/lib/security";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const originBlock = assertSameOriginIfPresent(request);
  if (originBlock) return originBlock;
  const limited = rateLimit(`upi-open:${session.user.id}:${params.id}`, 40, 5 * 60 * 1000);
  if (limited) return limited;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      userId: true,
      storeId: true,
      serialNumber: true,
      totalAmount: true,
      paymentStatus: true,
      status: true,
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (session.user.role !== "admin" && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.user.role === "admin" && order.storeId !== (session.user.storeId || DEFAULT_STORE_ID)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status === "cancelled" || order.paymentStatus === "paid") {
    return NextResponse.json({ error: "Payment is closed" }, { status: 409 });
  }

  const query = buildOrderUpiQuery(order);
  if (!query) {
    return NextResponse.json({ error: "Payment is not available" }, { status: 503 });
  }

  const app = safeUpiApp(new URL(request.url).searchParams.get("app"));
  const ios = /iPhone|iPad|iPod/i.test(request.headers.get("user-agent") || "");
  const uri = upiOpenUri(query, app, ios);

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Pay Wokora Foods</title></head><body><p>Opening your UPI app...</p><script>location.replace(${JSON.stringify(uri)});</script></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
