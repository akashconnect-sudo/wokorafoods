"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { ThemePreference } from "@/lib/theme";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: "dark";
  setPreference: (next: ThemePreference) => void;
};

// Hamesha dark. Saved "light" / "system" (localStorage ya DB) ignore hota hai.
const ThemeContext = createContext<ThemeContextValue>({
  preference: "dark" as ThemePreference,
  resolved: "dark",
  setPreference: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    root.dataset.theme = "dark";
    root.style.colorScheme = "dark";
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        preference: "dark" as ThemePreference,
        resolved: "dark",
        setPreference: () => undefined,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}