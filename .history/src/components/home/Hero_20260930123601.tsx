"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BRAND } from "@/lib/constants";

export function Hero() {
  return (
    <section className="dark-band relative isolate min-h-[78svh] overflow-hidden sm:min-h-[85svh] lg:min-h-[92vh]">
      <Image
        src="https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=2000"
        alt="Wokora Foods cafe night"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-red/30 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-brand-gold/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[78svh] max-w-7xl flex-col justify-center px-4 py-16 sm:min-h-[85svh] sm:px-6 sm:py-24 lg:min-h-[92vh]">
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="font-wall text-xl text-brand-gold sm:text-3xl lg:text-4xl">
          {BRAND.subTagline}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-[0.95] text-white neon-red sm:text-5xl lg:text-7xl"
        >
          {BRAND.tagline}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 max-w-xl text-base text-white/80 sm:mt-6 sm:text-lg">
          Neon in the booth. Fire in the wok. A mood you can eat.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap">
          <Link href="/menu" className="btn-glow px-7 py-3 text-center">View Menu</Link>
          <Link href="/account" className="rounded-full border border-white/40 px-7 py-3 text-center font-display font-semibold text-white hover:border-brand-gold">
            Order Now
          </Link>
          <Link href="/about" className="rounded-full border border-white/40 px-7 py-3 text-center font-display font-semibold text-white hover:border-brand-gold">
            Our story
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
