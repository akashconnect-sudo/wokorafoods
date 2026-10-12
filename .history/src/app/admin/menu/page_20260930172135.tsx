"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { DietToggle, type DietPreference } from "@/components/menu/DietToggle";
import { CategoryPlateGrid } from "@/components/menu/CategoryPlateGrid";
import { KitchenPopup } from "@/components/admin/KitchenPopup";
import { formatINR } from "@/lib/constants";
import { userFacingError } from "@/lib/publicError";
import { buildCategoryPlates, filterMenuItems, parseDiet } from "@/lib/menuView";
import {
  deleteKitchenCategory,
  deleteKitchenItem,
  emptyVariation,
  fetchKitchenMenu,
  patchKitchenItem,
  uploadKitchenPhoto,
  type KitchenCategory,
  type KitchenItem,
} from "@/components/admin/kitchenMenuShared";

function AdminMenuInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plate = searchParams.get("plate");
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [categories, setCategories] = useState<KitchenCategory[]>([]);
  const [query, setQuery] = useState("");
  const [diet, setDiet] = useState<DietPreference>(parseDiet(searchParams.get("diet")));
  const [form, setForm] = useState(emptyVariation);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyVariation);
  const [showAdd, setShowAdd] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", iconUrl: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = () =>
    fetchKitchenMenu().then((data) => {
      setItems(data.items);
      setCategories(data.categories);
    });

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setDiet(parseDiet(searchParams.get("diet")));
  }, [searchParams]);

  const liveItems = useMemo(() => items.filter((item) => item.isAvailable), [items]);
  const filteredLive = useMemo(() => filterMenuItems(liveItems, diet, query), [liveItems, diet, query]);
  const plates = useMemo(() => buildCategoryPlates(categories, filteredLive), [categories, filteredLive]);

  const dishes = useMemo(
    () => filterMenuItems(
      liveItems.filter((item) => item.category.slug === plate),
      diet,
      query
    ),
    [liveItems, plate, diet, query]
  );

  const drafts = useMemo(
    () =>
      items.filter((item) => {
        if (item.isAvailable || item.category.slug !== plate) return false;
        return diet === "all" || (diet === "veg" ? item.isVeg : !item.isVeg);
      }),
    [items, plate, diet]
  );

  const category = categories.find((row) => row.slug === plate);
  const title = category?.name || dishes[0]?.category.name || plate?.replace(/-/g, " ") || "Menu";
  const emptyCategories = useMemo(
    () =>
      categories.filter(
        (row) => !items.some((item) => item.categoryId === row.id && item.isAvailable)
      ),
    [categories, items]
  );

  const changeDiet = (next: DietPreference) => {
    setDiet(next);
    const nextUrl = plate ? `/admin/menu?plate=${plate}&diet=${next}` : `/admin/menu?diet=${next}`;
    router.replace(nextUrl, { scroll: false });
  };

  const saveMessage = (error: unknown, fallback: string) => {
    setMessage(userFacingError(error instanceof Error ? error.message : fallback));
  };

  const createCategory = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryForm),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(userFacingError(typeof data.error === "string" ? data.error : "Server Error"));
      return;
    }
    setCategoryForm({ name: "", iconUrl: "" });
    setShowNewCategory(false);
    setMessage("Category saved. Add dishes inside it, then Publish.");
    await load();
    if (data.category?.slug) {
      router.push(`/admin/menu?plate=${data.category.slug}&diet=${diet}&add=1`);
    }
  };

  const createVariation = async (event: FormEvent) => {
    event.preventDefault();
    if (!category) return;
    setSaving(true);
    const res = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        categoryId: category.id,
        price: Number(form.price),
        isAvailable: false,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMessage(userFacingError(typeof data.error === "string" ? data.error : "Server Error"));
      return;
    }
    setForm({ ...emptyVariation, isVeg: diet !== "nonveg" });
    setShowAdd(false);
    setMessage("Saved as draft. Publish to show it on the customer menu.");
    load();
  };

  const removeCategory = async () => {
    if (!category) return;
    if (!window.confirm(`Delete ${category.name} and its dishes?`)) return;
    try {
      await deleteKitchenCategory(category.id);
      setMessage("Category deleted.");
      router.push(`/admin/menu?diet=${diet}`);
    } catch (error) {
      saveMessage(error, "Could not delete category");
    }
  };

  useEffect(() => {
    setForm((current) => ({ ...current, isVeg: diet !== "nonveg" }));
    setEditing(null);
    setShowAdd(searchParams.get("add") === "1");
  }, [plate, diet, searchParams]);

  const renderRow = (item: KitchenItem, isDraft: boolean) => (
    <article key={item.id} className="border-b border-white/10 py-3.5 last:border-b-0">
      {editing === item.id ? (
        <div className="grid gap-2 md:grid-cols-2">
          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            className="rounded-full border border-white/10 bg-ink px-3 py-1.5"
          />
          <input
            value={draft.price}
            onChange={(event) => setDraft({ ...draft, price: event.target.value })}
            className="rounded-full border border-white/10 bg-ink px-3 py-1.5"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.isVeg}
              onChange={(event) => setDraft({ ...draft, isVeg: event.target.checked })}
            />
            Vegetarian
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                const url = await uploadKitchenPhoto(file);
                setDraft((current) => ({ ...current, imageUrl: url }));
              } catch (error) {
                saveMessage(error, "Upload failed");
              }
            }}
          />
          <textarea
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            className="rounded-2xl border border-white/10 bg-ink px-3 py-1.5 md:col-span-2"
          />
          <div className="flex gap-2 md:col-span-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await patchKitchenItem(item.id, {
                    name: draft.name,
                    description: draft.description,
                    price: Number(draft.price),
                    imageUrl: draft.imageUrl,
                    isVeg: draft.isVeg,
                  });
                  setEditing(null);
                  setMessage("Saved. Customer menu updated.");
                  load();
                } catch (error) {
                  saveMessage(error, "Could not save");
                }
              }}
              className="btn-glow px-4 py-1.5 text-sm"
            >
              Save
            </button>
            <button type="button" onClick={() => setEditing(null)} className="text-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 text-left">
            <span className="flex items-start gap-2">
              <span
                className={`mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border ${
                  item.isVeg ? "border-green-500" : "border-red-500"
                }`}
              >
                <span className={`h-2 w-2 ${item.isVeg ? "rounded-full bg-green-500" : "bg-red-500"}`} />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-base font-semibold leading-tight line-clamp-2">{item.name}</span>
                <span className="mt-1 block font-display text-sm text-brand-gold">{formatINR(item.price)}</span>
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm sm:justify-end">
            {isDraft ? <span className="text-xs text-brand-red">Draft</span> : null}
            <button
              type="button"
              onClick={async () => {
                try {
                  await patchKitchenItem(item.id, { isAvailable: !item.isAvailable });
                  setMessage(item.isAvailable ? "Hidden from customers." : "Published. Customers see it now.");
                  load();
                } catch (error) {
                  saveMessage(error, "Could not save");
                }
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                item.isAvailable ? "border border-white/15" : "bg-brand-red text-white"
              }`}
            >
              {item.isAvailable ? "Hide" : "Publish"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(item.id);
                setDraft({
                  name: item.name,
                  description: item.description,
                  price: String(item.price),
                  imageUrl: item.imageUrl,
                  isVeg: item.isVeg,
                });
              }}
              className="rounded-full border border-brand-gold/40 px-3 py-1.5 text-brand-gold"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!window.confirm(`Delete ${item.name}?`)) return;
                try {
                  await deleteKitchenItem(item.id);
                  setMessage("Deleted.");
                  load();
                } catch (error) {
                  saveMessage(error, "Could not delete");
                }
              }}
              className="rounded-full border border-white/15 px-3 py-1.5 text-brand-cream/55"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </article>
  );

  if (plate && items.length > 0 && !category && !dishes.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-brand-cream/60">That plate is not on the wok list.</p>
        <Link href={`/admin/menu?diet=${diet}`} className="btn-glow mt-6 inline-block px-6 py-3">
          Back to menu
        </Link>
      </div>
    );
  }

  if (plate) {
    return (
      <div className="page-bottom mx-auto max-w-7xl page-pad py-5 sm:py-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/menu?diet=${diet}`}
            className="rounded-full border border-white/10 p-2 text-brand-cream/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gold">Wok list</p>
            <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">{title}</h1>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <button type="button" onClick={() => setShowAdd(true)} className="btn-glow flex-1 px-4 py-2 text-sm sm:flex-none">
              + Add item
            </button>
            <button
              type="button"
              onClick={removeCategory}
              className="flex-1 rounded-full border border-brand-red/40 px-3 py-2 text-sm text-brand-red sm:flex-none"
            >
              Delete category
            </button>
          </div>
        </div>
        {message ? <p className="mb-3 text-sm text-brand-gold">{message}</p> : null}

        <div className="menu-toolbar mb-5">
          <div className="min-w-0 flex-1">
            <DietToggle value={diet} onChange={changeDiet} />
          </div>
          <form onSubmit={(event: FormEvent) => event.preventDefault()} className="menu-search">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-cream/50" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="w-full rounded-full border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand-red"
            />
          </form>
        </div>

        <section className="card-surface overflow-hidden px-3 sm:px-4">
          {dishes.length === 0 && drafts.length === 0 ? (
            <p className="py-12 text-center text-sm text-brand-cream/55">
              {diet === "veg" ? "No veg dishes here." : diet === "nonveg" ? "No non-veg dishes here." : "Nothing in this plate yet."}
            </p>
          ) : (
            <>
              {dishes.map((item) => renderRow(item, false))}
              {drafts.map((item) => renderRow(item, true))}
            </>
          )}
        </section>

        {showAdd ? (
          <KitchenPopup title="Add item" onClose={() => setShowAdd(false)}>
            <form onSubmit={createVariation} className="grid gap-3 md:grid-cols-2">
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Item name"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
              />
              <input
                required
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                placeholder="Price"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
              />
              <label className="text-sm text-brand-cream/70 md:col-span-2">
                Photo
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 block w-full text-xs"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadKitchenPhoto(file);
                      setForm((current) => ({ ...current, imageUrl: url }));
                    } catch (error) {
                      saveMessage(error, "Upload failed");
                    }
                  }}
                />
              </label>
              {form.imageUrl ? <p className="text-xs text-brand-gold md:col-span-2">Photo uploaded.</p> : null}
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Short description"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 md:col-span-2"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isVeg} onChange={(event) => setForm({ ...form, isVeg: event.target.checked })} />
                Vegetarian
              </label>
              <div className="flex gap-3 md:col-span-2">
                <button disabled={saving || !category} className="btn-glow px-5 py-2">
                  {saving ? "Saving..." : "Save draft"}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="text-sm text-brand-cream/60">
                  Cancel
                </button>
              </div>
            </form>
          </KitchenPopup>
        ) : null}
      </div>
    );
  }

  return (
    <div className="page-bottom mx-auto max-w-7xl page-pad py-5 sm:py-6">
      <header>
        <div>
          <p className="font-wall text-sm text-brand-gold sm:text-lg">Taste Talks Here</p>
          <h1 className="mt-0.5 font-display text-2xl font-extrabold leading-none tracking-tight sm:text-3xl">Menu</h1>
        </div>
      </header>
      {message ? <p className="mt-3 text-sm text-brand-gold">{message}</p> : null}

      <div className="menu-toolbar mt-3">
        <div className="min-w-0 flex-1">
          <DietToggle value={diet} onChange={changeDiet} />
        </div>
        <button
          type="button"
          onClick={() => setShowNewCategory(true)}
          className="btn-glow w-full shrink-0 px-3 py-2 text-sm sm:w-auto"
        >
          Add category
        </button>
        <form onSubmit={(event) => event.preventDefault()} className="menu-search">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-cream/50 sm:left-3 sm:h-4 sm:w-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="w-full rounded-full border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand-red sm:py-2 sm:pl-10"
          />
        </form>
      </div>

      <CategoryPlateGrid plates={plates} hrefFor={(slug) => `/admin/menu?plate=${slug}&diet=${diet}`}>
        {emptyCategories.map((row) => (
          <Link key={row.id} href={`/admin/menu?plate=${row.slug}&diet=${diet}&add=1`} className="card-surface group overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
              {row.iconUrl ? (
                <Image src={row.iconUrl} alt={row.name} fill unoptimized className="object-cover transition duration-500 group-hover:scale-110" />
              ) : (
                <div className="grid h-full place-items-center text-sm text-brand-cream/45">No photo yet</div>
              )}
            </div>
            <div className="space-y-3 p-4">
              <h2 className="font-display text-lg font-semibold">{row.name}</h2>
              <p className="text-sm text-brand-cream/65">0 dishes. Open to add items and publish.</p>
              <span className="btn-glow inline-flex w-full justify-center px-4 py-2 text-sm">Open {row.name}</span>
            </div>
          </Link>
        ))}
      </CategoryPlateGrid>
      {showNewCategory ? (
        <KitchenPopup
          title="New category"
          onClose={() => {
            setShowNewCategory(false);
            setCategoryForm({ name: "", iconUrl: "" });
          }}
        >
          <form onSubmit={createCategory} className="grid gap-3">
            <input
              required
              autoFocus
              value={categoryForm.name}
              onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
              placeholder="Category name — e.g. Pasta"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
            />
            <label className="text-sm text-brand-cream/70">
              Category image
              <input
                type="file"
                accept="image/*"
                className="mt-2 block w-full text-xs"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const url = await uploadKitchenPhoto(file);
                    setCategoryForm((current) => ({ ...current, iconUrl: url }));
                  } catch (error) {
                    saveMessage(error, "Upload failed");
                  }
                }}
              />
            </label>
            {categoryForm.iconUrl ? <p className="text-xs text-brand-gold">Photo uploaded.</p> : null}
            <div className="flex gap-3">
              <button disabled={saving} className="btn-glow px-5 py-2">
                {saving ? "Saving..." : "Create category"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewCategory(false);
                  setCategoryForm({ name: "", iconUrl: "" });
                }}
                className="text-sm text-brand-cream/60"
              >
                Cancel
              </button>
            </div>
          </form>
        </KitchenPopup>
      ) : null}
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

export default function AdminMenuPage() {
  return (
    <Suspense fallback={<div className="px-4 py-20 text-center">Loading kitchen menu...</div>}>
      <AdminMenuInner />
    </Suspense>
  );
}
