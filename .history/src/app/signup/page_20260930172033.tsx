"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/ui/Logo";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { userFacingError } from "@/lib/publicError";

function lettersOnly(value: string) {
  return value.replace(/[^A-Za-z\s]/g, "").replace(/\s+/g, " ");
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpHint, setOtpHint] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const sendOtp = async () => {
    setError("");
    setOtpHint("");
    setSending(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(userFacingError(data.error || "Server Error"));
        return;
      }
      setOtpSent(true);
      setEmailVerified(false);
      setOtpHint("OTP sent.");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setVerifying(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp: form.otp, purpose: "signup", consume: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailVerified(false);
        setError(userFacingError(data.error || "Server Error"));
        return;
      }
      setEmailVerified(true);
      setOtpHint("Email verified.");
    } finally {
      setVerifying(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!emailVerified) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(userFacingError(typeof data.error === "string" ? data.error : "Server Error"));
      return;
    }
    await signIn("credentials", {
      identifier: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    router.push("/account");
    router.refresh();
  };

  return (
    <div className="auth-shell">
      <div className="relative hidden overflow-hidden bg-[url('https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center lg:block">
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative flex h-full flex-col justify-end p-8 xl:p-12">
          <p className="wall-art text-4xl xl:text-5xl">Good Food Good Vibes</p>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <Logo />
          <h1 className="mt-6 font-display text-2xl font-bold xs:mt-8 xs:text-3xl">Join Wokora Foods</h1>
          <p className="mt-2 text-sm text-brand-cream/60">Create your account to order from the booth.</p>
          <form onSubmit={submit} className="mt-6 space-y-3 xs:mt-8 xs:space-y-4">
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: lettersOnly(event.target.value) })}
              placeholder="Full name"
              autoComplete="name"
              className="field-input"
            />
            <input
              required
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: digitsOnly(event.target.value) })}
              placeholder="Phone number"
              inputMode="numeric"
              autoComplete="tel"
              className="field-input"
            />
            <div className="stack-actions">
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => {
                  setForm({ ...form, email: event.target.value });
                  setEmailVerified(false);
                  setOtpSent(false);
                }}
                placeholder="Email"
                autoComplete="email"
                className="field-input min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={sendOtp}
                disabled={sending || !form.email.includes("@")}
                className="min-h-11 shrink-0 rounded-full border border-white/15 px-4 py-3 text-sm sm:w-auto"
              >
                {sending ? "Sending..." : emailVerified ? "Verified" : "Send OTP"}
              </button>
            </div>
            {otpSent && !emailVerified ? (
              <div className="stack-actions">
                <input
                  required
                  inputMode="numeric"
                  value={form.otp}
                  onChange={(event) => setForm({ ...form, otp: event.target.value.replace(/\D/g, "").slice(0, 6) })}
                  placeholder="OTP"
                  autoComplete="one-time-code"
                  className="field-input min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={verifying || form.otp.length < 4}
                  className="min-h-11 shrink-0 rounded-full border border-brand-gold/40 px-4 py-3 text-sm text-brand-gold sm:w-auto"
                >
                  {verifying ? "Checking..." : "Verify OTP"}
                </button>
              </div>
            ) : null}
            {otpHint ? <p className="text-xs text-brand-gold">{otpHint}</p> : null}
            <PasswordField
              value={form.password}
              onChange={(password) => setForm({ ...form, password })}
              autoComplete="new-password"
            />
            {error ? <p className="break-words text-sm text-brand-red">{error}</p> : null}
            <button disabled={loading || !emailVerified} className="btn-glow w-full py-3">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <GoogleAuthButton />
          <p className="mt-4 text-sm text-brand-cream/70">
            Already have an account? <Link href="/login" className="text-brand-gold">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
