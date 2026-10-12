"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { readJson } from "@/lib/safeJson";
import { ThemePicker } from "@/components/theme/ThemePicker";

type Ticket = {
  id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  replies: { id: string; authorName: string; authorRole: string; message: string; createdAt: string }[];
};

export default function KitchenSettingsPage() {
  const [settings, setSettings] = useState({
    name: "Wokora Foods",
    phone: "",
    email: "",
    address: "",
    hours: "",
  });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState("");

  const load = useCallback(() => {
    fetch("/api/cafe-settings")
      .then((res) => readJson<{ settings?: typeof settings }>(res, {}))
      .then((data) =>
        data.settings &&
        setSettings({
          name: data.settings.name || "Wokora Foods",
          phone: data.settings.phone || "",
          email: data.settings.email || "",
          address: data.settings.address || "",
          hours: data.settings.hours || "",
        }),
      );
    fetch("/api/support")
      .then((res) => readJson<{ tickets?: Ticket[] }>(res, { tickets: [] }))
      .then((data) => setTickets(data.tickets || []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveShop = async (event: FormEvent) => {
    event.preventDefault();
    const res = await fetch("/api/cafe-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(res.ok ? "Shop settings saved." : "Could not save.");
  };

  const sendReply = async (id: string, status?: string) => {
    await fetch(`/api/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply[id], status }),
    });
    setReply((current) => ({ ...current, [id]: "" }));
    load();
  };

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div className="page-bottom mx-auto max-w-6xl space-y-10 page-pad py-6 sm:space-y-12 sm:py-10">
      <section>
        <h1 className="heading-underline font-display text-3xl font-bold">Kitchen settings</h1>
        <p className="mt-3 text-sm text-brand-cream/60">
          Shop details and customer support cases. Replies sent from here notify the customer.
        </p>
        <div className="card-surface mt-6 p-5">
          <ThemePicker />
        </div>
        <form onSubmit={saveShop} className="card-surface mt-6 grid gap-3 p-5 md:grid-cols-2">
          <input value={settings.name} onChange={(event) => setSettings({ ...settings, name: event.target.value })} className="rounded-full border border-white/10 bg-white/5 px-4 py-2" placeholder="Shop name" />
          <input value={settings.phone} onChange={(event) => setSettings({ ...settings, phone: event.target.value })} className="rounded-full border border-white/10 bg-white/5 px-4 py-2" placeholder="Phone" />
          <input value={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.value })} className="rounded-full border border-white/10 bg-white/5 px-4 py-2" placeholder="Email" />
          <input value={settings.hours} onChange={(event) => setSettings({ ...settings, hours: event.target.value })} className="rounded-full border border-white/10 bg-white/5 px-4 py-2" placeholder="Hours" />
          <textarea value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 md:col-span-2" placeholder="Address" />
          <p className="text-sm text-brand-cream/50 md:col-span-2">
            Customer checkout shows Wokora Foods only. Bank settlement is stored on the server, not in the browser.
          </p>
          {saved && <p className="text-sm text-brand-gold md:col-span-2">{saved}</p>}
          <button className="btn-glow w-full px-5 py-2 sm:w-fit">Save shop</button>
          <Link href="/admin/menu" className="self-center text-sm text-brand-gold">Edit menu →</Link>
        </form>
      </section>

      <section>
        <h2 className="heading-underline font-display text-2xl font-bold">Support cases</h2>
        <div className="mt-6 space-y-4">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="card-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg">{ticket.subject}</p>
                  <p className="text-sm text-brand-cream/60">
                    {ticket.name} · {ticket.phone} · {new Date(ticket.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="rounded-full bg-brand-red/20 px-3 py-1 text-xs uppercase">{ticket.status}</span>
              </div>
              <p className="mt-3 text-sm text-brand-cream/80">{ticket.message}</p>
              <div className="mt-4 space-y-2">
                {ticket.replies.map((row) => (
                  <p key={row.id} className={`rounded-xl px-3 py-2 text-sm ${row.authorRole === "kitchen" ? "bg-brand-gold/10" : "bg-white/5"}`}>
                    <span className="font-semibold">{row.authorName}: </span>
                    {row.message}
                  </p>
                ))}
              </div>
              <textarea
                value={reply[ticket.id] || ""}
                onChange={(event) => setReply((current) => ({ ...current, [ticket.id]: event.target.value }))}
                placeholder="Reply to customer..."
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
              />
              <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap">
                <button onClick={() => sendReply(ticket.id, "replied")} className="btn-glow w-full px-4 py-2 sm:w-auto">
                  Send reply
                </button>
                <button onClick={() => setStatus(ticket.id, "open")} className="min-h-11 rounded-full border border-white/15 px-3 py-2 sm:min-h-0">
                  Mark open
                </button>
                <button onClick={() => setStatus(ticket.id, "in_progress")} className="min-h-11 rounded-full border border-white/15 px-3 py-2 sm:min-h-0">
                  In progress
                </button>
                <button onClick={() => setStatus(ticket.id, "closed")} className="min-h-11 rounded-full border border-brand-red/40 px-3 py-2 text-brand-red sm:min-h-0">
                  Close case
                </button>
              </div>
            </article>
          ))}
          {tickets.length === 0 && <p className="text-brand-cream/50">No customer cases yet.</p>}
        </div>
      </section>
    </div>
  );
}
