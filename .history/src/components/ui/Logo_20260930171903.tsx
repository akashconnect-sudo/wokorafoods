import Link from "next/link";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const mark = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-8 w-8" : "h-8 w-8 sm:h-10 sm:w-10";
  const word = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-lg sm:text-xl";

  return (
    <Link href="/" className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
      <svg viewBox="0 0 64 64" className={`${mark} shrink-0`} aria-hidden>
        <ellipse cx="32" cy="44" rx="22" ry="8" fill="#E8272C" />
        <path
          d="M12 42c0-8 9-14 20-14s20 6 20 14"
          fill="#C71F24"
        />
        <path d="M18 42h28c0 6-6 10-14 10s-14-4-14-10z" fill="#E8272C" />
        <path d="M24 18c0 6-2 9-2 12" stroke="#F5F5F0" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M32 16c0 7-1 10-1 14" stroke="#F5F5F0" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M40 18c1 6 2 9 2 12" stroke="#F5F5F0" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M10 20l18 16" stroke="#F5A623" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M14 16l18 16" stroke="#F5A623" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className={`min-w-0 truncate font-display font-extrabold tracking-tight ${word}`}>
        <span className="text-brand-cream">Wokora</span>
        <span className="text-brand-red"> Foods</span>
      </span>
    </Link>
  );
}
