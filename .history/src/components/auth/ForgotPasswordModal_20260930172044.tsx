"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { userFacingError } from "@/lib/publicError";

export function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(userFacingError(typeof data.error === "string" ? data.error : "Server Error"));
        return;
      }
      setDone(true);
    } catch {
      setError("Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-end px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 xs:place-items-center xs:px-4 xs:pb-4 sm:px-6">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/65" onClick={onClose} />
      <div className="relative max-h-[min(90svh,36rem)] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-ink p-5 shadow-neon xs:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold xs:text-2xl">Reset password</h2>
            <p className="mt-1 text-sm text-brand-cream/60">
              {done ? "Open the link we sent to set a new password." : "Enter the email on your account."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-brand-cream/50 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {done ? (
          <button type="button" onClick={onClose} className="btn-glow mt-6 w-full py-3">
            Back to login
          </button>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="field-input"
            />
            {error ? <p className="break-words text-sm text-brand-red">{error}</p> : null}
            <button disabled={loading} className="btn-glow w-full py-3">
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
