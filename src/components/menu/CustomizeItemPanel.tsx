"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatINR } from "@/lib/constants";
import { toast } from "@/components/ui/Toast";
import { useCartStore } from "@/store/cartStore";
import { useCartAccess } from "@/hooks/useCartAccess";
import {
  cartLineId,
  configKeyFromSelections,
  defaultSelections,
  summaryFromSelections,
  unitPriceFromSelections,
  type CustomizeSelections,
  type OptionGroup,
} from "@/lib/customizations";

export type CustomizableItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  optionGroups?: OptionGroup[];
};

export type FoodCardItem = CustomizableItem & {
  isAvailable?: boolean;
};

const EMPTY_GROUPS: OptionGroup[] = [];

function DietMark({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border ${
        isVeg ? "border-green-500" : "border-red-500"
      }`}
      title={isVeg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span className={`h-2 w-2 ${isVeg ? "rounded-full bg-green-500" : "bg-red-500"}`} />
    </span>
  );
}

function optionPriceLabel(delta: number, basePrice: number, groupId: string) {
  if (groupId === "size") return formatINR(basePrice + delta);
  if (delta === 0) return "Included";
  return `+ ${formatINR(delta)}`;
}

export function CustomizeItemPanel({
  item,
  onClose,
}: {
  item: CustomizableItem;
  onClose: () => void;
}) {
  const groups = item.optionGroups ?? EMPTY_GROUPS;
  const addItem = useCartStore((state) => state.addItem);
  const { ensureCart } = useCartAccess();
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<CustomizeSelections>(() => defaultSelections(groups));

  useEffect(() => {
    setQuantity(1);
    setSelections(defaultSelections(groups));
  }, [item.id, groups]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const unitPrice = useMemo(
    () => unitPriceFromSelections(item.price, groups, selections),
    [item.price, groups, selections]
  );
  const lineTotal = unitPrice * quantity;

  const pickSingle = (groupId: string, optionId: string) => {
    setSelections((current) => ({ ...current, [groupId]: [optionId] }));
  };

  const toggleMultiple = (groupId: string, optionId: string) => {
    setSelections((current) => {
      const picked = current[groupId] || [];
      const next = picked.includes(optionId) ? picked.filter((id) => id !== optionId) : [...picked, optionId];
      return { ...current, [groupId]: next };
    });
  };

  const addToCart = () => {
    if (!ensureCart()) return;
    const configKey = configKeyFromSelections(selections);
    const customization = summaryFromSelections(groups, selections);
    addItem(
      {
        id: cartLineId(item.id, configKey),
        menuItemId: item.id,
        name: item.name,
        price: unitPrice,
        imageUrl: item.imageUrl,
        isVeg: item.isVeg,
        configKey,
        customization,
        selections,
      },
      quantity
    );
    toast("Added to cart");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" aria-label="Close customization" className="absolute inset-0 bg-black/65" onClick={onClose} />
      <section className="absolute inset-x-0 bottom-0 flex max-h-[min(92dvh,40rem)] flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-charcoal shadow-[0_-20px_60px_rgba(0,0,0,0.45)] sm:max-h-[90vh] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[min(28rem,100vw)] lg:max-h-none lg:rounded-none lg:rounded-l-3xl lg:border-l">
        <header className="flex items-start gap-3 border-b border-white/10 px-4 py-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
            <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <DietMark isVeg={item.isVeg} />
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold leading-tight">{item.name}</h2>
                <p className="mt-1 text-sm text-brand-gold">{formatINR(item.price)}</p>
              </div>
            </div>
          </div>
          <p className="hidden shrink-0 font-display text-lg text-brand-gold md:block">{formatINR(lineTotal)}</p>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-brand-cream/70 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {groups.length === 0 && (
            <p className="text-sm text-brand-cream/60">No extras on this plate. Pick a quantity and add it to the tray.</p>
          )}
          {groups.map((group) => (
            <div key={group.id}>
              <p className="font-display text-base font-semibold">{group.label}</p>
              <p className="mt-0.5 text-xs text-brand-cream/45">
                {group.type === "single" ? "Choose one" : "Choose any"}
              </p>
              <div className="mt-3 space-y-2">
                {group.options.map((option) => {
                  const selected = (selections[group.id] || []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        group.type === "single" ? pickSingle(group.id, option.id) : toggleMultiple(group.id, option.id)
                      }
                      className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                        selected ? "border-brand-gold bg-brand-gold/10" : "border-white/10 bg-white/5"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`grid h-4 w-4 place-items-center border ${
                            group.type === "single" ? "rounded-full" : "rounded-[3px]"
                          } ${selected ? "border-brand-gold" : "border-white/35"}`}
                        >
                          {selected && (
                            <span className={`bg-brand-gold ${group.type === "single" ? "h-2 w-2 rounded-full" : "h-2 w-2"}`} />
                          )}
                        </span>
                        <span className="text-sm">{option.label}</span>
                      </span>
                      <span className="text-sm font-medium text-brand-gold">
                        {optionPriceLabel(option.priceDelta, item.price, group.id)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-white/10 bg-ink/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <QuantityStepper
            value={quantity}
            onIncrement={() => setQuantity((value) => Math.min(20, value + 1))}
            onDecrement={() => setQuantity((value) => Math.max(1, value - 1))}
          />
          <button type="button" onClick={addToCart} className="btn-glow min-w-0 flex-1 px-3 py-3 text-xs sm:px-4 sm:text-sm">
            <span className="truncate">Add to Cart — {formatINR(lineTotal)}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
