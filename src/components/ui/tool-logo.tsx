"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type ToolLogoProps = {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK = "/images/tool-cloud.svg";

/**
 * A note for whoever styles the tile around this.
 *
 * These logos are third-party favicons, and favicons ship with their own
 * background baked into the pixels: six of the fifteen carry an opaque white
 * plate and two an opaque black one. Put them on a themed surface and the row
 * breaks in both directions -- white squares punching out of dark cards, black
 * squares out of light ones, corners overhanging the rounded tile.
 *
 * So both call sites give the tile a constant white plate rather than
 * var(--surface). A logo plate that stays white on a dark page reads as
 * deliberate; a grid of mismatched squares does not.
 */

function normalizeSrc(value: string) {
  const src = value.trim();
  if (!src) return DEFAULT_FALLBACK;
  return src;
}

export function ToolLogo({ src, alt, size = 40, className, fallbackSrc = DEFAULT_FALLBACK }: ToolLogoProps) {
  const safeFallback = useMemo(() => normalizeSrc(fallbackSrc), [fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState(() => normalizeSrc(src));

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => {
        if (currentSrc !== safeFallback) {
          setCurrentSrc(safeFallback);
        }
      }}
      className={className}
    />
  );
}

