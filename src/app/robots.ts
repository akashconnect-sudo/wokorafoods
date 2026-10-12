import type { MetadataRoute } from "next";

const SITE_URL = "https://wokorafoods.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/account",
          "/cart",
          "/api/",
          "/order/",
          "/pay/",
          "/table/",
          "/reset-password",
          "/forgot-password",
        ],
      },
    ],
    sitemap: SITE_URL + "/sitemap.xml",
    host: SITE_URL,
  };
}