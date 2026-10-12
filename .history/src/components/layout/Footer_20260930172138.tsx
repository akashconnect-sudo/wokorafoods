"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { usePathname } from "next/navigation";
import { Clock, MapPin, Phone, Mail } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { BRAND, CATEGORY_META } from "@/lib/constants";
import { useCafeAddress } from "@/hooks/useCafeAddress";
import { useCartAccess } from "@/hooks/useCartAccess";

function SocialIcon({
  name,
  className,
}: {
  name: "instagram" | "facebook" | "x";
  className?: string;
}) {
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4V10c0-.6.4-1 1-1Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L5.2 22H1.93l8.02-9.16L1.5 2h6.76l4.66 6.18L18.244 2Zm-1.16 18h1.8L7.01 3.9H5.08L17.084 20Z" />
    </svg>
  );
}

function MenuJump({
  slug,
  className,
  children,
}: {
  slug: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={`/menu/${slug}`} className={className}>
      {children}
    </Link>
  );
}

export function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { address } = useCafeAddress();
  const { isAdmin } = useCartAccess();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setMessage(res.ok ? "You're on the list." : "Please enter a valid email.");
    if (res.ok) setEmail("");
  };

  if (pathname === "/account") return null;

  return (
    <footer className="relative overflow-hidden border-t border-brand-red/30 bg-[#090909]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-gold to-transparent" />
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-brand-red/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl page-pad py-10 sm:py-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-lg">
            <Logo />
            <p className="mt-4 font-wall text-2xl text-brand-gold sm:text-3xl">{BRAND.subTagline}</p>
            <p className="mt-2 max-w-sm text-sm text-brand-cream/70">{BRAND.tagline} Booth-side ordering. Kitchen prints the ticket.</p>
          </div>
          <div className="rounded-3xl border border-brand-gold/35 bg-brand-gold/5 px-5 py-4 sm:min-w-[240px]">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
              <Clock className="h-4 w-4" /> Open tonight
            </p>
            <div className="mt-3 space-y-1 text-sm text-brand-cream/80">
              {BRAND.hours.map((row) => (
                <p key={row.day} className="flex items-baseline justify-between gap-4">
                  <span className="text-white">{row.day.split("–")[0].trim()}</span>
                  <span className="shrink-0 text-brand-gold">{row.time}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-cream/45">Jump to a plate</p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9">
            {CATEGORY_META.map((category) => (
              <MenuJump
                key={category.slug}
                slug={category.slug}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-black/40"
              >
                <span className="relative block aspect-square">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="120px"
                    unoptimized
                    className="object-cover transition duration-500 group-hover:scale-110"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute inset-x-1 bottom-1 line-clamp-2 text-center font-display text-[10px] font-semibold leading-tight text-white sm:text-xs">
                    {category.name}
                  </span>
                </span>
              </MenuJump>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-8 border-t border-white/10 pt-10 lg:grid-cols-2 lg:items-start lg:gap-14">
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
          <div className="space-y-3 text-sm text-brand-cream/75">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold">Visit</p>
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
              {address}
            </p>
            <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-brand-gold">
              <Phone className="h-4 w-4 text-brand-red" />
              {BRAND.phone}
            </a>
            <a href={`mailto:${BRAND.email}`} className="flex min-w-0 items-center gap-2 break-all hover:text-brand-gold">
              <Mail className="h-4 w-4 shrink-0 text-brand-red" />
              {BRAND.email}
            </a>
            <div className="flex gap-2 pt-1">
              <a href={BRAND.social.instagram} aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:border-brand-gold hover:text-brand-gold">
                <SocialIcon name="instagram" className="h-4 w-4" />
              </a>
              <a href={BRAND.social.facebook} aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:border-brand-gold hover:text-brand-gold">
                <SocialIcon name="facebook" className="h-4 w-4" />
              </a>
              <a href={BRAND.social.twitter} aria-label="X" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:border-brand-gold hover:text-brand-gold">
                <SocialIcon name="x" className="h-4 w-4" />
              </a>
            </div>
          </div>

          <nav className="text-sm text-brand-cream/75">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold">Explore</p>
            <div className="mt-3 flex flex-col gap-2.5">
              <Link href="/menu" className="hover:text-brand-gold">Full menu</Link>
              <Link href={isAdmin ? "/admin" : "/account"} className="hover:text-brand-gold">
                {isAdmin ? "Kitchen" : "Order"}
              </Link>
              <Link href="/about" className="hover:text-brand-gold">Our story</Link>
              <Link href="/#visit" className="hover:text-brand-gold">Visit</Link>
              {isAdmin ? (
                <Link href="/admin/kiosk" className="hover:text-brand-gold">Print kiosk</Link>
              ) : (
                <Link href="/cart" className="hover:text-brand-gold">Cart</Link>
              )}
              <Link href={isAdmin ? "/admin/settings" : "/account/support"} className="hover:text-brand-gold">
                {isAdmin ? "Settings" : "Support"}
              </Link>
            </div>
          </nav>
          </div>

          <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="font-display text-lg font-semibold">Booth drops & night specials</p>
            <p className="mt-1 text-xs text-brand-cream/50">No spam. Just the wok list.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-full border border-white/10 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-brand-red"
              />
              <button className="btn-glow shrink-0 px-5 py-2.5 text-sm">Join</button>
            </div>
            {message && <p className="mt-2 text-xs text-brand-gold">{message}</p>}
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-3">
              <Image src="/images/brand/fssai.svg" alt="FSSAI" width={96} height={36} unoptimized className="h-8 w-auto sm:h-9" />
              <p className="shrink-0 font-display text-xs tabular-nums tracking-[0.16em] text-[#E87722] sm:text-sm">
                {BRAND.fssai.number}
              </p>
            </div>
          </form>
        </div>
      </div>

      <div className="relative border-t border-white/10 px-4 py-4 text-center text-[11px] leading-relaxed text-brand-cream/45 sm:text-xs">
        <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
