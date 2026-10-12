"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  applyTheme,
  readStoredTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("dark");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    const stored = readStoredTheme();
    setPreferenceState(stored);
    setResolved(applyTheme(stored));

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const current = readStoredTheme();
      if (current === "system") setResolved(applyTheme("system"));
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    setResolved(applyTheme(next));
  };

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
