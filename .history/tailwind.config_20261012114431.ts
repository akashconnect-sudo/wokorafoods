import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        charcoal: "rgb(var(--charcoal) / <alpha-value>)",
        brand: {
          yellow: "#FFC800",
          "yellow-light": "#FFD84D",
          "yellow-dark": "#E0A800",
          cream: "#F5F5F0",
          black: "#0B0B0B",
          card: "#141414",
        },
      },
      fontFamily: {
        display: ["var(--font-poppins)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        wall: ["var(--font-bebas)", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(255, 200, 0, 0.40)",
        gold: "0 0 18px rgba(255, 216, 77, 0.35)",
      },
      backgroundImage: {
        "brand-glow":
          "radial-gradient(ellipse at top, rgba(255,200,0,0.14), transparent 55%), radial-gradient(ellipse at bottom right, rgba(255,216,77,0.08), transparent 45%)",
      },
    },
  },
  plugins: [],
};
export default config;