"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BRAND, brandWhatsApp } from "@/lib/constants";
import { readJson } from "@/lib/safeJson";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  replies: { id: string; authorName: string; authorRole: string; message: string }[];
};

export default function SupportPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ subject: "", message: "", email: "" });
  const [done, setDone] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reply, setReply] = useState<Record<string, string>>({});

  useEffect(() => {
    if (session?.user.email) {
      setForm((current) => (current.email ? current : { ...current, email: session.user.email || "" }));
    }
  }, [session?.user.email]);

  const load = () =>
    fetch("/api/support")
      .then((res) => readJson<{ tickets?: Ticket[] }>(res, { tickets: [] }))
      .then((data) => setTickets(data.tickets || []));

  useEffect(() => {
    load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setDone(
      res.ok
        ? "Query sent. The kitchen got WhatsApp + email, and a confirmation is on your inbox."
        : "Could not send your ticket. Please try again."
    );
    if (res.ok) {
      setForm({ subject: "", message: "", email: form.email });
      load();
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="heading-underline font-display text-3xl font-bold">Customer support</h1>
      <p className="mt-3 text-brand-cream/65">
        Submit a query and the kitchen gets it on WhatsApp and email. You get an email confirmation right away.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="card-surface p-4 text-sm">
          Call<br /><span className="text-brand-gold">{BRAND.phone}</span>
        </a>
        <a href={`mailto:${BRAND.email}`} className="card-surface p-4 text-sm">
          Email<br /><span className="break-all text-brand-gold">{BRAND.email}</span>
        </a>
        <a
          href={`https://wa.me/${brandWhatsApp()}?text=${encodeURIComponent("Hi Wokora Foods, I need some help.")}`}
          className="card-surface p-4 text-sm"
        >
          WhatsApp<br /><span className="text-brand-gold">Chat now</span>
        </a>
      </div>
      <form onSubmit={submit} className="card-surface mt-8 space-y-4 p-6">
        <input
          required
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="Your email — confirmation comes here"
          className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-red"
        />
        <input
          required
          value={form.subject}
          onChange={(event) => setForm({ ...form, subject: event.target.value })}
          placeholder="Subject — e.g. Order #012 late"
          className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-red"
        />
        <textarea
          required
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          placeholder="Tell us what happened"
          rows={5}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-red"
        />
        {done && <p className="text-sm text-brand-gold">{done}</p>}
        <button className="btn-glow w-full px-6 py-3 sm:w-auto">Send ticket</button>
      </form>

      <div className="mt-10 space-y-4">
        <h2 className="font-display text-xl">Your cases</h2>
        {tickets.map((ticket) => (
          <article key={ticket.id} className="card-surface p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <p className="min-w-0 break-words font-display">{ticket.subject}</p>
              <span className="shrink-0 text-xs uppercase text-brand-gold">{ticket.status}</span>
            </div>
            <p className="mt-2 text-sm text-brand-cream/70">{ticket.message}</p>
            {ticket.replies.map((row) => (
              <p key={row.id} className="mt-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
                <span className="text-brand-gold">{row.authorName}: </span>
                {row.message}
              </p>
            ))}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={reply[ticket.id] || ""}
                onChange={(event) => setReply((current) => ({ ...current, [ticket.id]: event.target.value }))}
                placeholder="Reply to kitchen"
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <button
                type="button"
                className="min-h-11 shrink-0 rounded-full border border-brand-gold/40 px-4 py-2 text-sm text-brand-gold"
                onClick={async () => {
                  if (!reply[ticket.id]) return;
                  await fetch(`/api/support/${ticket.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: reply[ticket.id] }),
                  });
                  setReply((current) => ({ ...current, [ticket.id]: "" }));
                  load();
                }}
              >
                Reply
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
