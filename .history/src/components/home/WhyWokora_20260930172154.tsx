"use client";

import { Leaf, Sofa, Timer, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";

const FEATURES = [
  { title: "Fresh Ingredients", copy: "Daily prep, no freezer-aisle shortcuts.", icon: Leaf },
  { title: "Fast Service", copy: "Table-side digital orders hit the kitchen instantly.", icon: Timer },
  { title: "Cozy Ambience", copy: "Neon walls, red booths, pendant lights, plants.", icon: Sofa },
  { title: "Wide Variety", copy: "Burgers, momos, spring rolls, noodles, wraps, chilli potato, fried rice — one wok list.", icon: UtensilsCrossed },
];

export function WhyWokora() {
  return (
    <section className="bg-brand-glow py-12 sm:py-16">
      <div className="mx-auto max-w-7xl page-pad">
        <h2 className="heading-underline font-display text-2xl font-bold sm:text-3xl">Why Wokora Foods</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="card-surface p-4 sm:p-6"
            >
              <feature.icon className="h-8 w-8 text-brand-red" />
              <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-brand-cream/65">{feature.copy}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
