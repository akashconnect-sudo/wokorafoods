import { CATEGORY_META } from "@/lib/constants";
import { uniqueByName } from "@/lib/uniqueByName";
import type { DietPreference } from "@/components/menu/DietToggle";

export type MenuViewItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  isFeatured?: boolean;
  isAvailable?: boolean;
  category: { name: string; slug: string };
};

export type MenuViewCategory = {
  id?: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
};

export type MenuPlate = {
  category: MenuViewCategory;
  featured: MenuViewItem;
  count: number;
  fromPrice: number;
  image: string;
};

export function parseDiet(value: string | null): DietPreference {
  if (value === "veg" || value === "nonveg" || value === "all") return value;
  return "all";
}

export function filterMenuItems<T extends MenuViewItem>(items: T[], diet: DietPreference, query: string): T[] {
  const rows = items.filter((item) => {
    const matchesDiet = diet === "all" || (diet === "veg" ? item.isVeg : !item.isVeg);
    const matchesQuery =
      !query ||
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.category.name.toLowerCase().includes(query.toLowerCase());
    return matchesDiet && matchesQuery;
  });
  return uniqueByName(rows);
}

export function buildCategoryPlates(categories: MenuViewCategory[], filtered: MenuViewItem[]): MenuPlate[] {
  return categories.flatMap((category) => {
    const dishes = filtered.filter((item) => item.category.slug === category.slug);
    if (!dishes.length) return [];
    const featured = dishes.find((item) => item.isFeatured) || dishes[0];
    const meta = CATEGORY_META.find((row) => row.slug === category.slug);
    const kitchenImage = (category.iconUrl || "").trim();
    return [
      {
        category,
        featured,
        count: dishes.length,
        fromPrice: Math.min(...dishes.map((item) => item.price)),
        // Kitchen category photo wins, then dish photo, then built-in fallback art.
        image: kitchenImage || featured.imageUrl || meta?.image || "",
      },
    ];
  });
}
