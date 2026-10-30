import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { BRAND } from "@/lib/constants";

export type OtpPurpose = "signup" | "login" | "reset";

const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_RESEND_SECONDS = 60;
const RESEND_GAP_MS = OTP_RESEND_SECONDS * 1000;

function hashOtp(email: string, purpose: OtpPurpose, code: string) {
  return createHash("sha256").update(`${email}:${purpose}:${code}`).digest("hex");
}

export async function createAndSendEmailOtp(email: string, purpose: OtpPurpose) {
  const normalized = email.trim().toLowerCase();
  const recent = await prisma.emailOtp.findFirst({
    where: { email: normalized, purpose, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_GAP_MS) {
    const wait = Math.ceil((RESEND_GAP_MS - (Date.now() - recent.createdAt.getTime())) / 1000);
    throw new Error(`Wait ${wait}s before requesting another OTP.`);
  }

  await prisma.emailOtp.updateMany({
    where: { email: normalized, purpose, consumed: false },
    data: { consumed: true },
  });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.emailOtp.create({
    data: {
      email: normalized,
      purpose,
      codeHash: hashOtp(normalized, purpose, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  await sendMail(
    normalized,
    `${BRAND.name} verification code`,
    `Your ${BRAND.name} ${purpose} code is ${code}. It expires in 5 minutes.`,
    `<p>Your <strong>${BRAND.name}</strong> ${purpose} code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p><p>It expires in 5 minutes.</p>`
  );

  return { ok: true as const };
}

export async function verifyOtp(email: string, code: string, purpose: OtpPurpose, consume = true) {
  const normalized = email.trim().toLowerCase();
  const record = await prisma.emailOtp.findFirst({
    where: {
      email: normalized,
      purpose,
      consumed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return false;
  if (record.codeHash !== hashOtp(normalized, purpose, code.trim())) return false;

  if (consume) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { consumed: true },
    });
  }
  return true;
}
