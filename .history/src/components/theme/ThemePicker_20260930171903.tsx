"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "White", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System default", icon: Monitor },
];

export function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme();
  const { status } = useSession();

  const choose = (next: ThemePreference) => {
    setPreference(next);
    if (status === "authenticated") {
      fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themePreference: next }),
      }).catch(() => undefined);
    }
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && (
        <div>
          <p className="font-display text-lg font-semibold">Appearance</p>
          <p className="mt-1 text-sm text-brand-cream/60">
            Saved to your account. Another login on this phone will not share your theme.
          </p>
        </div>
      )}
      {compact && <p className="px-1 text-xs uppercase tracking-widest text-brand-cream/50">Theme</p>}
      <div className={`grid grid-cols-3 gap-2 ${compact ? "" : "sm:max-w-md"}`}>
        {OPTIONS.map((option) => {
          const active = preference === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => choose(option.id)}
              className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border px-1.5 py-3 text-center text-[10px] font-medium leading-tight sm:text-xs ${
                active
                  ? "border-brand-red bg-brand-red/15 text-brand-gold"
                  : "border-white/10 bg-white/5 text-brand-cream/70 hover:border-white/25"
              }`}
            >
              <option.icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
