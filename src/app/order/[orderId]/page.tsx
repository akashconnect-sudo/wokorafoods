"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { brandWhatsApp, displayOrderNumber, formatINR } from "@/lib/constants";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/orderLabels";
import { PayOrderButton } from "@/components/order/PayOrderButton";

const STEPS = ["placed", "preparing", "ready", "served"] as const;

type Order = {
  id: string;
  serialNumber: number;
  status: string;
  tableNumber: string | null;
  type: string;
  paymentStatus: string;
  paymentMethod: string | null;
  etaMinutes: number | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  items: { id?: string; quantity: number; priceAtOrder: number; customization?: string; menuItem: { name: string } }[];
};

export default function OrderPage() {
  const params = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const load = () =>
      fetch(`/api/orders/${params.orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.order) {
            setOrder(data.order);
            setMissing(false);
            return;
          }
          setMissing(true);
        })
        .catch(() => setMissing(true));

    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [params.orderId]);

  if (!order && !missing) {
    return <div className="px-4 py-20 text-center text-brand-cream/60">Loading your order...</div>;
  }

  if (!order) {
    return <div className="px-4 py-20 text-center text-brand-cream/60">Order not found.</div>;
  }

  const stepIndex = Math.max(0, STEPS.indexOf(order.status as (typeof STEPS)[number]));
  const number = displayOrderNumber(order.serialNumber);
  const wa = `https://wa.me/${brandWhatsApp()}?text=${encodeURIComponent(
    `Hi Wokora Foods, I need help with order ${number}. Current status: ${order.status}.`
  )}`;

  return (
    <div className="page-bottom mx-auto max-w-2xl page-pad py-8 sm:py-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-brand-yellow shadow-neon"
      >
        <Check className="h-8 w-8" />
      </motion.div>
      <h1 className="text-center font-display text-3xl font-bold">Order received</h1>
      <p className="mt-2 text-center font-display text-4xl text-brand-gold">{number}</p>
      <p className="mt-2 text-center text-sm text-brand-cream/70">
        {order.etaMinutes
          ? `The kitchen expects this order in ${order.etaMinutes} minutes`
          : "You will be notified as soon as the kitchen sets a wait time"}
      </p>
      <p
        className={`mt-3 text-center text-xs font-semibold uppercase tracking-wide ${
          order.paymentStatus === "failed"
            ? "text-brand-yellow"
            : order.paymentStatus === "paid"
              ? "text-emerald-300"
              : "text-brand-cream/50"
        }`}
      >
        Payment: {paymentStatusLabel(order.paymentStatus)}
        {order.paymentMethod ? ` · ${paymentMethodLabel(order.paymentMethod)}` : ""}
      </p>
      {order.paymentStatus === "failed" ? (
        <p className="mt-2 text-center text-sm text-brand-yellow">Payment failed. Try again below — money is not deducted for a failed attempt.</p>
      ) : null}
      {(order.paymentStatus === "pending" || order.paymentStatus === "failed") && order.paymentMethod !== "cash" ? (
        <div className="mt-4 flex justify-center">
          <PayOrderButton orderId={order.id} label={order.paymentStatus === "failed" ? "Retry payment" : "Pay now"} />
        </div>
      ) : null}

      <div className="mt-8 flex justify-between gap-1">
        {STEPS.map((step, index) => (
          <div key={step} className="flex min-w-0 flex-1 flex-col items-center px-0.5">
            <div className={`h-3 w-3 shrink-0 rounded-full ${index <= stepIndex ? "bg-brand-yellow shadow-neon" : "bg-white/20"}`} />
            <p className="mt-2 text-center text-[9px] uppercase leading-tight tracking-wide text-brand-cream/60 xs:text-[10px] sm:text-[11px]">
              {step === "served" ? "Delivered" : step}
            </p>
          </div>
        ))}
      </div>

      <article className="card-surface mt-10 min-w-0 overflow-hidden p-4 font-mono text-sm sm:p-6">
        <p>Wokora Foods</p>
        <p>
          Type:{" "}
          {order.type === "dine_in"
            ? order.tableNumber
              ? `Dine-in · Table ${order.tableNumber}`
              : "Dine-in · Table assigning"
            : "Takeaway"}
        </p>
        <p className="text-brand-cream/60">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
        <ul className="mt-4 space-y-2 border-y border-dashed border-white/15 py-4">
          {order.items.map((item, index) => (
            <li key={item.id || `${item.menuItem.name}-${index}`} className="flex justify-between gap-3">
              <span className="min-w-0 flex-1 break-words pr-2">
                {item.menuItem.name} × {item.quantity}
                {item.customization ? (
                  <span className="mt-0.5 block break-words text-xs text-brand-cream/50">{item.customization}</span>
                ) : null}
              </span>
              <span className="shrink-0">{formatINR(item.priceAtOrder * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></p>
        <p className="flex justify-between text-brand-cream/60"><span>GST</span><span>{formatINR(order.taxAmount)}</span></p>
        <p className="mt-2 flex justify-between font-display text-lg text-brand-gold">
          <span>Total</span><span>{formatINR(order.totalAmount)}</span>
        </p>
      </article>
      <a href={wa} className="mt-6 block text-center text-sm text-brand-gold underline">
        WhatsApp Wokora Foods
      </a>
    </div>
  );
}
