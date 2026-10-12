"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { UserSpaceSync } from "@/components/providers/UserSpaceSync";
import { SiteGuard } from "@/components/security/SiteGuard";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const festive = localStorage.getItem("wokora-festive") === "1";
    document.documentElement.classList.toggle("festive", festive);

    const isNetworkBlip = (value: unknown) => {
      const message = value instanceof Error ? value.message : String(value || "");
      return /failed to fetch|load failed|networkerror|fetch/i.test(message);
    };

    const onReject = (event: PromiseRejectionEvent) => {
      if (!isNetworkBlip(event.reason)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const onError = (event: ErrorEvent) => {
      if (!isNetworkBlip(event.error || event.message)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    window.addEventListener("unhandledrejection", onReject, true);
    window.addEventListener("error", onError, true);
    return () => {
      window.removeEventListener("unhandledrejection", onReject, true);
      window.removeEventListener("error", onError, true);
    };
  }, []);

  return (
    <SessionProvider>
      <ThemeProvider>
        <UserSpaceSync />
        <SiteGuard />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
