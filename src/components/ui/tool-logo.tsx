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
 * Why this renders a wrapper instead of a bare image.
 *
 * These logos are third-party favicons, and favicons carry their own
 * background baked into the pixels. Measured across the fifteen the site uses:
 * seven arrive on an opaque white plate, six are transparent, and
 * antigravity.ai is an opaque near-black tile, rgba(17,17,17,255) in every
 * corner.
 *
 * Two consequences, and the second is the reason for the extra element.
 *
 * On a themed surface the row broke in both directions -- white plates
 * punching squares out of dark cards. Hence the constant white plate on the
 * tile: a logo plate that stays white on a dark page reads as deliberate.
 *
 * That still left the black-plated one as a hard-cornered square sitting
 * inside a rounded white tile. border-radius on the image cannot fix it while
 * the image carries padding: the radius follows the border box, and padding
 * insets the content away from that curve, so the corners stay square. Putting
 * the padding on a wrapper and leaving the image itself unpadded lets the
 * image's own radius clip the plate it ships with.
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
    <span className={`inline-flex items-center justify-center ${className ?? ""}`}>
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
        // object-contain so a non-square favicon is letterboxed rather than
        // stretched: Google returns 55x56 for Anki and 96x97 for Quizlet.
        className="h-full w-full rounded-md object-contain"
      />
    </span>
  );
}

