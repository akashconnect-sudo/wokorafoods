"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { userFacingError } from "@/lib/publicError";

export function PayOrderButton({ orderId, label }: { orderId: string; label: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    setError("");
    try {
      await openRazorpayCheckout(orderId);
      router.push(`/order/${orderId}`);
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      setError(message === "Payment cancelled" ? "Payment cancelled." : userFacingError(message));
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={pay} disabled={loading} className="rounded-full bg-brand-yellow px-4 py-2 text-sm text-black">
        {loading ? "Opening payment..." : label}
      </button>
      {error ? <span className="text-xs text-brand-yellow">{error}</span> : null}
    </span>
  );
}
