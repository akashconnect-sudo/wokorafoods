"use client";

import { useEffect, useState } from "react";

type ToastEvent = { message: string };

export function toast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastEvent>("wokora-toast", { detail: { message } }));
}

export function ToastHost() {
  const [message, setMessage] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    let hideTimer = 0;
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastEvent>).detail;
      setMessage(detail.message);
      setShow(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setShow(false), 1800);
    };
    window.addEventListener("wokora-toast", onToast);
    return () => {
      window.removeEventListener("wokora-toast", onToast);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(8.5rem+env(safe-area-inset-bottom,0px))] z-[90] flex justify-center px-4 md:bottom-8">
      <p className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        {message}
      </p>
    </div>
  );
}
