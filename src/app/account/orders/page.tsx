"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderBill, type BillOrder } from "@/components/account/OrderBill";
import { useCartStore } from "@/store/cartStore";

export default function CustomerOrdersPage() {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [orders, setOrders] = useState<BillOrder[]>([]);

  useEffect(() => {
    fetch("/api/account")
      .then((res) => res.json())
      .then((data) => setOrders(data.user?.orders || []));
  }, []);

  const reorder = (order: BillOrder) => {
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

  return (
    <div>
      <h1 className="heading-underline font-display text-3xl font-bold">Your bills</h1>
      <p className="mt-3 text-sm text-brand-cream/60">
        Every Wokora Foods bill stays here — paid, pending, or failed. Delivered orders remain for easy reordering.
      </p>
      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <OrderBill key={order.id} order={order} onReorder={() => reorder(order)} />
        ))}
        {orders.length === 0 && <p className="text-brand-cream/50">You have not placed an order yet.</p>}
      </div>
    </div>
  );
}
