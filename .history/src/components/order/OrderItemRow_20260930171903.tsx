"use client";

import Image from "next/image";
import { useState } from "react";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatINR } from "@/lib/constants";
import { useCartStore, type CartItem } from "@/store/cartStore";
import { CustomizeItemPanel } from "@/components/menu/CustomizeItemPanel";
import { useCartAccess } from "@/hooks/useCartAccess";
import {
  cartLineId,
  configKeyFromSelections,
  defaultSelections,
  summaryFromSelections,
  unitPriceFromSelections,
  type OptionGroup,
} from "@/lib/customizations";

export function OrderItemRow({
  item,
}: {
  item: Omit<CartItem, "quantity"> & {
    description?: string;
    isAvailable?: boolean;
    optionGroups?: OptionGroup[];
  };
}) {
  const groups = item.optionGroups || [];
  const { ensureCart, canUseCart } = useCartAccess();
  const defaultId = cartLineId(item.id, configKeyFromSelections(defaultSelections(groups)));
  const cartItem = useCartStore((state) => state.items.find((row) => row.id === defaultId));
  const addItem = useCartStore((state) => state.addItem);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const [broken, setBroken] = useState(false);
  const [open, setOpen] = useState(false);

  const openPanel = () => {
    if (item.isAvailable === false) return;
    if (!ensureCart()) return;
    setOpen(true);
  };

  return (
    <article className="flex items-start gap-3 border-b border-white/10 py-4 last:border-b-0 sm:items-center sm:gap-4">
      <button type="button" onClick={openPanel} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full sm:h-[88px] sm:w-[88px] lg:h-28 lg:w-28">
        {broken ? (
          <div className="grid h-full w-full place-items-center bg-brand-red/30 text-center text-xs">{item.name}</div>
        ) : (
          <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" onError={() => setBroken(true)} />
        )}
      </button>
      <button type="button" onClick={openPanel} className="min-w-0 flex-1 text-left">
        <div className="flex items-start gap-2">
          <span
            className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border ${
              item.isVeg ? "border-green-500" : "border-red-500"
            }`}
            title={item.isVeg ? "Vegetarian" : "Non-vegetarian"}
          >
            <span className={`h-2 w-2 ${item.isVeg ? "rounded-full bg-green-500" : "bg-red-500"}`} />
          </span>
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-display text-base font-semibold leading-tight sm:text-lg">{item.name}</h3>
            {item.description && (
              <p className="mt-1 line-clamp-2 text-sm text-brand-cream/55">{item.description}</p>
            )}
            <p className="mt-2 font-display text-brand-gold">{formatINR(item.price)}</p>
          </div>
        </div>
      </button>
      <div className="shrink-0">
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
          <button
            type="button"
            onClick={() => {
              if (!ensureCart()) return;
              const selections = defaultSelections(groups);
              const configKey = configKeyFromSelections(selections);
              addItem({
                id: cartLineId(item.id, configKey),
                menuItemId: item.id,
                name: item.name,
                price: unitPriceFromSelections(item.price, groups, selections),
                imageUrl: item.imageUrl,
                isVeg: item.isVeg,
                configKey,
                customization: summaryFromSelections(groups, selections),
                selections,
              });
            }}
            className="btn-glow px-3 py-1.5 text-xs sm:px-5 sm:py-2 sm:text-sm"
          >
            ADD
          </button>
        )}
      </div>
      {open && (
        <CustomizeItemPanel
          item={{
            id: item.id,
            name: item.name,
            description: item.description || "",
            price: item.price,
            imageUrl: item.imageUrl,
            isVeg: item.isVeg,
            optionGroups: groups,
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </article>
  );
}
