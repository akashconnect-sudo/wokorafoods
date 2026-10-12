"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatINR } from "@/lib/constants";
import type { MenuPlate } from "@/lib/menuView";

export function CategoryPlateGrid({
  plates,
  hrefFor,
  children,
}: {
  plates: MenuPlate[];
  hrefFor: (slug: string) => string;
  children?: ReactNode;
}) {
  return (
    <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {plates.map(({ category, featured, count, fromPrice, image }) => (
        <Link
          key={category.slug}
          id={category.slug}
          href={hrefFor(category.slug)}
          className="card-surface group overflow-hidden"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
            {image ? (
              <Image
                src={image}
                alt={category.name}
                fill
                unoptimized
                className="object-cover transition duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-brand-cream/45">No photo</div>
            )}
            <span
              className={`absolute left-3 top-3 h-3 w-3 ring-2 ring-white ${
                featured.isVeg ? "rounded-full bg-green-500" : "bg-red-500"
              }`}
              title={featured.isVeg ? "Vegetarian" : "Non-vegetarian"}
            />
            {!featured.isVeg && (
              <span className="absolute right-3 top-3 rounded-full bg-brand-red px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Chicken
              </span>
            )}
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 truncate font-display text-lg font-semibold">{category.name}</h2>
              <p className="font-display text-brand-gold">{formatINR(fromPrice)}</p>
            </div>
            <p className="line-clamp-2 text-sm text-brand-cream/65">
              {count} {count === 1 ? "dish" : "dishes"}. {featured.description}
            </p>
            <span className="btn-glow inline-flex w-full justify-center px-4 py-2 text-sm">Open {category.name}</span>
          </div>
        </Link>
      ))}
      {children}
    </div>
  );
}
