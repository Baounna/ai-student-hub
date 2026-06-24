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

