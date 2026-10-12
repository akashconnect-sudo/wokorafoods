import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { DEFAULT_STORE_ID } from "@/lib/store";

const SITE_URL = "https://wokorafoods.com";

// Har request par database se taza list banegi, taaki nayi category apne aap aa jaye.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: SITE_URL + "/menu", lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: SITE_URL + "/about", lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: SITE_URL + "/login", lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await prisma.category.findMany({
      where: {
        storeId: DEFAULT_STORE_ID,
        items: { some: { isAvailable: true } },
      },
      select: { slug: true },
      orderBy: { sortOrder: "asc" },
    });

    categoryPages = categories.map(
      (category): MetadataRoute.Sitemap[number] => ({
        url: SITE_URL + "/menu/" + category.slug,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    );
  } catch (error) {
    console.error("[sitemap] categories load failed", error);
  }

  return [...staticPages, ...categoryPages];
}