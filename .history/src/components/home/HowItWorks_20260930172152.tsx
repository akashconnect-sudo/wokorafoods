"use client";

import { motion } from "framer-motion";
import { QrCode, Smartphone, Flame, Utensils } from "lucide-react";

const STEPS = [
  { title: "Scan the table", copy: "QR on the booth opens your order screen with the table number.", icon: QrCode },
  { title: "Tap the plate", copy: "Momos, noodles, burgers — add, pay, done.", icon: Smartphone },
  { title: "Kitchen prints", copy: "Ticket hits the counter. Staff set your wait time.", icon: Flame },
  { title: "Eat in the glow", copy: "Stay in the red booth. Notification when it's ready.", icon: Utensils },
];

export function HowItWorks() {
  return (
    <section className="bg-brand-glow py-12 sm:py-16">
      <div className="mx-auto max-w-7xl page-pad">
        <h2 className="heading-underline font-display text-2xl font-bold sm:text-3xl">How a Wokora night works</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="card-surface p-4 sm:p-6"
            >
              <p className="font-wall text-3xl text-brand-red">0{index + 1}</p>
              <step.icon className="mt-3 h-7 w-7 text-brand-gold" />
              <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-brand-cream/65">{step.copy}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
