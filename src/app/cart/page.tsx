"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { GST_RATE, TABLE_COUNT, displayOrderNumber, formatINR } from "@/lib/constants";
import { cartSubtotal, useCartStore } from "@/store/cartStore";
import { useCartAccess } from "@/hooks/useCartAccess";
import { userFacingError } from "@/lib/publicError";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";

export default function CartPage() {
  const router = useRouter();
  const { status, isAdmin, canUseCart } = useCartAccess();
  const { items, increment, decrement, removeItem, tableNumber, setTableNumber, orderType, setOrderType, clear } =
    useCartStore();
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash">("upi");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cashOrder, setCashOrder] = useState<{ id: string; serialNumber: number; totalAmount: number; paymentStatus: string } | null>(null);
  const [tables, setTables] = useState<{ number: string; occupied: boolean }[]>([]);

  const subtotal = cartSubtotal(items);
  const tax = Math.round(subtotal * GST_RATE);
  const total = subtotal + tax;

  useEffect(() => {
    if (isAdmin) router.replace("/admin");
  }, [isAdmin, router]);

  useEffect(() => {
    if (orderType !== "dine_in") return;
    const loadTables = () =>
      fetch("/api/tables")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data?.tables)) setTables(data.tables);
        })
        .catch(() => undefined);
    loadTables();
    const timer = setInterval(loadTables, 5000);
    return () => clearInterval(timer);
  }, [orderType]);

  useEffect(() => {
    if (!cashOrder || cashOrder.paymentStatus === "paid") return;
    const load = () => {
      fetch(`/api/orders/${cashOrder.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.order) return;
          setCashOrder((current) =>
            current
              ? {
                  ...current,
                  paymentStatus: data.order.paymentStatus,
                  totalAmount: data.order.totalAmount,
                  serialNumber: data.order.serialNumber,
                }
              : current
          );
        })
        .catch(() => undefined);
    };
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [cashOrder?.id, cashOrder?.paymentStatus]);

  const placeOrder = async () => {
    if (!canUseCart) {
      router.push("/login?callbackUrl=/cart");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: orderType,
          tableNumber: orderType === "dine_in" ? tableNumber || undefined : undefined,
          notes,
          paymentMethod,
          items: items.map((item) => ({
            menuItemId: item.menuItemId || item.id.split("::")[0],
            quantity: item.quantity,
            selections: item.selections,
            customization: item.customization,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(userFacingError(typeof data.error === "string" ? data.error : "Could not place the order. Please sign in first."));
        return;
      }
      clear();
      if (paymentMethod === "cash") {
        setCashOrder({
          id: data.order.id,
          serialNumber: data.order.serialNumber,
          totalAmount: data.order.totalAmount,
          paymentStatus: data.order.paymentStatus || "pay_at_counter",
        });
        return;
      }
      try {
        await openRazorpayCheckout(data.order.id);
      } catch {
        // Order is already saved. The bill page can open Razorpay again.
      }
      router.push(`/order/${data.order.id}`);
    } catch {
      setError(userFacingError("Network error. Check the connection and try again."));
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="page-bottom page-pad py-20 text-center text-brand-cream/60">Loading cart...</div>;
  }

  if (isAdmin) {
    return <div className="page-bottom page-pad py-20 text-center text-brand-cream/60">Opening kitchen...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="page-bottom mx-auto max-w-3xl page-pad py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Login to use your cart</h1>
        <p className="mt-3 text-sm text-brand-cream/60">
          Add dishes, extras, and totals after you sign in. Kitchen login opens the orders board instead.
        </p>
        <Link href="/login?callbackUrl=/cart" className="btn-glow mt-6 inline-block px-6 py-3">
          Login
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !cashOrder) {
    return (
      <div className="page-bottom mx-auto max-w-3xl page-pad py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Your tray is empty</h1>
        <Link href="/menu" className="btn-glow mt-6 inline-block px-6 py-3">
          Browse menu
        </Link>
      </div>
    );
  }

  if (items.length === 0 && cashOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
        <div className="card-surface w-full max-w-md rounded-t-3xl border-b-0 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:rounded-2xl sm:border sm:p-6">
          <p className="font-display text-xl font-bold sm:text-2xl">
            {cashOrder.paymentStatus === "paid" ? "Paid" : "Pay at the counter"}
          </p>
          <p className="mt-2 font-display text-3xl text-brand-gold sm:text-4xl">{displayOrderNumber(cashOrder.serialNumber)}</p>
          <p className="mt-2 text-brand-gold">{formatINR(cashOrder.totalAmount)}</p>
          <p className="mt-3 text-sm text-brand-cream/70">
            {cashOrder.paymentStatus === "paid"
              ? "The kitchen confirmed this cash payment."
              : "Hand the cash to the counter. This stays here until the kitchen marks it paid."}
          </p>
          <button
            type="button"
            onClick={() => router.push(`/order/${cashOrder.id}`)}
            className="btn-glow mt-6 w-full py-3"
          >
            {cashOrder.paymentStatus === "paid" ? "View order" : "View bill"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bottom mx-auto grid w-full min-w-0 max-w-6xl gap-5 page-pad py-5 sm:gap-6 sm:py-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] lg:gap-8">
      <section className="min-w-0">
        <h1 className="heading-underline font-display text-2xl font-bold sm:text-3xl">Cart</h1>
        <div className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
          {items.map((item) => (
            <article key={item.id} className="card-surface flex min-w-0 gap-3 p-3 sm:gap-4 sm:p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-20">
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <h2 className="break-words font-display font-semibold leading-tight">{item.name}</h2>
                  {item.customization ? (
                    <p className="mt-0.5 line-clamp-2 break-words text-xs text-brand-cream/50">{item.customization}</p>
                  ) : null}
                  <p className="text-sm text-brand-gold">{formatINR(item.price)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <QuantityStepper
                    compact
                    value={item.quantity}
                    onIncrement={() => increment(item.id)}
                    onDecrement={() => decrement(item.id)}
                  />
                  <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-brand-yellow">
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="card-surface h-fit w-full min-w-0 max-w-full overflow-hidden p-4 sm:p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold sm:text-xl">Order summary</h2>

        <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-white/5 p-1.5">
          {(["dine_in", "takeaway"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setOrderType(type)}
              className={`min-h-11 min-w-0 rounded-xl px-2 py-2.5 text-center text-xs font-semibold leading-tight xs:text-sm ${
                orderType === type ? "bg-brand-yellow text-black" : "text-brand-cream"
              }`}
            >
              {type === "dine_in" ? "Dine-in" : "Takeaway"}
            </button>
          ))}
        </div>

        {orderType === "dine_in" ? (
          <label className="mt-4 block text-sm">
            Table
            <select
              value={tableNumber}
              onChange={(event) => setTableNumber(event.target.value)}
              className="field-input mt-2"
            >
              <option value="">Select table</option>
              {Array.from({ length: TABLE_COUNT }, (_, index) => String(index + 1)).map((table) => {
                const occupied = tables.find((row) => row.number === table)?.occupied;
                return (
                  <option key={table} value={table}>
                    {occupied ? `Table ${table} · Full` : `Table ${table} · Available`}
                  </option>
                );
              })}
            </select>
            <span className="mt-2 block text-xs leading-relaxed text-brand-cream/55">
              Free tables show as Available. Kitchen can re-assign after you order.
            </span>
          </label>
        ) : null}

        <div className="mt-4">
          <p className="text-sm">Payment</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([
              ["upi", "UPI"],
              ["cash", "Cash"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPaymentMethod(value)}
                className={`min-h-11 min-w-0 rounded-full px-3 py-2.5 text-center text-sm font-semibold ${
                  paymentMethod === value ? "bg-brand-yellow text-black" : "border border-white/10 text-brand-cream"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes for the kitchen"
          rows={3}
          className="mt-4 w-full max-w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none focus:border-brand-yellow sm:px-4"
        />

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0">Subtotal</dt>
            <dd className="min-w-0 break-all text-right">{formatINR(subtotal)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 text-brand-cream/60">
            <dt className="shrink-0">GST (5%)</dt>
            <dd className="min-w-0 break-all text-right">{formatINR(tax)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 font-display text-base sm:text-lg">
            <dt className="shrink-0">Total</dt>
            <dd className="min-w-0 break-all text-right text-brand-gold">{formatINR(total)}</dd>
          </div>
        </dl>

        {error ? <p className="mt-3 break-words text-sm text-brand-yellow">{error}</p> : null}

        <button
          type="button"
          onClick={placeOrder}
          disabled={loading}
          className="btn-glow mt-5 w-full max-w-full px-3 py-3 text-sm sm:text-base"
        >
          <span className="block whitespace-normal text-center leading-snug">
            {status !== "authenticated" || !canUseCart
              ? "Sign in to place your order"
              : loading
                ? "Placing order..."
                : paymentMethod === "cash"
                  ? "Place order · Pay at counter"
                  : "Proceed to payment"}
          </span>
        </button>
        <p className="mt-3 break-words text-xs leading-relaxed text-brand-cream/50">
          Your order prints a receipt at the cafe counter.
        </p>
      </aside>
    </div>
  );
}
