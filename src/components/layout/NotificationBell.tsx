"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, X } from "lucide-react";
import Link from "next/link";

type Note = {
  id: string;
  title: string;
  body: string;
  orderId: string | null;
  read: boolean;
  createdAt: string;
};

function readJson(url: string, method = "GET"): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.timeout = 8000;
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          resolve(null);
          return;
        }
        try {
          resolve(JSON.parse(xhr.responseText || "{}") as Record<string, unknown>);
        } catch {
          resolve(null);
        }
      };
      xhr.onerror = () => resolve(null);
      xhr.ontimeout = () => resolve(null);
      xhr.send();
    } catch {
      resolve(null);
    }
  });
}

export function NotificationBell() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const seen = useRef(new Set<string>());
  const alive = useRef(true);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    alive.current = true;

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }

    const pullNotes = () => {
      if (!alive.current || document.visibilityState === "hidden") return;
      void readJson("/api/notifications").then((data) => {
        if (!alive.current || !data) return;
        const list = (Array.isArray(data.notifications) ? data.notifications : []) as Note[];
        setNotes(list);
        setUnread(typeof data.unread === "number" ? data.unread : 0);
        list
          .filter((note) => !note.read && !seen.current.has(note.id))
          .forEach((note) => {
            seen.current.add(note.id);
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                new Notification(note.title, { body: note.body });
              } catch {
                // Ignore browser notification blocks.
              }
            }
          });
      });
    };

    const start = window.setTimeout(pullNotes, 400);
    const timer = window.setInterval(pullNotes, 15000);
    return () => {
      alive.current = false;
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [status]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (status !== "authenticated") return null;

  const openPanel = () => {
    setOpen((value) => !value);
    if (!open && unread) {
      void readJson("/api/notifications", "PATCH").then(() => setUnread(0));
    }
  };

  const panel = (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-3 sm:pb-2 sm:pt-0 sm:border-0">
        <p className="text-xs uppercase tracking-wide text-brand-cream/50">Notifications</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-white/10 p-2 text-brand-cream/70 hover:text-white sm:hidden"
          aria-label="Close notifications"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[min(70dvh,28rem)] space-y-2 overflow-y-auto overscroll-contain px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2 sm:max-h-80 sm:px-0 sm:pb-0">
        {notes.length === 0 && <p className="p-3 text-sm text-brand-cream/50">No updates yet.</p>}
        {notes.map((note) => (
          <Link
            key={note.id}
            href={note.orderId ? `/order/${note.orderId}` : "/account"}
            onClick={() => setOpen(false)}
            className={`block rounded-xl p-3 text-left text-sm hover:bg-white/10 ${
              note.read ? "bg-white/5" : "border border-brand-yellow/30 bg-brand-yellow/10"
            }`}
          >
            <p className="break-words font-semibold text-brand-cream">{note.title}</p>
            <p className="mt-1 break-words text-brand-cream/70">{note.body}</p>
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={openPanel}
        className="relative rounded-full p-2 text-brand-cream hover:text-brand-yellow"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-yellow px-1 text-[10px] font-bold text-black">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/60 sm:hidden"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[70] mx-auto max-h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] w-full overflow-hidden rounded-b-3xl border-b border-white/10 bg-ink shadow-neon xs:mx-3 xs:w-auto xs:max-w-none xs:rounded-2xl xs:border sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:z-[70] sm:mt-2 sm:max-h-none sm:w-[min(22rem,calc(100vw-1.5rem))] sm:rounded-2xl sm:border">
            {panel}
          </div>
        </>
      ) : null}
    </div>
  );
}
