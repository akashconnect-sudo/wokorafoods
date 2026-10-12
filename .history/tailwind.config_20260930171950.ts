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
          red: "#E8272C",
          gold: "#F5A623",
          cream: "rgb(var(--cream) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-poppins)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        wall: ["var(--font-bebas)", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(232, 39, 44, 0.45)",
        gold: "0 0 18px rgba(245, 166, 35, 0.35)",
      },
      backgroundImage: {
        "brand-glow":
          "radial-gradient(ellipse at top, rgba(232,39,44,0.22), transparent 55%), radial-gradient(ellipse at bottom right, rgba(245,166,35,0.12), transparent 45%)",
      },
    },
  },
  plugins: [],
};
export default config;
