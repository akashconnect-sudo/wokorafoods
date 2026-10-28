"use client";

import dynamic from "next/dynamic";
import { Hero } from "@/components/home/Hero";
import { LocationHours } from "@/components/home/LocationHours";
import { LazyReveal } from "@/components/ui/LazyReveal";

const CategoryStrip = dynamic(
  () => import("@/components/home/CategoryStrip").then((mod) => ({ default: mod.CategoryStrip })),
  { ssr: false }
);
const AboutSection = dynamic(
  () => import("@/components/home/AboutSection").then((mod) => ({ default: mod.AboutSection })),
  { ssr: false }
);
const HowItWorks = dynamic(
  () => import("@/components/home/HowItWorks").then((mod) => ({ default: mod.HowItWorks })),
  { ssr: false }
);
const WhyWokora = dynamic(
  () => import("@/components/home/WhyWokora").then((mod) => ({ default: mod.WhyWokora })),
  { ssr: false }
);
const ChefGallery = dynamic(
  () => import("@/components/home/ChefGallery").then((mod) => ({ default: mod.ChefGallery })),
  { ssr: false }
);
const Testimonials = dynamic(
  () => import("@/components/home/Testimonials").then((mod) => ({ default: mod.Testimonials })),
  { ssr: false }
);
const CtaBanner = dynamic(
  () => import("@/components/home/CtaBanner").then((mod) => ({ default: mod.CtaBanner })),
  { ssr: false }
);

export function HomeBody() {
  return (
    <div className="page-bottom">
      <Hero />
      <LazyReveal minHeight={360}>
        <CategoryStrip />
      </LazyReveal>
      <LazyReveal minHeight={340}>
        <AboutSection />
      </LazyReveal>
      <LazyReveal minHeight={280}>
        <HowItWorks />
      </LazyReveal>
      <LazyReveal minHeight={280}>
        <WhyWokora />
      </LazyReveal>
      <LazyReveal minHeight={320}>
        <ChefGallery />
      </LazyReveal>
      <LazyReveal minHeight={240}>
        <Testimonials />
      </LazyReveal>
      <LazyReveal minHeight={280}>
        <LocationHours />
      </LazyReveal>
      <LazyReveal minHeight={200}>
        <CtaBanner />
      </LazyReveal>
    </div>
  );
}
