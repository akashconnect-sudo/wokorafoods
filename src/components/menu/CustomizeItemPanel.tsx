"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
  const orderedGroups = useMemo(() => {
    const size = groups.filter((group) => group.id === "size");
    const rest = groups.filter((group) => group.id !== "size");
    return [...size, ...rest];
  }, [groups]);
  const addItem = useCartStore((state) => state.addItem);
  const { ensureCart } = useCartAccess();
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<CustomizeSelections>(() => defaultSelections(groups));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const hasPortion = Boolean(portions);
  const portionSelected = Boolean(selections.size?.[0]);

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
    if (hasPortion && !portionSelected) {
      toast("Pehle Half ya Full choose karo");
      return;
    }
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

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4 md:p-6"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 border-b-0 bg-charcoal shadow-[0_-20px_60px_rgba(0,0,0,0.55)] max-sm:h-[min(90dvh,calc(100svh-0.25rem))] sm:max-h-[min(90dvh,calc(100svh-2rem))] sm:rounded-3xl sm:border"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Customize ${item.name}`}
      >
        <header className="flex shrink-0 items-start gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl sm:h-16 sm:w-16">
            <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" sizes="64px" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <DietMark isVeg={item.isVeg} />
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold leading-tight sm:text-lg">{item.name}</h2>
                {portions ? (
                  <p className="mt-1 break-words text-xs text-brand-yellow sm:text-sm">
                    Half {formatINR(portions.half)} · Full {formatINR(portions.full)}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-brand-yellow">{formatINR(item.price)}</p>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/10 p-2 text-brand-cream/70 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 touch-pan-y sm:px-5 sm:py-5"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="space-y-5 sm:space-y-6">
            {orderedGroups.length === 0 && (
              <p className="text-sm text-brand-cream/60">No extras on this plate. Pick a quantity and continue.</p>
            )}
            {orderedGroups.map((group) => {
              const isPortion = group.id === "size" && Boolean(portions);
              return (
                <div key={group.id}>
                  <p className="font-display text-sm font-semibold sm:text-base">
                    {isPortion ? "Half or Full" : group.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-brand-cream/45 sm:text-xs">
                    {isPortion
                      ? "Choose one to continue"
                      : group.type === "single"
                        ? "Choose one — payment uses this price + GST"
                        : "Choose any"}
                  </p>
                  <div
                    className={`mt-3 ${
                      isPortion ? "grid grid-cols-2 gap-2.5 sm:gap-3" : "grid grid-cols-1 gap-2"
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
                          className={`flex min-h-[3.5rem] w-full items-center gap-2.5 rounded-2xl border px-3 py-3 text-left transition sm:min-h-14 ${
                            isPortion ? "flex-col items-start justify-center gap-1" : "justify-between"
                          } ${
                            selected
                              ? "border-brand-yellow bg-brand-yellow/15 text-brand-yellow shadow-[0_0_18px_rgba(255,200,0,0.22)]"
                              : "border-white/10 bg-white/5 text-brand-cream hover:border-white/25"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
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
                            <span className={`text-sm font-semibold ${selected ? "text-brand-yellow" : ""}`}>
                              {option.label}
                            </span>
                          </span>
                          <span
                            className={`font-display text-sm font-semibold sm:text-base ${
                              selected ? "text-brand-yellow" : "text-brand-cream/70"
                            } ${isPortion ? "pl-6" : ""}`}
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
        </div>

        <div className="shrink-0 border-t border-white/10 bg-ink px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom,0px))] sm:px-5 sm:pt-3.5 sm:pb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <QuantityStepper
              value={quantity}
              onIncrement={() => setQuantity((value) => Math.min(20, value + 1))}
              onDecrement={() => setQuantity((value) => Math.max(1, value - 1))}
            />
            <button
              type="button"
              onClick={addToCart}
              className="btn-glow min-h-12 min-w-0 flex-1 px-3 py-3 text-sm sm:min-h-[3.25rem] sm:px-4 sm:text-base"
            >
              <span className="block truncate">
                {hasPortion ? "Aage badho — Cart" : "Add to Cart"} · {formatINR(lineTotal)}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}
