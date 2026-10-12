"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
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

  if (status !== "authenticated") return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open && unread) {
            void readJson("/api/notifications", "PATCH").then(() => setUnread(0));
          }
        }}
        className="relative rounded-full p-2 text-brand-cream hover:text-brand-red"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-red px-1 text-[10px] font-bold">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.25rem))] rounded-2xl border border-white/10 bg-ink p-3 shadow-neon">
          <p className="px-1 pb-2 text-xs uppercase tracking-wide text-brand-cream/50">Notifications</p>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {notes.length === 0 && <p className="p-3 text-sm text-brand-cream/50">No updates yet.</p>}
            {notes.map((note) => (
              <Link
                key={note.id}
                href={note.orderId ? `/order/${note.orderId}` : "/account"}
                onClick={() => setOpen(false)}
                className="block rounded-xl bg-white/5 p-3 text-left text-sm hover:bg-white/10"
              >
                <p className="font-semibold text-brand-cream">{note.title}</p>
                <p className="mt-1 text-brand-cream/70">{note.body}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
