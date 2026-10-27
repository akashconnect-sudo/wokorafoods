export type KitchenCategory = { id: string; name: string; slug: string; iconUrl?: string | null };

export type KitchenItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  halfPrice?: number | null;
  fullPrice?: number | null;
  imageUrl: string;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  categoryId: string;
  category: KitchenCategory;
};

export const emptyVariation = {
  name: "",
  description: "",
  price: "",
  halfPrice: "",
  fullPrice: "",
  imageUrl: "",
  isVeg: true,
};

export async function fetchKitchenMenu() {
  const res = await fetch("/api/menu?all=true");
  const data = await res.json();
  return {
    items: (data.items || []) as KitchenItem[],
    categories: (data.categories || []) as KitchenCategory[],
  };
}

export async function uploadKitchenPhoto(file: File) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/menu/upload", { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url as string;
}

export async function patchKitchenItem(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/menu/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not save");
  return data;
}

export async function deleteKitchenItem(id: string) {
  const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not delete");
}

export async function patchKitchenCategory(id: string, body: { name?: string; iconUrl?: string | null }) {
  const res = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not save category");
  return data;
}

export async function deleteKitchenCategory(id: string) {
  const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not delete category");
}
