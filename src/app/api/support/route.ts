import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { notifyNewSupportTicket } from "@/lib/supportNotify";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json({ tickets: [] });
    }

    const where = session.user.role === "admin" ? {} : { userId: session.user.id };
    const tickets = await prisma.supportTicket.findMany({
      where,
      include: { replies: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("[support GET]", error);
    return NextResponse.json({ tickets: [] });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    const name = String(body.name || session?.user.name || "").trim();
    const phone = String(body.phone || session?.user.phone || "").trim();
    const email = String(body.email || session?.user.email || "").trim();

    if (!subject || !message || !name) {
      return NextResponse.json({ error: "Name, subject and message are required" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email is required so we can send you a confirmation" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session?.user.id || null,
        name,
        phone,
        email: email || null,
        subject,
        message,
        status: "open",
      },
      include: { replies: true },
    });

    await notifyNewSupportTicket({
      name,
      phone,
      email: email || null,
      subject,
      message,
    });

    return NextResponse.json({ ok: true, ticket });
  } catch (error) {
    console.error("[support POST]", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
