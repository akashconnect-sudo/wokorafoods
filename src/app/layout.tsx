import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter, Poppins } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { StickyCartBar } from "@/components/order/StickyCartBar";
import { Footer } from "@/components/layout/Footer";
import { ToastHost } from "@/components/ui/Toast";
import { BRAND, SITE_URL } from "@/lib/constants";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-poppins",
});
const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
});

const TITLE = `${BRAND.name} | ${BRAND.tagline}`;
const DESCRIPTION = `${BRAND.subTagline}. ${BRAND.name} at ${BRAND.location}. Momos, noodles, burgers, and cafe classics.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${BRAND.name}`,
  },
  description: DESCRIPTION,
  applicationName: BRAND.name,
  keywords: [
    BRAND.name,
    "Wokora Food",
    "momos",
    "noodles",
    "burgers",
    "cafe",
    "restaurant",
    "order food online",
  ],
  icons: {
    icon: [{ url: "/images/brand/icon.webp", type: "image/webp" }],
    shortcut: "/images/brand/icon.webp",
    apple: "/images/brand/apple-icon.webp",
  },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: "/images/brand/icon.webp",
        width: 512,
        height: 512,
        alt: `${BRAND.name} logo`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/brand/icon.webp"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0B0B0B",
  colorScheme: "dark",
};

// Wokora hamesha dark me chalta hai. Purana saved "light" / "system" ignore hota hai.
const themeBootScript = `
(function () {
  try {
    var root = document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    root.dataset.theme = "dark";
    if (localStorage.getItem("wokora-festive") === "1") {
      root.classList.add("festive");
    }
  } catch (error) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${poppins.variable} ${bebas.variable}`}
      data-theme="dark"
      style={{ colorScheme: "dark" }}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-svh overflow-x-clip bg-ink font-body text-brand-cream antialiased">
        <AppProviders>
          <Navbar />
          <main className="min-w-0 pb-[env(safe-area-inset-bottom,0px)]">{children}</main>
          <Footer />
          <StickyCartBar />
          <MobileBottomNav />
          <ToastHost />
        </AppProviders>
      </body>
    </html>
  );
}