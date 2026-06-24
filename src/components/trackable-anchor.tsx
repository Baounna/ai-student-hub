"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/lib/track";
import type { TrackEventName, TrackMeta } from "@/lib/tracking-schema";
import { isSafeHttpUrl } from "@/lib/url";

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
  const isInternalHref = href.startsWith("/") && !href.startsWith("//");
  const isSafeExternalHref = isSafeHttpUrl(href);
  const canNavigate = isInternalHref || isSafeExternalHref;
  const resolvedHref = canNavigate ? href : "#";

  const relTokens = new Set((rel || "").split(/\s+/).filter(Boolean));
  if (target === "_blank") {
    relTokens.add("noopener");
    relTokens.add("noreferrer");
  }
  if (event === "affiliate_click") {
    relTokens.add("noopener");
    relTokens.add("noreferrer");
    relTokens.add("sponsored");
  }
  const resolvedRel = relTokens.size ? Array.from(relTokens).join(" ") : undefined;

  return (
    <a
      href={resolvedHref}
      target={target}
      rel={resolvedRel}
      className={className}
      onClick={(eventObject) => {
        if (!canNavigate) {
          eventObject.preventDefault();
          return;
        }
        trackEvent(event, { href, ...(meta || {}) });
      }}
      aria-disabled={!canNavigate}
    >
      {children}
    </a>
  );
}
