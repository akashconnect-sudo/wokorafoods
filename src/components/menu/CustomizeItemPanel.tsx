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
  portionPriceLabels,
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
  halfPrice?: number | null;
  fullPrice?: number | null;
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
  const portions = useMemo(
    () =>
      portionPriceLabels(item.price, groups, {
        price: item.price,
        halfPrice: item.halfPrice,
        fullPrice: item.fullPrice,
      }),
    [item.price, item.halfPrice, item.fullPrice, groups]
  );

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
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4 lg:items-stretch lg:justify-end lg:p-0">
      <button type="button" aria-label="Close customization" className="absolute inset-0 bg-black/65" onClick={onClose} />
      <section className="relative flex max-h-[min(92dvh,42rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-charcoal shadow-[0_-20px_60px_rgba(0,0,0,0.45)] sm:max-h-[90vh] sm:rounded-3xl lg:h-full lg:max-h-none lg:w-[min(28rem,100vw)] lg:max-w-none lg:rounded-none lg:rounded-l-3xl lg:border-l">
        <header className="flex items-start gap-3 border-b border-white/10 px-3 py-3 xs:px-4 xs:py-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl xs:h-16 xs:w-16">
            <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" sizes="64px" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <DietMark isVeg={item.isVeg} />
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold leading-tight xs:text-lg">{item.name}</h2>
                {portions ? (
                  <p className="mt-1 break-words text-xs text-brand-yellow xs:text-sm">
                    Half {formatINR(portions.half)} · Full {formatINR(portions.full)}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-brand-yellow">{formatINR(item.price)}</p>
                )}
              </div>
            </div>
          </div>
          <p className="hidden shrink-0 font-display text-lg text-brand-yellow md:block">{formatINR(lineTotal)}</p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/10 p-2 text-brand-cream/70 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4 xs:space-y-6 xs:px-4 xs:py-5">
          {groups.length === 0 && (
            <p className="text-sm text-brand-cream/60">No extras on this plate. Pick a quantity and add it to the tray.</p>
          )}
          {groups.map((group) => {
            const isPortion = group.id === "size" && Boolean(portions);
            return (
              <div key={group.id}>
                <p className="font-display text-sm font-semibold xs:text-base">
                  {isPortion ? "Half or Full" : group.label}
                </p>
                <p className="mt-0.5 text-[11px] text-brand-cream/45 xs:text-xs">
                  {group.type === "single" ? "Choose one — payment uses this price + GST" : "Choose any"}
                </p>
                <div
                  className={`mt-3 ${
                    isPortion
                      ? "grid grid-cols-2 gap-2 xs:gap-3"
                      : "grid grid-cols-1 gap-2"
                  }`}
                >
                  {group.options.map((option) => {
                    const selected = (selections[group.id] || []).includes(option.id);
                    const priceText = isPortion
                      ? option.id === "full"
                        ? formatINR(portions!.full)
                        : formatINR(portions!.half)
                      : optionPriceLabel(option.priceDelta, item.price, group.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          group.type === "single"
                            ? pickSingle(group.id, option.id)
                            : toggleMultiple(group.id, option.id)
                        }
                        className={`flex min-h-[3.25rem] w-full items-center gap-2 rounded-2xl border px-2.5 py-2.5 text-left transition xs:min-h-[3.5rem] xs:gap-3 xs:px-3 xs:py-3 ${
                          isPortion ? "flex-col items-stretch justify-between sm:flex-row sm:items-center" : "justify-between"
                        } ${
                          selected
                            ? "border-brand-yellow bg-brand-yellow/15 text-brand-yellow shadow-[0_0_18px_rgba(255,200,0,0.22)]"
                            : "border-white/10 bg-white/5 text-brand-cream hover:border-white/25"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2 xs:gap-3">
                          <span
                            className={`grid h-4 w-4 shrink-0 place-items-center border ${
                              group.type === "single" ? "rounded-full" : "rounded-[3px]"
                            } ${selected ? "border-brand-yellow" : "border-white/35"}`}
                          >
                            {selected ? (
                              <span
                                className={`bg-brand-yellow ${
                                  group.type === "single" ? "h-2 w-2 rounded-full" : "h-2 w-2"
                                }`}
                              />
                            ) : null}
                          </span>
                          <span className={`truncate text-sm font-semibold ${selected ? "text-brand-yellow" : ""}`}>
                            {option.label}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 font-display text-sm font-semibold xs:text-base ${
                            selected ? "text-brand-yellow" : "text-brand-cream/70"
                          } ${isPortion ? "pl-6 sm:pl-0" : ""}`}
                        >
                          {priceText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-white/10 bg-ink/90 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] xs:gap-3 xs:px-4">
          <QuantityStepper
            value={quantity}
            onIncrement={() => setQuantity((value) => Math.min(20, value + 1))}
            onDecrement={() => setQuantity((value) => Math.max(1, value - 1))}
          />
          <button type="button" onClick={addToCart} className="btn-glow min-w-0 flex-1 px-3 py-3 text-xs xs:text-sm sm:px-4">
            <span className="truncate">Add to Cart — {formatINR(lineTotal)}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
