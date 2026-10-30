import nodemailer from "nodemailer";
import { BRAND } from "@/lib/constants";

function smtpPass() {
  return String(process.env.SMTP_PASS || "").replace(/\s+/g, "");
}

function transport() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = smtpPass();
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE !== "false"
    : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user, pass },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
  });
}

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && smtpPass());
}

export const MAIL_SEND_FAILED = "We could not send the email. Please try again shortly.";

export async function sendMail(to: string, subject: string, text: string, html?: string) {
  const mailer = transport();
  const from = (process.env.SMTP_FROM || process.env.SMTP_USER || BRAND.email).trim();
  if (!mailer) {
    throw new Error(MAIL_SEND_FAILED);
  }

  try {
    await mailer.sendMail({
      from: `"${BRAND.name}" <${from}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br/>"),
    });
  } catch (error) {
    console.error("[mail send]", error instanceof Error ? error.message : error);
    throw new Error(MAIL_SEND_FAILED);
  }
}
