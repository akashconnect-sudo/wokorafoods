"use client";

import { useEffect, useState } from "react";
import { TABLE_COUNT, displayOrderNumber, formatINR } from "@/lib/constants";

type TableRow = {
  number: string;
  occupied: boolean;
  order: { id: string; serialNumber: number; totalAmount: number; userName: string } | null;
};

type WaitingOrder = {
  id: string;
  serialNumber: number;
  totalAmount: number;
  userName: string;
};

export default function KitchenTablesPage() {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [waiting, setWaiting] = useState<WaitingOrder[]>([]);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const load = () =>
    fetch("/api/tables")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setTables(Array.isArray(data.tables) ? data.tables : []);
        setWaiting(Array.isArray(data.waiting) ? data.waiting : []);
      })
      .catch(() => undefined);

  useEffect(() => {
    load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, []);

  const allocate = async (tableNumber: string) => {
    const orderId = pick[tableNumber];
    if (!orderId) {
      setMessage("Choose an order to allocate.");
      return;
    }
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableNumber }),
    });
    if (!res.ok) {
      setMessage("Could not allocate table.");
      return;
    }
    setPick((current) => ({ ...current, [tableNumber]: "" }));
    setMessage(`Table ${tableNumber} allocated.`);
    load();
  };

  const board =
    tables.length > 0
      ? tables
      : Array.from({ length: TABLE_COUNT }, (_, index) => ({
          number: String(index + 1),
          occupied: false,
          order: null,
        }));

  return (
    <div className="page-bottom mx-auto max-w-5xl page-pad py-8 sm:py-12">
      <h1 className="heading-underline font-display text-3xl font-bold">Tables</h1>
      <p className="mt-3 text-sm text-brand-cream/60">Only 3 tables. Mark Full or Allocate so the customer gets the assigned table.</p>
      {message ? <p className="mt-3 text-sm text-brand-gold">{message}</p> : null}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {board.map((table) => (
          <article key={table.number} className="card-surface p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold sm:text-2xl">Table {table.number}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  table.occupied
                    ? "border border-brand-yellow/50 bg-brand-yellow/20 text-brand-yellow"
                    : "border border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                }`}
              >
                {table.occupied ? "Full" : "Allocate"}
              </span>
            </div>

            {table.occupied && table.order ? (
              <div className="mt-4 text-sm text-brand-cream/75">
                <p className="font-display text-xl text-brand-gold">{displayOrderNumber(table.order.serialNumber)}</p>
                <p className="break-words">{table.order.userName}</p>
                <p>{formatINR(table.order.totalAmount)}</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {waiting.length === 0 ? (
                  <p className="text-sm text-brand-cream/55">No waiting dine-in orders.</p>
                ) : (
                  <>
                    <select
                      value={pick[table.number] || ""}
                      onChange={(event) =>
                        setPick((current) => ({ ...current, [table.number]: event.target.value }))
                      }
                      className="field-input"
                    >
                      <option value="">Choose order</option>
                      {waiting.map((order) => (
                        <option key={order.id} value={order.id}>
                          {displayOrderNumber(order.serialNumber)} · {order.userName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => allocate(table.number)}
                      className="btn-glow w-full px-4 py-2.5 text-sm"
                    >
                      Allocate
                    </button>
                  </>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
