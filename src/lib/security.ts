import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/constants";
const PAY_METHODS = new Set(["upi", "card", "cash"]);
const PAY_STATUSES = new Set(["pending", "paid", "failed", "pay_at_counter"]);

const hits = new Map<string, { count: number; resetAt: number }>();

function secret() {
  return process.env.NEXTAUTH_SECRET || process.env.PAYMENT_HMAC_SECRET || "";
}

export function allowedOrigins() {
  const list = [getSiteUrl(), process.env.NEXTAUTH_URL, "http://localhost:3000", "http://127.0.0.1:3000"];
  const origins = new Set<string>();
  for (const raw of list) {
    if (!raw) continue;
    try {
      origins.add(new URL(raw).origin);
    } catch {
      // skip invalid
    }
  }
  return origins;
}

export function requestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const referer = request.headers.get("referer");
  if (!referer) return "";
  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}

export function assertSameOrigin(request: Request) {
  const origin = requestOrigin(request);
  if (!origin || !allowedOrigins().has(origin)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }
  return null;
}

export function assertSameOriginIfPresent(request: Request) {
  const origin = requestOrigin(request);
  if (!origin) return null;
  if (!allowedOrigins().has(origin)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }
  return null;
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now > row.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  row.count += 1;
  if (row.count > limit) {
    return NextResponse.json({ error: "Too many payment attempts. Wait and try again." }, { status: 429 });
  }
  return null;
}

export function paymentToken(orderId: string, userId: string) {
  const key = secret();
  if (!key) return "";
  return createHmac("sha256", key).update(`pay:${orderId}:${userId}`).digest("hex").slice(0, 40);
}

export function verifyPaymentToken(orderId: string, userId: string, token?: string) {
  if (!token || typeof token !== "string") return false;
  const expected = paymentToken(orderId, userId);
  if (!expected || expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function safePayMethod(value: unknown, fallback: string) {
  const method = typeof value === "string" ? value : fallback;
  return PAY_METHODS.has(method) ? method : "upi";
}

export function safePayStatus(value: unknown) {
  return typeof value === "string" && PAY_STATUSES.has(value) ? value : "";
}

export function securityHeaders(headers: Headers) {
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-DNS-Prefetch-Control", "off");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), usb=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set("Origin-Agent-Cluster", "?1");
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https://api.razorpay.com https://checkout.razorpay.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://images.pexels.com https://*.googleusercontent.com",
      "font-src 'self' data:",
      "frame-src 'self' https://api.razorpay.com https://www.google.com https://maps.google.com https://www.google.co.in",
      process.env.NODE_ENV === "production"
        ? "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com"
        : "connect-src 'self' ws: wss: https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com",
      "worker-src 'self' blob:",
      ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
    ].join("; ")
  );
  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
}

export function withSecurityHeaders(response: NextResponse) {
  securityHeaders(response.headers);
  return response;
}
