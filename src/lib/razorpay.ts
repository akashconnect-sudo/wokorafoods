import { createHmac, timingSafeEqual } from "crypto";

const ORDER_ID_RE = /^order_[A-Za-z0-9]+$/;
const PAYMENT_ID_RE = /^pay_[A-Za-z0-9]+$/;
const SIGNATURE_RE = /^[a-f0-9]{64}$/i;

export function razorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim().replace(/^["']|["']$/g, "") || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim().replace(/^["']|["']$/g, "") || "";
  if (!keyId || !keySecret) {
    console.error("[razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET");
    return null;
  }
  return { keyId, keySecret };
}

function authHeader(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export function isValidRazorpayOrderId(value: string) {
  return ORDER_ID_RE.test(value) && value.length <= 40;
}

export function isValidRazorpayPaymentId(value: string) {
  return PAYMENT_ID_RE.test(value) && value.length <= 40;
}

export function isValidRazorpaySignature(value: string) {
  return SIGNATURE_RE.test(value);
}

export function sanitizePaymentReason(value: string) {
  return value
    .replace(/[<>`]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, 180);
}

export async function createRazorpayOrder(amountPaise: number, receipt: string) {
  const keys = razorpayKeys();
  if (!keys) return null;
  if (!Number.isInteger(amountPaise) || amountPaise < 100 || amountPaise > 50_000_000) {
    return { error: "api" as const };
  }
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
      payment_capture: 1,
      notes: { wokora_order_id: receipt.slice(0, 64) },
    }),
  });
  if (res.status === 401) {
    console.error("[razorpay] Authentication failed — check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
    return { error: "auth" as const };
  }
  if (!res.ok) {
    console.error("[razorpay] Order create failed", res.status);
    return { error: "api" as const };
  }
  const data = (await res.json()) as { id?: string; amount?: number };
  if (!data.id || typeof data.amount !== "number" || data.amount !== amountPaise) {
    return { error: "api" as const };
  }
  if (!isValidRazorpayOrderId(data.id)) return { error: "api" as const };
  return { id: data.id, amount: data.amount, keyId: keys.keyId };
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const keys = razorpayKeys();
  if (!keys) return false;
  if (!isValidRazorpayOrderId(orderId) || !isValidRazorpayPaymentId(paymentId) || !isValidRazorpaySignature(signature)) {
    return false;
  }
  const expected = createHmac("sha256", keys.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export type RazorpayPaymentLookup = {
  id: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  status: string;
  captured: boolean;
};

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentLookup | null> {
  const keys = razorpayKeys();
  if (!keys || !isValidRazorpayPaymentId(paymentId)) return null;
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: authHeader(keys.keyId, keys.keySecret) },
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("[razorpay] Payment lookup failed", res.status);
    return null;
  }
  const data = (await res.json()) as {
    id?: string;
    order_id?: string;
    amount?: number;
    currency?: string;
    status?: string;
    captured?: boolean | string | number;
  };
  if (!data.id || !data.order_id || typeof data.amount !== "number" || !data.status) return null;
  return {
    id: data.id,
    orderId: data.order_id,
    amountPaise: data.amount,
    currency: data.currency || "INR",
    status: data.status,
    captured: data.captured === true || data.captured === 1 || data.captured === "1" || data.status === "captured",
  };
}
