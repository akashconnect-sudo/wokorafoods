"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { TABLE_COUNT, displayOrderNumber, formatINR } from "@/lib/constants";
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
  if (status === "failed") return "bg-brand-yellow/30 text-brand-yellow border-brand-yellow/60";
  if (status === "pay_at_counter") return "bg-brand-gold/20 text-brand-gold border-brand-gold/40";
  return "bg-amber-500/20 text-amber-200 border-amber-400/40";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [eta, setEta] = useState<Record<string, string>>({});
  const [tables, setTables] = useState<{ number: string; occupied: boolean }[]>([]);
  const [assign, setAssign] = useState<Record<string, string>>({});
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
    const loadTables = () =>
      fetch("/api/tables")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data?.tables)) setTables(data.tables);
        })
        .catch(() => undefined);
    loadTables();
    const timer = setInterval(() => {
      load();
      loadTables();
    }, 2000);
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

  const assignTable = async (id: string) => {
    const tableNumber = assign[id];
    if (!tableNumber) return;
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableNumber }),
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
              className={`card-surface p-5 ${unpaid ? "border border-brand-yellow/40" : ""}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-3xl text-brand-gold">{displayOrderNumber(order.serialNumber)}</p>
                  <p className="break-words text-sm text-brand-cream/60">
                    {order.user.name} · {order.user.phone}
                  </p>
                  <p className="text-sm text-brand-gold">
                    {order.type === "dine_in"
                      ? order.tableNumber
                        ? `Table ${order.tableNumber}`
                        : "Table pending"
                      : "Takeaway"}{" "}
                    · {formatINR(order.totalAmount)}
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
                  <span className="rounded-full bg-brand-yellow/20 px-3 py-1 text-xs uppercase">
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
              {order.type === "dine_in" ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <select
                    value={assign[order.id] || order.tableNumber || ""}
                    onChange={(event) => setAssign((current) => ({ ...current, [order.id]: event.target.value }))}
                    className="field-input sm:w-auto"
                  >
                    <option value="">Choose table</option>
                    {Array.from({ length: TABLE_COUNT }, (_, index) => String(index + 1)).map((table) => {
                      const occupied =
                        tables.find((row) => row.number === table)?.occupied &&
                        order.tableNumber !== table;
                      return (
                        <option key={table} value={table}>
                          {occupied ? `Table ${table} · Full` : `Table ${table} · Available`}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={() => assignTable(order.id)}
                    className="min-h-11 w-full rounded-full border border-brand-gold/40 px-3 py-2 text-sm text-brand-gold sm:w-auto"
                  >
                    Allocate
                  </button>
                </div>
              ) : null}
              <form onSubmit={(event) => sendEta(event, order.id)} className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <input
                  required
                  type="number"
                  min={1}
                  max={180}
                  value={eta[order.id] || ""}
                  onChange={(event) => setEta((current) => ({ ...current, [order.id]: event.target.value }))}
                  placeholder="Minutes"
                  className="field-input sm:w-28"
                />
                <button className="min-h-11 w-full rounded-full bg-brand-gold px-3 py-2 text-sm text-black sm:w-auto">
                  Send time to customer
                </button>
              </form>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <select
                  value={order.status}
                  onChange={(event) => updateStatus(order.id, event.target.value)}
                  className="field-input sm:w-auto"
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
                    className="min-h-11 w-full rounded-full border border-emerald-400/40 px-3 py-2 text-sm text-emerald-300 sm:w-auto"
                  >
                    Paid
                  </button>
                ) : null}
                <button
                  onClick={() => reprint(order.id)}
                  className="min-h-11 w-full rounded-full border border-brand-gold/40 px-3 py-2 text-sm text-brand-gold sm:w-auto"
                >
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
