import { createHash } from "crypto";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { loginSchema } from "./validations";
import { normalizeIdentifier } from "./phone";
import { DEFAULT_STORE_ID, ensureDefaultStore } from "./store";
import { verifyOtp } from "./otp";
import { loginKitchenAdmin } from "./kitchenAdmin";

function kitchenAdminEmail() {
  return process.env.KITCHEN_ADMIN_EMAIL?.trim().toLowerCase() || "";
}

function googlePhone(email: string) {
  const hash = createHash("sha256").update(email).digest("hex");
  const digits = BigInt(`0x${hash.slice(0, 12)}`).toString().padStart(9, "0").slice(0, 9);
  return `8${digits}`;
}

function sessionUser(user: {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as "customer" | "admin",
    storeId: DEFAULT_STORE_ID,
  };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Phone or Email",
      credentials: {
        identifier: { label: "Phone or Email", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "Email OTP", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await ensureDefaultStore();
        const identifier = normalizeIdentifier(parsed.data.identifier);
        const otpRaw = parsed.data.otp?.trim() || "";
        const otp = /^\d{4,8}$/.test(otpRaw) ? otpRaw : "";
        const password = parsed.data.password && parsed.data.password !== "undefined" ? parsed.data.password : "";

        if (otp) {
          if (!identifier.includes("@")) return null;
          const ok = await verifyOtp(identifier, otp, "login");
          if (!ok) return null;
          const user = await prisma.user.findFirst({
            where: { storeId: DEFAULT_STORE_ID, email: identifier },
          });
          if (!user) return null;
          if (!user.emailVerified) {
            await prisma.user.update({
              where: { id: user.id },
              data: { emailVerified: true },
            });
          }
          return sessionUser(user);
        }

        if (password) {
          const kitchenUser = await loginKitchenAdmin(identifier, password);
          if (kitchenUser) return sessionUser(kitchenUser);
        }

        const user = await prisma.user.findFirst({
          where: {
            storeId: DEFAULT_STORE_ID,
            OR: [{ phone: identifier }, { email: identifier.toLowerCase() }],
          },
        });

        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return sessionUser(user);
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user.email) return false;

      const email = user.email.toLowerCase();
      const isKitchen = kitchenAdminEmail() === email;

      try {
        await ensureDefaultStore();
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              emailVerified: true,
              name: existing.name || user.name || "Wokora Guest",
              ...(isKitchen ? { role: "admin" as const } : {}),
            },
          });
          return true;
        }

        await prisma.user.create({
          data: {
            name: user.name || "Wokora Guest",
            email,
            phone: googlePhone(email),
            passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
            role: isKitchen ? "admin" : "customer",
            emailVerified: true,
            storeId: DEFAULT_STORE_ID,
          },
        });
        return true;
      } catch (error) {
        console.error("[google-signin]", error);
        const linked = await prisma.user.findUnique({ where: { email } }).catch(() => null);
        return Boolean(linked);
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        if (url.startsWith("/login") || url.startsWith("/admin")) return `${baseUrl}${url}`;
        return `${baseUrl}/`;
      }
      if (url.startsWith(baseUrl)) {
        const path = url.slice(baseUrl.length) || "/";
        if (path.startsWith("/login") || path.startsWith("/admin")) return url;
        return `${baseUrl}/`;
      }
      return `${baseUrl}/`;
    },
    async jwt({ token, user }) {
      const email = (user?.email || token.email || "").toString().toLowerCase();
      const dbUser = email
        ? await prisma.user.findUnique({ where: { email } })
        : token.id
          ? await prisma.user.findUnique({ where: { id: String(token.id) } })
          : null;

      if (dbUser) {
        token.id = dbUser.id;
        token.phone = dbUser.phone;
        token.role = dbUser.role as "customer" | "admin";
        token.email = dbUser.email || token.email;
      } else if (user?.id) {
        token.id = user.id;
        token.phone = user.phone || "";
        token.role = (user.role as "customer" | "admin") || "customer";
      }
      token.storeId = DEFAULT_STORE_ID;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.phone = token.phone;
      session.user.role = token.role;
      session.user.storeId = DEFAULT_STORE_ID;
      return session;
    },
  },
};
