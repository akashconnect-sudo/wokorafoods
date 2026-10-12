"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { FoodCardItem } from "@/components/menu/CustomizeItemPanel";
import { DietToggle, type DietPreference } from "@/components/menu/DietToggle";
import { CategoryPlateGrid } from "@/components/menu/CategoryPlateGrid";
import { useCartStore } from "@/store/cartStore";
import { buildCategoryPlates, filterMenuItems, parseDiet } from "@/lib/menuView";

type MenuItem = FoodCardItem & {
  category: { name: string; slug: string };
  isFeatured?: boolean;
};

type Category = { id: string; name: string; slug: string };

function MenuPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setTableNumber = useCartStore((state) => state.setTableNumber);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [diet, setDiet] = useState<DietPreference>(parseDiet(searchParams.get("diet")));

  useEffect(() => {
    setDiet(parseDiet(searchParams.get("diet")));
  }, [searchParams]);

  useEffect(() => {
    const table = searchParams.get("table");
    if (table) setTableNumber(table);
  }, [searchParams, setTableNumber]);

  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace("#", ""));
    if (id) {
      router.replace(`/menu/${id}?diet=${parseDiet(searchParams.get("diet"))}`);
    }
  }, [router, searchParams]);

  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setCategories(data.categories || []);
      })
      .catch(() => {
        setItems([]);
        setCategories([]);
      });
  }, []);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
  };

  const filtered = useMemo(() => filterMenuItems(items, diet, query), [items, diet, query]);
  const plates = useMemo(() => buildCategoryPlates(categories, filtered), [filtered, categories]);

  const changeDiet = (next: DietPreference) => {
    setDiet(next);
    router.replace(`/menu?diet=${next}`, { scroll: false });
  };

  return (
    <div className="page-bottom mx-auto max-w-7xl page-pad py-5 sm:py-6">
      <header>
        <div>
          <p className="font-wall text-sm text-brand-gold sm:text-lg">Taste Talks Here</p>
          <h1 className="mt-0.5 font-display text-2xl font-extrabold leading-none tracking-tight sm:text-3xl">
            Menu
          </h1>
        </div>
      </header>

      <div className="menu-toolbar mt-3">
        <div className="min-w-0 flex-1">
          <DietToggle value={diet} onChange={changeDiet} />
        </div>
        <form onSubmit={submitSearch} className="menu-search">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-cream/50 sm:left-3 sm:h-4 sm:w-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="w-full rounded-full border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand-red sm:py-2 sm:pl-10"
          />
        </form>
      </div>

      <CategoryPlateGrid plates={plates} hrefFor={(slug) => `/menu/${slug}?diet=${diet}`} />
      {plates.length === 0 && (
        <p className="mt-7 text-brand-cream/60">
          {diet === "veg"
            ? "No veg dishes in this search."
            : diet === "nonveg"
              ? "No non-veg dishes in this search."
              : "No dishes match that search yet."}
        </p>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="px-4 py-20 text-center">Loading menu...</div>}>
      <MenuPageInner />
    </Suspense>
  );
}
