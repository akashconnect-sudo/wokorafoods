import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const RESET_TTL_MS = 30 * 60 * 1000;

function hashResetToken(token: string) {
  return createHash("sha256").update(`reset:${token}`).digest("hex");
}

/** Create a one-time password-reset token stored in EmailOtp (survives serverless restarts). */
export async function createResetToken(email: string) {
  const normalized = email.trim().toLowerCase();
  const token = randomBytes(32).toString("hex");

  await prisma.emailOtp.updateMany({
    where: { email: normalized, purpose: "reset", consumed: false },
    data: { consumed: true },
  });

  await prisma.emailOtp.create({
    data: {
      email: normalized,
      purpose: "reset",
      codeHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  return token;
}

/** Consume a reset token and return the account email, or null if invalid/expired. */
export async function consumeResetToken(token: string) {
  if (!token || typeof token !== "string") return null;
  const codeHash = hashResetToken(token.trim());

  const record = await prisma.emailOtp.findFirst({
    where: {
      purpose: "reset",
      codeHash,
      consumed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return null;

  await prisma.emailOtp.update({
    where: { id: record.id },
    data: { consumed: true },
  });

  return record.email;
}
