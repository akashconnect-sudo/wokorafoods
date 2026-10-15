"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

export function GoogleAuthButton({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEnabled(Boolean(data?.google)))
      .catch(() => setEnabled(false));
  }, []);

  if (!enabled) return null;

  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
      className="mt-3 min-h-11 w-full rounded-full border border-white/15 px-4 py-3 text-sm"
    >
      Continue with Google
    </button>
  );
}
