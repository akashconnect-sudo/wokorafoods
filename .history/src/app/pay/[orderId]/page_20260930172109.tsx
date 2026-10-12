"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { displayOrderNumber, formatINR } from "@/lib/constants";
import { userFacingError } from "@/lib/publicError";

type Order = {
  id: string;
  serialNumber: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string | null;
};

type UpiApp = {
  id: string;
  name: string;
  hint: string;
  color: string;
};

type UpiPayload = {
  valid: boolean;
  payeeName: string;
  payToken?: string;
  qrDataUrl: string;
  apps: UpiApp[];
};

export default function PayPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [method, setMethod] = useState<"upi" | "card">("upi");
  const [upi, setUpi] = useState<UpiPayload | null>(null);
  const [upiReady, setUpiReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [opened, setOpened] = useState("");
  const [payToken, setPayToken] = useState("");
  const [savingFail, setSavingFail] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/orders/${params.orderId}`, { cache: "no-store", credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.order) return;
        if (typeof data.payToken === "string") setPayToken(data.payToken);
        setOrder(data.order);
        if (data.order.paymentMethod === "card") setMethod("card");
        if (data.order.paymentStatus === "paid" || data.order.paymentStatus === "pay_at_counter") {
          router.replace(`/order/${params.orderId}`);
        }
      })
      .catch(() => undefined);

    fetch(`/api/orders/${params.orderId}/upi`, { cache: "no-store", credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.valid === "boolean") setUpi(data);
        if (typeof data?.payToken === "string") setPayToken(data.payToken);
      })
      .catch(() => undefined)
      .finally(() => setUpiReady(true));
  }, [params.orderId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const openUpi = (appId: string, label: string) => {
    setOpened(label);
    window.location.href = `/api/orders/${params.orderId}/upi/open?app=${encodeURIComponent(appId)}`;
  };

  const markPayment = async (paid: boolean) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${params.orderId}`, {
        method: "PATCH",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pay: paid,
          payToken,
          paymentMethod: method,
          upiApp: opened,
          failureReason: paid ? "" : "Payment failed or was cancelled in the UPI app",
        }),
      });
      if (!res.ok) {
        setError(userFacingError("Payment could not be saved. Please sign in and try again."));
        return false;
      }
      return true;
    } catch {
      setError(userFacingError("Network error. Check the connection and try again."));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const pay = async (event?: FormEvent) => {
    event?.preventDefault();
    const ok = await markPayment(true);
    if (ok) router.push(`/order/${params.orderId}`);
  };

  const markFailed = async () => {
    setSavingFail(true);
    const ok = await markPayment(false);
    setSavingFail(false);
    if (ok) router.push("/account/orders");
  };

  if (!order) return <div className="px-4 py-20 text-center">Loading payment...</div>;

  return (
    <div className="page-bottom mx-auto max-w-lg page-pad py-8 sm:py-12">
      <h1 className="heading-underline font-display text-3xl font-bold">Pay · Wokora Foods</h1>
      <p className="mt-4 text-brand-gold">
        Order {displayOrderNumber(order.serialNumber)} · {formatINR(order.totalAmount)}
      </p>
      <div className="mt-6 flex gap-2">
        {(["upi", "card"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMethod(value)}
            className={`flex-1 rounded-full py-2 ${method === value ? "bg-brand-red" : "border border-white/10"}`}
          >
            {value === "upi" ? "UPI apps" : "Card"}
          </button>
        ))}
      </div>
      <form onSubmit={pay} className="card-surface mt-6 space-y-5 p-4 sm:p-6">
        {method === "upi" ? (
          <div className="space-y-5">
            {!upiReady ? (
              <p className="text-center text-sm text-brand-cream/60">Loading UPI apps...</p>
            ) : !upi?.valid ? (
              <div className="space-y-3 text-center">
                <p className="rounded-2xl border border-brand-gold/30 bg-brand-gold/10 px-4 py-3 text-sm text-brand-gold">
                  Could not load UPI apps. Refresh the page, or add the cafe UPI ID in Kitchen settings.
                </p>
                <button type="button" onClick={() => { setUpiReady(false); load(); }} className="text-sm text-brand-gold">
                  Retry
                </button>
              </div>
            ) : (
              <>
                {upi.qrDataUrl ? (
                  <div className="text-center">
                    <div className="mx-auto w-fit overflow-hidden rounded-2xl bg-white p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={upi.qrDataUrl} alt="Pay Wokora Foods" className="mx-auto h-auto w-full max-w-48" />
                    </div>
                    <p className="mt-3 font-display text-lg font-semibold">{upi.payeeName}</p>
                    <p className="mt-1 text-sm text-brand-cream/70">
                      Scan with any UPI app, or tap an app below on your phone.
                    </p>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => openUpi("any", "UPI")}
                  className="btn-glow w-full py-3"
                >
                  Pay Wokora Foods
                </button>
                <p className="text-center text-xs text-brand-cream/50">
                  Opens GPay, PhonePe, Paytm, BHIM, and other UPI apps on this phone.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {upi.apps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => openUpi(app.id, app.name)}
                      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:border-brand-gold/40"
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
                        style={{ background: app.color }}
                      >
                        {app.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{app.name}</span>
                        <span className="block text-[11px] text-brand-cream/50">{app.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
                {opened ? (
                  <p className="text-center text-sm text-brand-cream/70">
                    Complete payment to Wokora Foods, then confirm below.
                  </p>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <>
            <input required placeholder="Card number" className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3" />
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="MM/YY" className="rounded-full border border-white/10 bg-white/5 px-4 py-3" />
              <input required placeholder="CVV" className="rounded-full border border-white/10 bg-white/5 px-4 py-3" />
            </div>
            <input required placeholder="Name on card" className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3" />
          </>
        )}
        {error && <p className="text-sm text-brand-red">{error}</p>}
        {order.paymentStatus === "failed" ? (
          <p className="text-sm text-brand-red">Last attempt failed. Retry below, or open this bill in My Account.</p>
        ) : null}
        <button disabled={loading || (method === "upi" && upiReady && !upi?.valid)} className="btn-glow w-full py-3">
          {loading
            ? "Saving..."
            : method === "upi"
              ? `I've paid ${formatINR(order.totalAmount)}`
              : `Pay ${formatINR(order.totalAmount)}`}
        </button>
        <button
          type="button"
          disabled={loading || savingFail}
          onClick={markFailed}
          className="w-full rounded-full border border-brand-red/40 py-3 text-sm text-brand-red"
        >
          {savingFail ? "Saving..." : "Payment failed"}
        </button>
      </form>
    </div>
  );
}
