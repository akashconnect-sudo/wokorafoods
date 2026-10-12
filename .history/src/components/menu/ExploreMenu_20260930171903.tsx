"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { OrderItemRow } from "@/components/order/OrderItemRow";
import { formatINR } from "@/lib/constants";
import type { FoodCardItem } from "@/components/menu/CustomizeItemPanel";

export type CatalogItem = FoodCardItem & {
  category: { id?: string; name: string; slug: string; iconUrl?: string | null };
  isFeatured?: boolean;
  isAvailable?: boolean;
};

export type CatalogCategory = { id: string; name: string; slug: string; iconUrl?: string | null };

function categoryImage(category: CatalogCategory) {
  return category.iconUrl || "";
}

export function ExploreMenu({
  items,
  categories,
  query,
  onQuery,
  active,
  onActive,
  mode = "customer",
}: {
  items: CatalogItem[];
  categories: CatalogCategory[];
  query: string;
  onQuery: (value: string) => void;
  active: string;
  onActive: (slug: string) => void;
  mode?: "customer" | "kitchen";
}) {
  const visible = active === "all" ? items : items.filter((item) => item.category.slug === active);
  const grouped = categories
    .map((category) => ({
      category,
      items: visible.filter((item) => item.category.slug === category.slug),
    }))
    .filter((row) => row.items.length > 0);

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-display text-2xl font-bold">{mode === "kitchen" ? "Live menu" : "Explore Menu"}</h2>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-cream/45" />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search"
            className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-red"
          />
        </div>
      </div>
      <div className="no-scrollbar mt-5 flex gap-5 overflow-x-auto pb-3">
        <button type="button" onClick={() => onActive("all")} className="w-[76px] shrink-0 text-center">
          <span
            className={`mx-auto grid h-[76px] w-[76px] place-items-center rounded-full border-2 text-xs font-semibold ${
              active === "all" ? "border-brand-red bg-brand-red/20" : "border-white/15 bg-white/5"
            }`}
          >
            All
          </span>
          <span className="mt-2 block text-xs text-brand-cream/70">All</span>
        </button>
        {categories.map((category) => {
          const selected = active === category.slug;
          const image = categoryImage(category);
          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => onActive(category.slug)}
              className="w-[76px] shrink-0 text-center"
            >
              <span
                className={`relative mx-auto block h-[76px] w-[76px] overflow-hidden rounded-full border-2 ${
                  selected ? "border-brand-red shadow-[0_0_18px_rgba(232,39,44,0.45)]" : "border-white/15"
                }`}
              >
                {image ? (
                  <Image src={image} alt="" fill className="object-cover" sizes="76px" unoptimized />
                ) : (
                  <span className="grid h-full place-items-center bg-white/5 px-1 text-[10px] leading-tight">{category.name}</span>
                )}
              </span>
              <span className={`mt-2 block truncate text-xs ${selected ? "text-brand-gold" : "text-brand-cream/70"}`}>
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-8 space-y-10">
        {grouped.map(({ category, items: sectionItems }) => (
          <section key={category.slug} id={category.slug}>
            <h3 className="font-display text-2xl font-bold">{category.name}</h3>
            <div className="mt-2 divide-y divide-white/10 rounded-3xl border border-white/10 bg-charcoal/60 px-4">
              {sectionItems.map((item) =>
                mode === "kitchen" ? (
                  <KitchenItemRow key={item.id} item={item} />
                ) : (
                  <OrderItemRow key={item.id} item={item} />
                )
              )}
            </div>
          </section>
        ))}
        {grouped.length === 0 && (
          <p className="py-16 text-center text-brand-cream/55">Nothing in this filter yet.</p>
        )}
      </div>
    </section>
  );
}

function KitchenItemRow({ item }: { item: CatalogItem }) {
  return (
    <article className="flex items-start gap-3 py-4 last:pb-4 sm:items-center sm:gap-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/5 sm:h-[88px] sm:w-[88px] lg:h-28 lg:w-28">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" />
        ) : (
          <span className="grid h-full place-items-center px-1 text-center text-[10px] text-brand-cream/50">No photo</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span
            className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border ${
              item.isVeg ? "border-green-500" : "border-red-500"
            }`}
          >
            <span className={`h-2 w-2 ${item.isVeg ? "rounded-full bg-green-500" : "bg-red-500"}`} />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold leading-tight sm:text-lg">{item.name}</h3>
            {item.description ? <p className="mt-1 line-clamp-2 text-sm text-brand-cream/55">{item.description}</p> : null}
            <p className="mt-2 font-display text-brand-gold">{formatINR(item.price)}</p>
            {item.isAvailable === false ? <p className="mt-1 text-xs text-brand-red">Hidden from customers</p> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
