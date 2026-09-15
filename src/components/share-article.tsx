"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { trackEvent } from "@/lib/track";
import type { Locale } from "@/i18n/config";

type ShareArticleProps = {
  /** Absolute URL of the article — relative links break every share target. */
  url: string;
  title: string;
  locale: Locale;
};

const COPY: Record<Locale, { label: string; copy: string; copied: string; share: string }> = {
  en: { label: "Share", copy: "Copy link", copied: "Link copied", share: "Share" },
  fr: { label: "Partager", copy: "Copier le lien", copied: "Lien copie", share: "Partager" }
};

/**
 * Sharing was the one thing a reader could not do with an article.
 *
 * For a publication whose whole constraint is distribution, that mattered more
 * than it looks: the writing had no route out of the page. WhatsApp is included
 * deliberately — for a French-speaking student audience it carries more sharing
 * than X does.
 *
 * Uses the platform share sheet where the browser has one (every modern phone),
 * and falls back to explicit targets on desktop rather than showing a button
 * that would do nothing.
 */
export function ShareArticle({ url, title, locale }: ShareArticleProps) {
  const copy = COPY[locale] ?? COPY.en;
  const [copied, setCopied] = useState(false);

  // navigator.share exists only in the browser, and only in some of them.
  // Read through useSyncExternalStore rather than syncing it into state from an
  // effect: the server snapshot is false, so the markup matches on hydration and
  // the button appears without a second render.
  const canUseSheet = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false
  );

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const targets = [
    { key: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { key: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { key: "x", label: "X", href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` }
  ];

  async function handleSheet() {
    try {
      await navigator.share({ title, url });
      trackEvent("article_share", { channel: "native", locale });
    } catch {
      // The reader dismissed the sheet. Not an error, and not worth a message.
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackEvent("article_share", { channel: "copy", locale });
    } catch {
      // Clipboard can be blocked by permissions; the explicit targets still work.
    }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-[color:var(--border)] pt-5">
      <span className="provenance mr-1">{copy.label}</span>

      {canUseSheet ? (
        <button type="button" onClick={handleSheet} className="btn-secondary px-3 py-1.5 text-xs">
          {copy.share}
        </button>
      ) : null}

      {targets.map((target) => (
        <a
          key={target.key}
          href={target.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("article_share", { channel: target.key, locale })}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          {target.label}
        </a>
      ))}

      <button type="button" onClick={handleCopy} className="btn-secondary px-3 py-1.5 text-xs">
        {copied ? copy.copied : copy.copy}
      </button>
    </div>
  );
}
