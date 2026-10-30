import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { consumeResetToken } from "@/lib/resetTokens";
import { passwordSchema } from "@/lib/validations";
import { SERVER_ERROR } from "@/lib/publicError";

export async function POST(request: Request) {
  const { token, password } = await request.json();
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters with one uppercase letter and one symbol." },
      { status: 400 }
    );
  }

  const email = typeof token === "string" ? await consumeResetToken(token) : null;
  if (!email) {
    return NextResponse.json({ error: "Reset request expired" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Reset request expired" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data, 10) },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[reset-password]", error);
    return NextResponse.json({ error: SERVER_ERROR }, { status: 500 });
  }
}
