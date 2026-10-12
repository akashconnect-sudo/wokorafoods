import Image from "next/image";
import Link from "next/link";
import { displayOrderNumber, formatINR } from "@/lib/constants";
import { kitchenStatusLabel, paymentMethodLabel, paymentStatusLabel } from "@/lib/orderLabels";

export type BillItem = {
  id?: string;
  quantity: number;
  priceAtOrder?: number;
  customization?: string;
  menuItem: { id?: string; name: string; price?: number; imageUrl?: string; isVeg?: boolean };
};

export type BillPayment = {
  id: string;
  method: string;
  status: string;
  amount: number;
  upiApp?: string;
  failureReason?: string;
  paidAt?: string | null;
  createdAt: string;
};

export type BillOrder = {
  id: string;
  serialNumber: number;
  createdAt: string;
  status: string;
  type?: string;
  tableNumber?: string | null;
  paymentStatus: string;
  paymentMethod?: string | null;
  subtotal?: number;
  taxAmount?: number;
  totalAmount: number;
  items: BillItem[];
  payments?: BillPayment[];
};

function latestPayment(order: BillOrder) {
  return order.payments?.[0];
}

export function OrderBill({
  order,
  compact,
  onReorder,
}: {
  order: BillOrder;
  compact?: boolean;
  onReorder?: () => void;
}) {
  const payment = latestPayment(order);
  const payStatus = payment?.status || order.paymentStatus;
  const payMethod = payment?.method || order.paymentMethod;
  const failed = payStatus === "failed";
  const unpaid = payStatus === "pending" || failed;

  return (
    <article className={`card-surface p-5 ${failed ? "border border-brand-red/40" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl text-brand-gold">{displayOrderNumber(order.serialNumber)}</p>
          <p className="text-sm text-brand-cream/60">
            {new Date(order.createdAt).toLocaleString("en-IN")}
            {order.type === "dine_in" && order.tableNumber ? ` · Table ${order.tableNumber}` : order.type === "takeaway" ? " · Takeaway" : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-xl">{formatINR(order.totalAmount)}</p>
          <p className={`mt-1 text-xs uppercase tracking-wide ${failed ? "text-brand-red" : payStatus === "paid" ? "text-brand-gold" : "text-brand-cream/50"}`}>
            {paymentStatusLabel(payStatus)}
            {payMethod ? ` · ${paymentMethodLabel(payMethod)}` : ""}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-brand-cream/50">{kitchenStatusLabel(order.status)}</p>
        </div>
      </div>

      {!compact ? (
        <>
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {order.items.map((item, index) =>
              item.menuItem.imageUrl ? (
                <div key={item.id || `${item.menuItem.name}-${index}`} className="w-28 shrink-0">
                  <div className="relative h-20 overflow-hidden rounded-xl">
                    <Image src={item.menuItem.imageUrl} alt={item.menuItem.name} fill className="object-cover" />
                  </div>
                  <p className="mt-1 truncate text-xs">
                    {item.quantity} × {item.menuItem.name}
                  </p>
                </div>
              ) : null
            )}
          </div>
          <ul className="mt-4 space-y-2 border-y border-dashed border-white/15 py-4 text-sm">
          {order.items.map((item, index) => (
            <li key={item.id || `${item.menuItem.name}-${index}`} className="flex justify-between gap-3">
              <span className="min-w-0 flex-1 break-words pr-2">
                {item.quantity} × {item.menuItem.name}
                {item.customization ? (
                  <span className="mt-0.5 block break-words text-xs text-brand-gold/80">{item.customization}</span>
                ) : null}
              </span>
              <span className="shrink-0">{formatINR((item.priceAtOrder ?? item.menuItem.price ?? 0) * item.quantity)}</span>
            </li>
          ))}
        </ul>
        </>
      ) : (
        <p className="mt-3 line-clamp-2 text-sm text-brand-cream/75">
          {order.items.map((item) => `${item.quantity} × ${item.menuItem.name}`).join(", ")}
        </p>
      )}

      {!compact && typeof order.subtotal === "number" ? (
        <div className="mt-3 space-y-1 text-sm">
          <p className="flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></p>
          {typeof order.taxAmount === "number" ? (
            <p className="flex justify-between text-brand-cream/60"><span>GST</span><span>{formatINR(order.taxAmount)}</span></p>
          ) : null}
          <p className="flex justify-between font-display text-lg text-brand-gold">
            <span>Total</span><span>{formatINR(order.totalAmount)}</span>
          </p>
        </div>
      ) : null}

      {failed && payment?.failureReason ? (
        <p className="mt-3 text-sm text-brand-red">{payment.failureReason}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/order/${order.id}`} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          View bill
        </Link>
        {unpaid ? (
          <Link href={`/pay/${order.id}`} className="rounded-full bg-brand-red px-4 py-2 text-sm text-white">
            {failed ? "Retry payment" : "Pay now"}
          </Link>
        ) : null}
        {onReorder ? (
          <button type="button" onClick={onReorder} className="btn-glow px-4 py-2 text-sm">
            Re-order
          </button>
        ) : null}
      </div>
    </article>
  );
}
