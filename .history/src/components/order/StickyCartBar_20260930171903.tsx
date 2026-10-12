"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cartCount, cartSubtotal, useCartStore } from "@/store/cartStore";
import { formatINR } from "@/lib/constants";
import { useCartAccess } from "@/hooks/useCartAccess";

export function StickyCartBar() {
  const pathname = usePathname();
  const { canUseCart } = useCartAccess();
  const items = useCartStore((state) => state.items);
  const count = cartCount(items);
  const total = cartSubtotal(items);
  const aboveNav = canUseCart;

  if (!canUseCart || count === 0) return null;
  if (pathname === "/cart" || pathname.startsWith("/pay") || pathname.startsWith("/admin")) return null;
  const onPlatePage = /^\/menu\/[^/]+$/.test(pathname);

  return (
    <>
      <div className={onPlatePage ? "h-16 sm:h-20 md:hidden" : aboveNav ? "h-16 sm:h-20" : "h-20"} aria-hidden />
      <div
        className={`pointer-events-none fixed inset-x-0 z-[45] px-3 sm:px-4 ${
          onPlatePage ? "md:hidden " : ""
        }${
          aboveNav
            ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6"
            : "bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:bottom-6"
        }`}
      >
        <Link
          href="/cart"
          className="pointer-events-auto mx-auto flex max-w-xl items-center justify-between gap-3 rounded-full bg-brand-red px-4 py-3 text-white shadow-[0_12px_40px_rgba(232,39,44,0.45)] sm:px-5"
        >
          <span className="min-w-0 truncate text-sm font-medium">
            {count} {count === 1 ? "item" : "items"} · {formatINR(total)}
          </span>
          <span className="shrink-0 font-display text-sm font-semibold tracking-wide">VIEW CART</span>
        </Link>
      </div>
    </>
  );
}
