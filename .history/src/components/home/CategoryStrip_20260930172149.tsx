"use client";

import Image from "next/image";
import Link from "next/link";
import { CATEGORY_META } from "@/lib/constants";

export function CategoryStrip() {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(245,166,35,0.16),transparent_36%),radial-gradient(circle_at_90%_80%,rgba(232,39,44,0.16),transparent_38%)]" />
      <div className="relative mx-auto max-w-7xl page-pad">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <p className="font-wall text-xl text-brand-gold sm:text-2xl">Pick your craving</p>
            <h2 className="heading-underline mt-1 font-display text-3xl font-bold sm:text-4xl">The wok list</h2>
          </div>
          <Link href="/menu" className="min-h-11 w-full rounded-full border border-white/15 px-5 py-2 text-center text-sm text-brand-gold hover:border-brand-gold sm:w-auto">
            See all dishes
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {CATEGORY_META.map((category) => (
            <Link
              key={category.slug}
              href={`/menu/${category.slug}`}
              className="group relative isolate min-h-[150px] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:min-h-[210px] lg:min-h-[280px]"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                unoptimized
                className="object-cover transition duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="line-clamp-2 font-display text-base font-bold tracking-wide text-white sm:text-xl lg:text-2xl">
                  {category.name}
                </p>
                <p className="mt-1 hidden text-xs text-white/65 sm:block sm:text-sm">Open this plate</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
