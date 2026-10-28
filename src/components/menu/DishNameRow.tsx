"use client";

import { useState } from "react";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatINR } from "@/lib/constants";
import { defaultCartLine, defaultLineId, portionPriceLabels } from "@/lib/customizations";
import { useCartStore } from "@/store/cartStore";
import { CustomizeItemPanel, type FoodCardItem } from "@/components/menu/CustomizeItemPanel";
import { useCartAccess } from "@/hooks/useCartAccess";

export function DishNameRow({ item }: { item: FoodCardItem }) {
  const { ensureCart, canUseCart } = useCartAccess();
  const groups = item.optionGroups?.length ? item.optionGroups : [];
  const needsCustomize = groups.length > 0;
  const lineId = defaultLineId(item);
  const cartItem = useCartStore((state) => state.items.find((row) => row.id === lineId));
  const portionQty = useCartStore((state) =>
    state.items
      .filter((row) => (row.menuItemId || row.id.split("::")[0]) === item.id)
      .reduce((sum, row) => sum + row.quantity, 0)
  );
  const addItem = useCartStore((state) => state.addItem);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const [open, setOpen] = useState(false);

  const portions = portionPriceLabels(item.price, groups, {
    price: item.price,
    halfPrice: item.halfPrice,
    fullPrice: item.fullPrice,
  });

  const openPanel = () => {
    if (item.isAvailable === false) return;
    if (!ensureCart()) return;
    setOpen(true);
  };

  const add = () => {
    if (!ensureCart()) return;
    if (needsCustomize) {
      setOpen(true);
      return;
    }
    addItem(defaultCartLine(item));
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/10 py-3.5 last:border-b-0">
        <button type="button" onClick={needsCustomize ? openPanel : add} className="min-w-0 flex-1 text-left">
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
              {portions ? (
                <span className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 font-display text-xs text-brand-yellow xs:text-sm">
                  <span>Half {formatINR(portions.half)}</span>
                  <span className="text-brand-cream/35">·</span>
                  <span>Full {formatINR(portions.full)}</span>
                </span>
              ) : (
                <span className="mt-1 block font-display text-sm text-brand-yellow">{formatINR(item.price)}</span>
              )}
            </span>
          </span>
        </button>
        {item.isAvailable === false ? (
          <p className="text-xs text-brand-yellow">Sold out</p>
        ) : canUseCart && cartItem && !needsCustomize ? (
          <QuantityStepper
            compact
            value={cartItem.quantity}
            onIncrement={() => increment(cartItem.id)}
            onDecrement={() => decrement(cartItem.id)}
          />
        ) : canUseCart && needsCustomize && portionQty > 0 ? (
          <button
            type="button"
            onClick={openPanel}
            className="shrink-0 rounded-full border border-brand-gold/40 px-3 py-2 text-xs font-semibold text-brand-gold"
          >
            {portionQty} in cart · Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={add}
            className="shrink-0 rounded-full border border-brand-yellow/50 px-4 py-2 text-sm font-semibold text-brand-yellow hover:bg-brand-yellow hover:text-white"
          >
            ADD
          </button>
        )}
      </div>
      {open ? (
        <CustomizeItemPanel
          item={{
            id: item.id,
            name: item.name,
            description: item.description || "",
            price: item.price,
            halfPrice: item.halfPrice,
            fullPrice: item.fullPrice,
            imageUrl: item.imageUrl,
            isVeg: item.isVeg,
            optionGroups: groups,
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
