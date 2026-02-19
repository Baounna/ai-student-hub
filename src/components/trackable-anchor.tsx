"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/lib/track";
import type { TrackEventName, TrackMeta } from "@/lib/tracking-schema";

type TrackableAnchorProps = {
  href: string;
  event: TrackEventName;
  className?: string;
  target?: string;
  rel?: string;
  meta?: TrackMeta;
  children: ReactNode;
};

export function TrackableAnchor({ href, event, className, target, rel, meta, children }: TrackableAnchorProps) {
  const relTokens = new Set((rel || "").split(/\s+/).filter(Boolean));
  if (event === "affiliate_click") {
    relTokens.add("noopener");
    relTokens.add("noreferrer");
    relTokens.add("sponsored");
  }
  const resolvedRel = relTokens.size ? Array.from(relTokens).join(" ") : undefined;

  return (
    <a
      href={href}
      target={target}
      rel={resolvedRel}
      className={className}
      onClick={() => trackEvent(event, { href, ...(meta || {}) })}
    >
      {children}
    </a>
  );
}
