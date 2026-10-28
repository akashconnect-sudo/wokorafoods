"use client";

import Image from "next/image";
import type { DietPreference } from "@/components/menu/DietToggle";

const VEG_HERO =
  "https://images.pexels.com/photos/3616956/pexels-photo-3616956.jpeg?auto=compress&cs=tinysrgb&w=1400";
const NONVEG_HERO =
  "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1400";

export function DietGate({
  name,
  onPick,
}: {
  name: string;
  onPick: (value: Exclude<DietPreference, "all"> | "all") => void;
}) {
  return (
    <section className="page-bottom mx-auto flex min-h-[calc(100svh-4rem-env(safe-area-inset-top,0px))] max-w-6xl flex-col justify-center page-pad py-8">
      <p className="text-sm uppercase tracking-[0.28em] text-brand-gold">Hi {name}</p>
      <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl lg:text-6xl">What are you eating?</h1>
      <p className="mt-3 max-w-xl text-brand-cream/65">
        Pick veg or non-veg first — same as a Burger King order. Your menu will follow this choice.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-6">
        <button
          type="button"
          onClick={() => onPick("veg")}
          className="group relative min-h-[200px] overflow-hidden rounded-[2rem] text-left sm:min-h-[260px] md:min-h-[320px] lg:min-h-[420px]"
        >
          <Image src={VEG_HERO} alt="Vegetarian dishes" fill className="object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <span className="grid h-8 w-8 place-items-center rounded-md border-2 border-green-400 bg-black/40">
              <span className="h-3.5 w-3.5 rounded-full bg-green-400" />
            </span>
            <p className="mt-4 font-display text-3xl font-bold sm:text-5xl lg:text-6xl">VEG</p>
            <p className="mt-1 text-sm text-white/70">Green-dot menu only</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onPick("nonveg")}
          className="group relative min-h-[200px] overflow-hidden rounded-[2rem] text-left sm:min-h-[260px] md:min-h-[320px] lg:min-h-[420px]"
        >
          <Image src={NONVEG_HERO} alt="Non-vegetarian dishes" fill className="object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <span className="grid h-8 w-8 place-items-center rounded-md border-2 border-red-500 bg-black/40">
              <span className="h-3.5 w-3.5 bg-red-500" />
            </span>
            <p className="mt-4 font-display text-3xl font-bold sm:text-5xl lg:text-6xl">NON-VEG</p>
            <p className="mt-1 text-sm text-white/70">Chicken, seafood, and classics</p>
          </div>
        </button>
      </div>

      <button
        type="button"
        onClick={() => onPick("all")}
        className="mt-6 self-center text-sm text-brand-cream/55 underline-offset-4 hover:text-brand-gold hover:underline"
      >
        See the full menu
      </button>
    </section>
  );
}
