"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChefHat,
  CircleHelp,
  Clock,
  Leaf,
  MapPin,
  Phone,
  Smartphone,
  Sofa,
  UtensilsCrossed,
} from "lucide-react";
import { BRAND } from "@/lib/constants";
import { MENU_CATEGORIES } from "@/data/menu";
import { useCafeAddress } from "@/hooks/useCafeAddress";
import { CafeMap } from "@/components/location/CafeMap";

const NAV = [
  { href: "#who", label: "Who we are" },
  { href: "#menu", label: "What we cook" },
  { href: "#order", label: "How to order" },
  { href: "#visit", label: "Visit us" },
];

const PLATE_COPY: Record<string, string> = {
  burger: "Classic, cheese burst, peri peri, smash and more. Veg or chicken patty.",
  coffee: "Espresso, latte, cappuccino, mocha, filter and cold coffee.",
  momos: "Steamed, fried, tandoori, kurkure, chilli, pan-fried and more.",
  "spring-rolls": "Classic, cheese, schezwan and extra-crisp rolls.",
  noodles: "Hakka, schezwan, chilli garlic, Singapore and garlic butter.",
  "chilli-potato": "Honey chilli, dry, garlic and schezwan.",
  "fried-rice": "Classic, burnt garlic, chilli, schezwan and Hong Kong.",
  wraps: "Classic, peri peri, cheese melt, schezwan and loaded.",
  "chicken-lollipop": "Classic, dry, gravy, schezwan and crispy. Non-veg only.",
};

const PILLARS = [
  {
    title: "Our food, our name",
    copy: "Every plate says Wokora Foods. Nine types from our kitchen — wok steam, grill char, chilli-gold — not a food-court mix.",
    icon: ChefHat,
  },
  {
    title: "Sit and order",
    copy: "Take a red booth, open the menu on your phone, tap the plate. The kitchen prints the ticket. Food walks to you.",
    icon: Sofa,
  },
  {
    title: "Veg and non-veg, marked",
    copy: "Green mark is vegetarian. Red mark is non-veg. Most dishes come as veg or chicken. Coffee is veg. Lollipop is non-veg only.",
    icon: Leaf,
  },
];

const STEPS = [
  {
    title: "Sit at a table",
    copy: "Walk in, pick a booth or table, and stay seated. That is your place until the food arrives.",
    icon: Sofa,
  },
  {
    title: "Open the Wokora Foods menu",
    copy: "Scan the QR on the table, or use this website. You will see the same nine food types.",
    icon: Smartphone,
  },
  {
    title: "Add dishes and place the order",
    copy: "Tap a food type, pick the dish, choose veg or chicken where it applies, then add to cart.",
    icon: UtensilsCrossed,
  },
  {
    title: "We cook it and serve you",
    copy: "The kitchen gets your order, cooks it, and staff bring it to your table. You do not stand in line.",
    icon: ChefHat,
  },
];

const FAQS = [
  {
    q: "What is Wokora Foods?",
    a: `Wokora Foods is the night cafe in ${BRAND.location}. Nine plates, our kitchen, our name — you sit in the booth, tap the menu, and we serve the wok to your table.`,
  },
  {
    q: "What can I eat here?",
    a: "Burgers, coffee, momos, spring rolls, noodles, chilli potato, fried rice, wraps, and chicken lollipop. That is the full list — nothing extra, nothing missing.",
  },
  {
    q: "How do I order?",
    a: "Sit down, open the menu on your phone, add food, and place the order. We cook it and bring it to the table.",
  },
  {
    q: "Is vegetarian food available?",
    a: "Yes. Veg dishes have a green mark. Non-veg has a red mark. Use Veg, Non-veg, or Both on the menu to filter.",
  },
];

const HERO_SHOTS = [
  { src: "/images/categories/burger.png", alt: "Wokora Foods burger", className: "col-span-2 aspect-[16/10]" },
  { src: "/images/categories/momos.png", alt: "Wokora Foods momos", className: "aspect-square" },
  { src: "/images/categories/noodles.png", alt: "Wokora Foods noodles", className: "aspect-square" },
] as const;

export default function AboutPage() {
  const { address, mapSrc } = useCafeAddress();

  return (
    <div>
      <section className="dark-band relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-brand-red/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-gold">About us</p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 font-display text-4xl font-extrabold leading-[0.95] text-white neon-red sm:text-5xl lg:text-6xl"
            >
              {BRAND.name}
            </motion.h1>
            <p className="mt-3 font-display text-xl font-semibold text-brand-cream sm:text-2xl">{BRAND.tagline}</p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Wokora is the wok and the aura around it. Nine plates, our kitchen, our name. Green-dot
              veg. Red-mark heat. You sit in the booth, tap the menu, and we serve the night to your table.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-sm text-white/70">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Nine plates. Our kitchen.</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Green-dot veg. Red-mark heat.</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Booth tap. Table serve.</span>
            </div>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link href="/menu" className="btn-glow px-7 py-3 text-center">
                View menu
              </Link>
              <Link
                href="#order"
                className="rounded-full border border-white/25 px-7 py-3 text-center font-display font-semibold text-white hover:border-brand-gold"
              >
                How to order
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            {HERO_SHOTS.map((shot, index) => (
              <div key={shot.src} className={`relative overflow-hidden rounded-3xl border border-white/10 ${shot.className}`}>
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  fill
                  priority={index === 0}
                  unoptimized
                  sizes="(max-width: 1024px) 90vw, 42vw"
                  className="object-cover object-center"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <nav aria-label="On this page" className="sticky top-14 z-30 border-y border-white/10 bg-ink/90 backdrop-blur-xl sm:top-16">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 no-scrollbar sm:px-6 sm:justify-center">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-white/15 px-4 py-2 text-sm text-brand-cream/80 hover:border-brand-gold hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <section id="who" className="scroll-mt-28 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Who we are</p>
        <h2 className="heading-underline mt-2 font-display text-3xl font-bold sm:text-4xl">The name on the door is the name on the plate.</h2>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-brand-cream/75 sm:text-lg">
          Walk into Shop 23, Siddharth Vihar. Red booths, gold light, one wok list. Friends, phones,
          tickets printing at the counter — that is a Wokora night. Taste talks here. Mood follows.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PILLARS.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="card-surface p-6"
            >
              <item.icon className="h-6 w-6 text-brand-gold" />
              <h3 className="mt-4 font-display text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-cream/65">{item.copy}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="menu" className="scroll-mt-28 border-y border-white/10 bg-black/35 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">What we cook</p>
              <h2 className="heading-underline mt-2 font-display text-3xl font-bold sm:text-4xl">Nine food types. That is the full menu.</h2>
              <p className="mt-4 max-w-xl text-sm text-brand-cream/65 sm:text-base">
                Tap any card to open that section. Inside, you will see dish names, veg or non-veg, and the price.
              </p>
            </div>
            <Link href="/menu" className="min-h-11 w-full rounded-full border border-white/15 px-5 py-2 text-center text-sm text-brand-gold hover:border-brand-gold sm:w-auto">
              Open full menu
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
            {MENU_CATEGORIES.map((category, index) => (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
              >
                <Link href={`/menu/${category.slug}`} className="group card-surface block overflow-hidden">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={category.image}
                      alt={`${BRAND.name} ${category.name}`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover object-center transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                    <p className="absolute left-3 top-3 font-display text-sm font-bold text-brand-gold">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-display text-lg font-bold sm:text-xl">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-xs leading-snug text-brand-cream/55 sm:text-sm">{PLATE_COPY[category.slug]}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="order" className="scroll-mt-28 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">How to order</p>
        <h2 className="heading-underline mt-2 font-display text-3xl font-bold sm:text-4xl">Four steps. No counter line.</h2>
        <p className="mt-4 max-w-2xl text-brand-cream/65">
          If you can use a phone, you can order at {BRAND.name}. Follow these in order.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {STEPS.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="card-surface flex gap-4 p-5 sm:p-6"
            >
              <p className="font-display text-3xl font-extrabold text-brand-red">{String(index + 1).padStart(2, "0")}</p>
              <div>
                <step.icon className="h-5 w-5 text-brand-gold" />
                <h3 className="mt-2 font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-cream/65">{step.copy}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="bg-ink/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <CircleHelp className="h-5 w-5 text-brand-gold" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Simple answers</p>
          </div>
          <h2 className="heading-underline mt-2 font-display text-3xl font-bold sm:text-4xl">If you are new, start here.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {FAQS.map((item) => (
              <article key={item.q} className="card-surface p-6">
                <h3 className="font-display text-lg font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-cream/65">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="visit" className="scroll-mt-28 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Visit us</p>
        <h2 className="heading-underline mt-2 font-display text-3xl font-bold sm:text-4xl">Come to {BRAND.name}.</h2>
        <div className="mt-10 card-surface overflow-hidden lg:grid lg:grid-cols-2">
          <CafeMap address={address} mapSrc={mapSrc} className="min-h-[280px] sm:min-h-[360px]" />
          <div className="space-y-5 p-5 sm:p-8 md:p-12">
            <p className="flex gap-3 text-brand-cream/80">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
              {address}
            </p>
            <p className="flex gap-3 text-brand-cream/80">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
              <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="hover:text-brand-gold">
                {BRAND.phone}
              </a>
            </p>
            <div className="flex gap-3 text-brand-cream/80">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
              <div>
                {BRAND.hours.map((row) => (
                  <p key={row.day}>
                    <span className="text-white">{row.day}:</span> {row.time}
                  </p>
                ))}
              </div>
            </div>
            <p className="text-sm text-brand-gold">{BRAND.email}</p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <Link href="/menu" className="btn-glow px-6 py-3 text-center">
                View menu
              </Link>
              <Link
                href="/account"
                className="rounded-full border border-white/20 px-6 py-3 text-center font-display font-semibold hover:border-brand-gold"
              >
                Order now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
