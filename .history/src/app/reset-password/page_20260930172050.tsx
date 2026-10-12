"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordField } from "@/components/auth/PasswordField";
import { userFacingError } from "@/lib/publicError";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (!res.ok) {
      setError(userFacingError("Reset request expired"));
      return;
    }
    router.push("/login");
  };

  return (
    <div className="auth-panel min-h-[calc(100svh-3.5rem)] sm:min-h-[calc(100svh-4rem)]">
      <div className="auth-card">
        <h1 className="heading-underline font-display text-2xl font-bold xs:text-3xl">New password</h1>
        <form onSubmit={submit} className="mt-6 space-y-4 xs:mt-8">
          <PasswordField
            value={password}
            onChange={setPassword}
            placeholder="New password"
            autoComplete="new-password"
          />
          {error && <p className="break-words text-sm text-brand-red">{error}</p>}
          <button className="btn-glow w-full py-3">Update password</button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
