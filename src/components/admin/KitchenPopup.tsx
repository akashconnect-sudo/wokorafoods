"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function KitchenPopup({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="card-surface flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border-b-0 sm:max-h-[90vh] sm:rounded-2xl sm:border"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="min-w-0 flex-1 break-words font-display text-lg font-semibold sm:text-xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-white/10 p-2 text-brand-cream/70 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-5 sm:pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
