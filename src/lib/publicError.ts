import { NextResponse } from "next/server";

export const SERVER_ERROR = "Something went wrong. Please try again.";

const SAFE_USER_ERRORS = new Set([
  "Login required",
  "Login required to place an order",
  "Kitchen accounts cannot place customer orders",
  "Invalid request",
  "Choose table 1, 2, or 3",
  "One or more items are unavailable",
  "Order not found",
  "Forbidden",
  "Invalid payment token",
  "Order cancelled",
  "Enter wait time between 1 and 180 minutes",
  "Payment is closed",
  "Payment is not available",
  "Payment failed",
  "Payment cancelled",
  "Enter a valid email",
  "Enter a valid 10-digit Indian mobile number",
  "Invalid or expired email OTP",
  "Phone or email already registered",
  "Invalid OTP request",
  "Invalid or expired OTP",
  "Enter the email on your account",
  "Password must be at least 6 characters",
  "Reset request expired",
  "Name, subject and message are required",
  "Email is required so we can send you a confirmation",
  "Choose an image",
  "Image must be under 4 MB",
  "Upload an image file",
  "Category name is required",
  "Cannot delete this plate: some dishes are on past orders. Hide those dishes instead.",
  "Unauthorized",
  "Not found",
  "Ticket not found",
  "Too many payment attempts. Wait and try again.",
  "Forbidden origin",
  "UPI could not be loaded",
  "Could not save.",
  "Could not place the order. Please sign in first.",
  "Enter your email to receive an OTP.",
  "Check the form and try again.",
]);

function looksTechnical(text: string) {
  return /prisma|sql|econn|etimedout|stack|exception|enoent|eperm|digest|at\s+\w+\s+\(|node_modules|internal server|mysql|hstgr/i.test(
    text
  );
}

export function userFacingError(value: unknown): string {
  if (typeof value !== "string") return SERVER_ERROR;
  const text = value.trim();
  if (!text) return SERVER_ERROR;
  if (text.startsWith("Wait ") && text.length < 80) return text;
  if (SAFE_USER_ERRORS.has(text)) return text;
  if (looksTechnical(text) || text.length > 140) return SERVER_ERROR;
  return SERVER_ERROR;
}

export function serverErrorJson() {
  return NextResponse.json({ error: SERVER_ERROR }, { status: 500 });
}
