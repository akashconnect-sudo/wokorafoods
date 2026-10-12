import Image from "next/image";
import Link from "next/link";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const height =
    size === "lg" ? "h-16 sm:h-20" : size === "sm" ? "h-8" : "h-9 sm:h-11";

  return (
    <Link href="/" className="flex min-w-0 items-center" aria-label="Wokora Food">
      <Image
        src="/images/brand/wokora-logo.webp"
        alt="Wokora Food"
        width={1509}
        height={574}
        priority
        className={`${height} w-auto shrink-0 object-contain`}
      />
    </Link>
  );
}