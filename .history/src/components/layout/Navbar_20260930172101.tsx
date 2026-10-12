"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, ShoppingBag, Sparkles, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { ThemePicker } from "@/components/theme/ThemePicker";
import { cartCount, useCartStore } from "@/store/cartStore";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
  { href: "/#visit", label: "Visit" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const items = useCartStore((state) => state.items);
  const [open, setOpen] = useState(false);
  const [festive, setFestive] = useState(false);
  const count = cartCount(items);

  useEffect(() => {
    setFestive(localStorage.getItem("wokora-festive") === "1");
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggleFestive = () => {
    const next = !festive;
    setFestive(next);
    localStorage.setItem("wokora-festive", next ? "1" : "0");
    document.documentElement.classList.toggle("festive", next);
  };

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 xs:px-4 sm:h-16 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-4 md:flex lg:gap-6 xl:gap-8">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium tracking-wide ${
                pathname === link.href ? "text-brand-red" : "text-brand-cream/75 hover:text-brand-red"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {session?.user.role === "customer" && (
            <>
              <Link href="/account" className={`hidden text-sm lg:inline ${pathname === "/account" ? "text-brand-red" : "text-brand-cream/75"}`}>
                Order
              </Link>
              <Link href="/account/support" className="hidden text-sm text-brand-cream/75 hover:text-brand-red lg:inline">
                Support
              </Link>
            </>
          )}
        </nav>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleFestive}
            className={`hidden rounded-full p-2 md:grid ${festive ? "text-brand-gold" : "text-brand-cream/70"}`}
            aria-label="Toggle festive theme"
          >
            <Sparkles className="h-5 w-5" />
          </button>
          <NotificationBell />
          {session?.user.role !== "admin" && (
          <Link href="/cart" className="relative rounded-full p-2 text-brand-cream hover:text-brand-red">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-red px-1 text-[10px] font-bold">
                {count}
              </span>
            )}
          </Link>
          )}
          {session ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href={session.user.role === "admin" ? "/admin" : "/account"}
                className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-brand-cream hover:border-brand-red/50"
              >
                <UserRound className="h-4 w-4" />
                <span className="hidden lg:inline">{session.user.name?.split(" ")[0]}</span>
              </Link>
              <LogoutButton className="rounded-full border border-brand-red/40 px-3 py-1.5 text-sm text-brand-red hover:bg-brand-red/10" />
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-brand-cream hover:border-brand-red/50 md:flex"
            >
              <UserRound className="h-4 w-4" />
              Login
            </Link>
          )}
          <button
            type="button"
            className="rounded-full p-2 text-brand-cream md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>

      <div
        className={`fixed inset-0 z-[80] md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/35 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`dark-band absolute inset-y-0 left-0 flex w-[min(78vw,19rem)] flex-col border-r border-white/20 bg-black/55 px-5 py-6 shadow-[8px_0_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-black/40" />
          <div className="relative mb-8 flex items-center justify-between">
            <Logo />
            <button type="button" className="rounded-full p-2" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="relative flex flex-1 flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-full px-4 py-3 text-base ${
                  pathname === link.href ? "bg-brand-red/90 text-white shadow-neon" : "text-white/90"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {session?.user.role === "customer" && (
              <>
                <Link href="/account" onClick={() => setOpen(false)} className="rounded-full px-4 py-3 text-white/90">
                  Order
                </Link>
                <Link href="/account/settings" onClick={() => setOpen(false)} className="rounded-full px-4 py-3 text-white/90">
                  Settings
                </Link>
                <Link href="/account/support" onClick={() => setOpen(false)} className="rounded-full px-4 py-3 text-white/90">
                  Support
                </Link>
              </>
            )}
            {session?.user.role === "admin" && (
              <>
                <Link href="/admin" onClick={() => setOpen(false)} className="rounded-full px-4 py-3 text-white/90">
                  Kitchen
                </Link>
                <Link href="/admin/kiosk" onClick={() => setOpen(false)} className="rounded-full px-4 py-3 text-white/90">
                  Print kiosk
                </Link>
              </>
            )}
          </nav>
          <div className="relative mt-auto space-y-3 border-t border-white/15 pt-4">
            {session && <ThemePicker compact />}
            <button
              type="button"
              onClick={toggleFestive}
              className={`flex w-full items-center gap-2 rounded-full px-4 py-3 text-left ${festive ? "text-brand-gold" : "text-white/70"}`}
            >
              <Sparkles className="h-4 w-4" />
              Festive theme
            </button>
            {session ? (
              <LogoutButton className="w-full rounded-full border border-brand-red/40 bg-black/20 px-4 py-2.5 text-left text-brand-red" />
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="block rounded-full bg-brand-red px-4 py-2.5 text-center font-semibold">
                Login
              </Link>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
