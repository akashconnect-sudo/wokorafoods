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
  const groups = item.optionGroups?.length ? item.optionGroups : EMPTY_GROUPS;
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
    setSelections(defaultSelections(item.optionGroups?.length ? item.optionGroups : EMPTY_GROUPS));
  }, [item.id, item.optionGroups]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouch;
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

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 2147483000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 0,
        backgroundColor: "rgba(0,0,0,0.82)",
      }}
      className="sm:items-center sm:p-4"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Customize ${item.name}`}
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "32rem",
          height: "min(92dvh, 100svh)",
          maxHeight: "min(92dvh, 100svh)",
          overflow: "hidden",
          backgroundColor: "#141414",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.55)",
        }}
        className="sm:max-h-[min(88vh,40rem)] sm:rounded-3xl"
      >
        <header
          style={{ flexShrink: 0 }}
          className="flex items-start gap-3 border-b border-white/10 px-4 py-3.5"
        >
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
            <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" sizes="64px" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <DietMark isVeg={item.isVeg} />
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold leading-tight">{item.name}</h2>
                {portions ? (
                  <p className="mt-1 break-words text-xs text-brand-yellow">
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
            className="shrink-0 rounded-full border border-white/10 p-2 text-brand-cream/70"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
          }}
          className="overscroll-contain px-4 py-4"
        >
          <div className="space-y-5 pb-4">
            {orderedGroups.length === 0 ? (
              <p className="text-sm text-brand-cream/60">No extras on this plate. Set quantity and continue.</p>
            ) : null}
            {orderedGroups.map((group) => {
              const isPortion = group.id === "size" && Boolean(portions);
              return (
                <div key={group.id}>
                  <p className="font-display text-sm font-semibold">
                    {isPortion ? "Half or Full" : group.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-brand-cream/45">
                    {isPortion
                      ? "Choose one, then continue below"
                      : group.type === "single"
                        ? "Choose one"
                        : "Choose any"}
                  </p>
                  <div className={`mt-3 ${isPortion ? "grid grid-cols-2 gap-2.5" : "grid grid-cols-1 gap-2"}`}>
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
                          className={`flex min-h-14 w-full items-center gap-2.5 rounded-2xl border px-3 py-3 text-left ${
                            isPortion ? "flex-col items-start justify-center gap-1" : "justify-between"
                          } ${
                            selected
                              ? "border-brand-yellow bg-brand-yellow/15 text-brand-yellow"
                              : "border-white/10 bg-white/5 text-brand-cream"
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
                            className={`font-display text-sm font-semibold ${
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

        <div
          style={{
            flexShrink: 0,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: "#0B0B0B",
            paddingBottom: "max(0.85rem, env(safe-area-inset-bottom, 0px))",
          }}
          className="px-4 pt-3"
        >
          <div className="flex items-center gap-2.5">
            <QuantityStepper
              value={quantity}
              onIncrement={() => setQuantity((value) => Math.min(20, value + 1))}
              onDecrement={() => setQuantity((value) => Math.max(1, value - 1))}
            />
            <button type="button" onClick={addToCart} className="btn-glow min-h-12 min-w-0 flex-1 px-3 py-3 text-sm">
              <span className="block truncate">Aage badho · {formatINR(lineTotal)}</span>
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}
