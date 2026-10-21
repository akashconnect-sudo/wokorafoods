import { createHmac, timingSafeEqual } from "crypto";

export function razorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

function authHeader(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export async function createRazorpayOrder(amountPaise: number, receipt: string) {
  const keys = razorpayKeys();
  if (!keys) return null;
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: authHeader(keys.keyId, keys.keySecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: receipt.slice(0, 40),
    }),
  });
  if (res.status === 401) return { error: "auth" as const };
  if (!res.ok) return { error: "api" as const };
  const data = (await res.json()) as { id?: string; amount?: number };
  if (!data.id || typeof data.amount !== "number") return { error: "api" as const };
  return { id: data.id, amount: data.amount, keyId: keys.keyId };
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const keys = razorpayKeys();
  if (!keys || !orderId || !paymentId || !signature) return false;
  const expected = createHmac("sha256", keys.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
