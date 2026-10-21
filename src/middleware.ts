import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withSecurityHeaders } from "@/lib/security";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;
  const isKitchen = path === "/admin" || path.startsWith("/admin/");
  const isAccount = path === "/account" || path.startsWith("/account/");

  if (isKitchen) {
    if (!token?.id) {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", "/admin");
      return withSecurityHeaders(NextResponse.redirect(login));
    }
    if (token.role !== "admin") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/", req.url)));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  if (isAccount) {
    if (!token?.id) {
      const login = new URL("/login", req.url);
      login.searchParams.set("callbackUrl", path);
      return withSecurityHeaders(NextResponse.redirect(login));
    }
    if (token.role === "admin") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/admin", req.url)));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/account",
    "/account/:path*",
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
