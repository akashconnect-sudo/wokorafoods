"use client";

import Link from "next/link";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { GST_RATE, formatINR } from "@/lib/constants";
import { cartCount, cartSubtotal, useCartStore } from "@/store/cartStore";
import { useCartAccess } from "@/hooks/useCartAccess";

export function MenuCartRail() {
  const { isAdmin, canUseCart } = useCartAccess();
  const items = useCartStore((state) => state.items);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeItem = useCartStore((state) => state.removeItem);
  const count = cartCount(items);
  const subtotal = cartSubtotal(items);
  const tax = Math.round(subtotal * GST_RATE);
  const total = subtotal + tax;

  return (
    <aside className="card-surface sticky top-20 hidden h-fit max-h-[calc(100vh-6rem)] flex-col overflow-hidden md:flex">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="font-display text-xl font-semibold">{isAdmin ? "Kitchen" : "Your order"}</p>
        <p className="mt-1 text-xs text-brand-cream/50">
          {isAdmin
            ? "Customer carts stay on the customer login. This board is for live orders."
            : canUseCart
              ? "Tap a dish on the left. It lands here."
              : "Login as a customer to add dishes and see totals."}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3">
        {isAdmin ? (
          <p className="py-10 text-sm text-brand-cream/45">Open live orders to cook and print tickets.</p>
        ) : !canUseCart || items.length === 0 ? (
          <p className="py-10 text-sm text-brand-cream/45">
            {canUseCart ? "Cart is empty. Tap a name to add it." : "Sign in to start a cart."}
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold leading-tight">{item.name}</p>
                  {item.customization ? (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-brand-cream/45">{item.customization}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-brand-gold">{formatINR(item.price)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <QuantityStepper
                    compact
                    value={item.quantity}
                    onIncrement={() => increment(item.id)}
                    onDecrement={() => decrement(item.id)}
                  />
                  <button type="button" onClick={() => removeItem(item.id)} className="text-[10px] text-brand-red">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        {canUseCart ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-brand-cream/60">Items</span>
              <span>{count}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-brand-cream/60">Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm text-brand-cream/60">
              <span>GST (5%)</span>
              <span>{formatINR(tax)}</span>
            </div>
            <div className="mt-3 flex justify-between font-display text-lg">
              <span>To pay</span>
              <span className="text-brand-gold">{formatINR(total)}</span>
            </div>
          </>
        ) : null}
        <Link
          href={isAdmin ? "/admin" : canUseCart ? "/cart" : "/login?callbackUrl=/cart"}
          className={`btn-glow mt-4 block w-full py-3 text-center text-sm ${
            canUseCart && count === 0 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          {isAdmin
            ? "Open kitchen orders"
            : !canUseCart
              ? "Login to order"
              : count === 0
                ? "Add a dish"
                : `Checkout · ${formatINR(total)}`}
        </Link>
      </div>
    </aside>
  );
}
