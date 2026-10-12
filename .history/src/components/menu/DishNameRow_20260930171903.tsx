"use client";

import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatINR } from "@/lib/constants";
import { defaultCartLine, defaultLineId } from "@/lib/customizations";
import { useCartStore } from "@/store/cartStore";
import type { FoodCardItem } from "@/components/menu/CustomizeItemPanel";
import { useCartAccess } from "@/hooks/useCartAccess";

export function DishNameRow({ item }: { item: FoodCardItem }) {
  const { ensureCart, canUseCart } = useCartAccess();
  const lineId = defaultLineId(item);
  const cartItem = useCartStore((state) => state.items.find((row) => row.id === lineId));
  const addItem = useCartStore((state) => state.addItem);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);

  const add = () => {
    if (!ensureCart()) return;
    addItem(defaultCartLine(item));
  };

  return (
    <div className="flex items-center gap-3 border-b border-white/10 py-3.5 last:border-b-0">
      <button type="button" onClick={add} className="min-w-0 flex-1 text-left">
        <span className="flex items-start gap-2">
          <span
            className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border ${
              item.isVeg ? "border-green-500" : "border-red-500"
            }`}
            title={item.isVeg ? "Vegetarian" : "Non-vegetarian"}
          >
            <span className={`h-2 w-2 ${item.isVeg ? "rounded-full bg-green-500" : "bg-red-500"}`} />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-base font-semibold leading-tight line-clamp-2">{item.name}</span>
            <span className="mt-1 block font-display text-sm text-brand-gold">{formatINR(item.price)}</span>
          </span>
        </span>
      </button>
      {item.isAvailable === false ? (
        <p className="text-xs text-brand-red">Sold out</p>
      ) : canUseCart && cartItem ? (
        <QuantityStepper
          compact
          value={cartItem.quantity}
          onIncrement={() => increment(cartItem.id)}
          onDecrement={() => decrement(cartItem.id)}
        />
      ) : (
        <button type="button" onClick={add} className="shrink-0 rounded-full border border-brand-red/50 px-4 py-2 text-sm font-semibold text-brand-red hover:bg-brand-red hover:text-white">
          ADD
        </button>
      )}
    </div>
  );
}
