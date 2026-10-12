"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ThemePicker } from "@/components/theme/ThemePicker";
import { DietToggle, type DietPreference } from "@/components/menu/DietToggle";
import { OrderBill, type BillOrder } from "@/components/account/OrderBill";

export default function SettingsPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [diet, setDiet] = useState<DietPreference>("all");
  const [message, setMessage] = useState("");
  const [bills, setBills] = useState<BillOrder[]>([]);
  const [lastDelivered, setLastDelivered] = useState<BillOrder | null>(null);

  useEffect(() => {
    fetch("/api/account")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setForm({ name: data.user.name, email: data.user.email || "", password: "" });
          const saved = data.user.dietPreference as DietPreference;
          if (saved === "veg" || saved === "nonveg" || saved === "all") setDiet(saved);
          setBills(data.user.orders || []);
          setLastDelivered(data.user.lastDelivered || null);
        }
      });
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMessage(res.ok ? "Settings saved." : "Could not save settings.");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="heading-underline font-display text-3xl font-bold">Settings</h1>
      <p className="mt-3 text-sm text-brand-cream/60">Update your name, email, and password here. Your phone number is your cafe ID.</p>

      {lastDelivered ? (
        <div className="mt-8">
          <h2 className="font-display text-xl font-semibold">Last delivered</h2>
          <div className="mt-3">
            <OrderBill order={lastDelivered} compact />
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-xl font-semibold">Bills & payments</h2>
          <Link href="/account/orders" className="text-sm text-brand-gold">
            All bills →
          </Link>
        </div>
        <p className="mt-1 text-sm text-brand-cream/60">Paid and failed payments are stored in the cafe database.</p>
        <div className="mt-3 space-y-3">
          {bills.slice(0, 5).map((order) => (
            <OrderBill key={order.id} order={order} compact />
          ))}
          {bills.length === 0 ? <p className="text-sm text-brand-cream/50">No bills yet.</p> : null}
        </div>
      </div>
      <div className="card-surface mt-8 p-6">
        <p className="font-display text-lg font-semibold">Food preference</p>
        <p className="mt-1 mb-4 text-sm text-brand-cream/60">Saved only to this login.</p>
        <DietToggle
          value={diet}
          onChange={(next) => {
            setDiet(next);
            fetch("/api/account", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dietPreference: next }),
            }).catch(() => undefined);
          }}
        />
      </div>
      <div className="card-surface mt-6 p-6">
        <ThemePicker />
      </div>
      <form onSubmit={submit} className="card-surface mt-6 space-y-4 p-6">
        <label className="block text-sm">
          Name
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-red"
          />
        </label>
        <label className="block text-sm">
          Email (order updates)
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-red"
          />
        </label>
        <label className="block text-sm">
          New password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="Leave blank to keep current"
            className="mt-2 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-red"
          />
        </label>
        {message && <p className="text-sm text-brand-gold">{message}</p>}
        <button className="btn-glow w-full px-6 py-3 sm:w-auto">Save settings</button>
      </form>
    </div>
  );
}
