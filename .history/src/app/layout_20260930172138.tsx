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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${BRAND.name} | ${BRAND.tagline}`,
  description: `${BRAND.subTagline}. ${BRAND.name} at ${BRAND.location}. Momos, noodles, burgers, and cafe classics.`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

const themeBootScript = `
(function () {
  try {
    var stored = localStorage.getItem("wokora-theme") || "dark";
    var resolved = stored === "system"
      ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
      : stored;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolved);
    document.documentElement.style.colorScheme = resolved;
    document.documentElement.dataset.theme = stored;
  } catch (error) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable} ${bebas.variable}`}>
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
