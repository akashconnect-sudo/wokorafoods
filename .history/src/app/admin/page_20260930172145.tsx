"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { displayOrderNumber, formatINR } from "@/lib/constants";
import { kitchenStatusLabel, paymentMethodLabel, paymentStatusLabel } from "@/lib/orderLabels";
import { printReceiptHtml } from "@/lib/browserPrint";

type Order = {
  id: string;
  serialNumber: number;
  status: string;
  tableNumber: string | null;
  type: string;
  paymentStatus: string;
  paymentMethod: string | null;
  etaMinutes: number | null;
  totalAmount: number;
  createdAt: string;
  user: { name: string; phone: string };
  items: { id?: string; quantity: number; priceAtOrder?: number; customization?: string; menuItem: { name: string } }[];
};

const STATUSES = ["placed", "preparing", "ready", "served", "cancelled"];

function paymentTone(status: string) {
  if (status === "paid") return "bg-emerald-500/20 text-emerald-300 border-emerald-400/40";
  if (status === "failed") return "bg-brand-red/25 text-brand-red border-brand-red/50";
  if (status === "pay_at_counter") return "bg-brand-gold/20 text-brand-gold border-brand-gold/40";
  return "bg-amber-500/20 text-amber-200 border-amber-400/40";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [eta, setEta] = useState<Record<string, string>>({});
  const known = useRef(new Set<string>());
  const primed = useRef(false);

  const load = () =>
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        const next: Order[] = data.orders || [];
        if (!primed.current) {
          next.forEach((order) => known.current.add(order.id));
          primed.current = true;
        } else {
          const fresh = next.filter((order) => !known.current.has(order.id));
          fresh.forEach((order) => known.current.add(order.id));
          if (fresh.length && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            const order = fresh[0];
            new Notification(`New order ${displayOrderNumber(order.serialNumber)}`, {
              body: `${paymentStatusLabel(order.paymentStatus)} · ${formatINR(order.totalAmount)}`,
            });
          }
        }
        setOrders(next);
      })
      .catch(() => undefined);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
    load();
    const timer = setInterval(load, 2000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const markPaid = async (id: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "paid" }),
    });
    load();
  };

  const sendEta = async (event: FormEvent, id: string) => {
    event.preventDefault();
    const minutes = Number(eta[id]);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etaMinutes: minutes, status: "preparing" }),
    });
    setEta((current) => ({ ...current, [id]: "" }));
    load();
  };

  const reprint = async (id: string) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reprint: true }),
    });
    const data = await res.json();
    if (data.html) printReceiptHtml(data.html);
  };

  return (
    <div className="page-bottom mx-auto max-w-7xl page-pad py-6 sm:py-10">
      <h1 className="heading-underline font-display text-3xl font-bold">Live orders</h1>
      <p className="mt-3 text-sm text-brand-cream/60">
        Every customer order appears here immediately, with live payment status. Newest orders stay on top.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {orders.map((order) => {
          const unpaid = order.paymentStatus === "pending" || order.paymentStatus === "failed";
          return (
            <article
              key={order.id}
              className={`card-surface p-5 ${unpaid ? "border border-brand-red/40" : ""}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-3xl text-brand-gold">{displayOrderNumber(order.serialNumber)}</p>
                  <p className="break-words text-sm text-brand-cream/60">
                    {order.user.name} · {order.user.phone}
                  </p>
                  <p className="text-sm text-brand-gold">
                    {order.type === "dine_in" ? `Table ${order.tableNumber}` : "Takeaway"} · {formatINR(order.totalAmount)}
                  </p>
                  <p className="mt-1 text-xs text-brand-cream/50">
                    {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    {order.etaMinutes ? ` · ETA ${order.etaMinutes} min` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className={`max-w-full whitespace-normal rounded-full border px-3 py-1 text-left text-xs font-semibold uppercase tracking-wide ${paymentTone(order.paymentStatus)}`}>
                    {paymentStatusLabel(order.paymentStatus)}
                    {order.paymentMethod ? ` · ${paymentMethodLabel(order.paymentMethod)}` : ""}
                  </span>
                  <span className="rounded-full bg-brand-red/20 px-3 py-1 text-xs uppercase">
                    {kitchenStatusLabel(order.status)}
                  </span>
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-brand-cream/75">
                {order.items.map((item, index) => (
                  <li key={item.id || `${item.menuItem.name}-${index}`}>
                    <div className="flex justify-between gap-3">
                      <span>
                        {item.quantity} × {item.menuItem.name}
                      </span>
                      {item.priceAtOrder ? <span>{formatINR(item.priceAtOrder * item.quantity)}</span> : null}
                    </div>
                    {item.customization ? (
                      <p className="mt-0.5 text-xs text-brand-gold/80">{item.customization}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <form onSubmit={(event) => sendEta(event, order.id)} className="mt-4 flex flex-wrap items-center gap-2">
                <input
                  required
                  type="number"
                  min={1}
                  max={180}
                  value={eta[order.id] || ""}
                  onChange={(event) => setEta((current) => ({ ...current, [order.id]: event.target.value }))}
                  placeholder="Minutes"
                  className="w-24 rounded-full border border-white/10 bg-ink px-3 py-1.5 text-sm"
                />
                <button className="min-h-11 w-full rounded-full bg-brand-gold px-3 py-2 text-sm text-black sm:w-auto">
                  Send time to customer
                </button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                <select
                  value={order.status}
                  onChange={(event) => updateStatus(order.id, event.target.value)}
                  className="rounded-full border border-white/10 bg-ink px-3 py-1.5 text-sm"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {kitchenStatusLabel(status)}
                    </option>
                  ))}
                </select>
                {order.paymentStatus !== "paid" ? (
                  <button
                    type="button"
                    onClick={() => markPaid(order.id)}
                    className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-sm text-emerald-300"
                  >
                    Mark paid
                  </button>
                ) : null}
                <button onClick={() => reprint(order.id)} className="rounded-full border border-brand-gold/40 px-3 py-1.5 text-sm text-brand-gold">
                  Print receipt
                </button>
              </div>
            </article>
          );
        })}
        {orders.length === 0 && (
          <p className="text-brand-cream/50 md:col-span-2">
            No live orders yet. As soon as a customer places an order, it shows here with payment status.
          </p>
        )}
      </div>
    </div>
  );
}
