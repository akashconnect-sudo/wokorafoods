"use client";

import { BRAND, googleMapsLink } from "@/lib/constants";

export function CafeMap({
  address,
  mapSrc,
  className = "",
}: {
  address: string;
  mapSrc: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-[#1a1a1a] ${className}`}>
      <iframe
        key={mapSrc}
        title={`${BRAND.name} map`}
        src={mapSrc}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <a
        href={googleMapsLink(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 rounded-full bg-black/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-red"
      >
        Open in Maps
      </a>
    </div>
  );
}
