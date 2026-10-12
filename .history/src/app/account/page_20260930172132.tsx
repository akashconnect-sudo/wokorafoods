"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DietPreference } from "@/components/menu/DietToggle";
import { DietGate } from "@/components/order/DietGate";
import { DietIcons } from "@/components/order/DietIcons";
import { ExploreMenu } from "@/components/menu/ExploreMenu";
import { OrderBill, type BillOrder } from "@/components/account/OrderBill";
import { displayOrderNumber, formatINR } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import { uniqueByName } from "@/lib/uniqueByName";
import type { FoodCardItem } from "@/components/menu/CustomizeItemPanel";

type Order = BillOrder & {
  items: {
    quantity: number;
    customization?: string;
    menuItem: { id: string; name: string; price: number; imageUrl: string; isVeg: boolean };
  }[];
};

type Account = {
  name: string;
  phone: string;
  email: string | null;
  loyaltyPoints: number;
  dietPreference: DietPreference;
  orders: Order[];
  lastDelivered: Order | null;
};

type MenuItem = FoodCardItem & {
  category: { name: string; slug: string };
  isFeatured?: boolean;
};

type Category = { id: string; name: string; slug: string; iconUrl?: string | null };

export default function OrderHomePage() {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const orderType = useCartStore((state) => state.orderType);
  const setOrderType = useCartStore((state) => state.setOrderType);
  const [user, setUser] = useState<Account | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [diet, setDiet] = useState<DietPreference>("all");
  const [gateOpen, setGateOpen] = useState(true);
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/account")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/account");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data?.user) return;
        setUser(data.user);
        const saved = data.user.dietPreference as DietPreference;
        if (saved === "veg" || saved === "nonveg" || saved === "all") {
          setDiet(saved);
          setGateOpen(saved === "all");
        }
      });

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
  }, [router]);

  const saveDiet = (next: DietPreference) => {
    setDiet(next);
    setGateOpen(false);
    fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dietPreference: next }),
    }).catch(() => undefined);
  };

  const filtered = useMemo(() => {
    const rows = items.filter((item) => {
      const matchesDiet = diet === "all" || (diet === "veg" ? item.isVeg : !item.isVeg);
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase());
      return matchesDiet && matchesQuery;
    });
    return uniqueByName(rows);
  }, [items, diet, query]);

  const deals = useMemo(
    () =>
      uniqueByName(
        items
          .filter((item) => item.isFeatured)
          .filter((item) => diet === "all" || (diet === "veg" ? item.isVeg : !item.isVeg))
      ).slice(0, 8),
    [items, diet]
  );

  if (!user) return <div className="py-24 text-center text-brand-cream/60">Loading the kitchen...</div>;

  const firstName = user.name.split(" ")[0];
  const lastDelivered = user.lastDelivered;
  const latestUnpaid = user.orders.find(
    (order) => order.paymentStatus === "failed" || order.paymentStatus === "pending"
  );

  const reorder = (order: Order) => {
    order.items.forEach((item) => {
      if (!item.menuItem.id) return;
      addItem(
        {
          id: item.menuItem.id,
          name: item.menuItem.name,
          price: item.menuItem.price || 0,
          imageUrl: item.menuItem.imageUrl || "/images/menu/placeholder.png",
          isVeg: item.menuItem.isVeg ?? true,
        },
        item.quantity
      );
    });
    router.push("/cart");
  };

  if (gateOpen) {
    return <DietGate name={firstName} onPick={saveDiet} />;
  }

  return (
    <div className="page-bottom">
      <div className="border-b border-white/10 bg-charcoal/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 page-pad py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">Hi {firstName}</p>
            <p className="font-display text-xl font-semibold leading-tight sm:text-xl">Wokora Foods</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex w-full rounded-full border border-white/15 bg-black/30 p-1 text-sm sm:w-auto">
              <button
                type="button"
                onClick={() => setOrderType("dine_in")}
                className={`flex-1 rounded-full px-4 py-1.5 sm:flex-none ${orderType === "dine_in" ? "bg-brand-red text-white" : "text-brand-cream/65"}`}
              >
                Dine-in
              </button>
              <button
                type="button"
                onClick={() => setOrderType("takeaway")}
                className={`flex-1 rounded-full px-4 py-1.5 sm:flex-none ${orderType === "takeaway" ? "bg-brand-red text-white" : "text-brand-cream/65"}`}
              >
                Takeaway
              </button>
            </div>
            <DietIcons value={diet} onChange={saveDiet} />
            <button type="button" onClick={() => setGateOpen(true)} className="text-xs text-brand-cream/50 hover:text-brand-gold">
              Change
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl page-pad">
        {latestUnpaid ? (
          <div className="mt-5">
            <OrderBill order={latestUnpaid} compact onReorder={() => reorder(latestUnpaid)} />
          </div>
        ) : null}

        {lastDelivered ? (
          <button
            type="button"
            onClick={() => reorder(lastDelivered)}
            className="mt-5 flex w-full flex-col gap-2 rounded-2xl border border-brand-gold/30 bg-brand-gold/10 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              <span className="block text-xs uppercase tracking-widest text-brand-gold">Last delivered</span>
              <span className="text-sm text-brand-cream/80">
                {displayOrderNumber(lastDelivered.serialNumber)} ·{" "}
                <span className="line-clamp-2 sm:line-clamp-1">
                  {lastDelivered.items.map((item) => item.menuItem.name).join(", ")}
                </span>
              </span>
            </span>
            <span className="font-display text-brand-gold">{formatINR(lastDelivered.totalAmount)}</span>
          </button>
        ) : null}

        {deals.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-2xl font-bold">Wokora Deals</h2>
            <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-2">
              {deals.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    addItem({
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      imageUrl: item.imageUrl,
                      isVeg: item.isVeg,
                    })
                  }
                  className="w-64 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-charcoal text-left"
                >
                  <div className="relative h-36">
                    <Image src={item.imageUrl} alt={item.name} fill unoptimized className="object-cover" />
                    <span className="absolute left-3 top-3 rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-bold text-white">
                      DEAL
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-display font-semibold">{item.name}</p>
                    <p className="mt-1 text-sm text-brand-gold">{formatINR(item.price)} · Tap to add</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10">
          <ExploreMenu
            items={filtered}
            categories={categories}
            query={query}
            onQuery={setQuery}
            active={active}
            onActive={setActive}
          />
        </div>
      </div>
    </div>
  );
}
