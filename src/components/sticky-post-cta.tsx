"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { setStoredValue, useStoredValue } from "@/lib/use-stored-value";
import { siteConfig } from "@/config/site";
import { TrackableAnchor } from "@/components/trackable-anchor";

export function StickyPostCta({ locale }: { locale: Locale }) {
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;
  const storageKey = `sticky_post_cta_dismissed_${locale}`;

  const [visible, setVisible] = useState(false);
  // Read during render, so the banner is already gone on the first paint
  // for someone who dismissed it earlier.
  const dismissed = useStoredValue(storageKey, (raw) => raw === "1", false);

  useEffect(() => {
    const onScroll = () => {
      if (window.innerWidth >= 768) return;
      setVisible(window.scrollY > 320);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [dismissed]);

  /**
   * Tell the page this card is on screen.
   *
   * On a phone this sits at the bottom across the full width, and the
   * back-to-top pill sat on top of it: 42x34px of overlap, 23% of the
   * "Resources" button, and elementFromPoint returned the pill -- so the pill
   * took the tap meant for the button underneath it. Two floating controls
   * fighting over the same corner of a small screen.
   *
   * A data attribute on <html> is how this codebase already passes state
   * nothing else can see -- it is what theme, text size and content width use.
   * The pill hides itself in CSS while this is set, and only on phones, where
   * the card exists at all.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (visible && !dismissed) root.dataset.stickyCta = "1";
    else delete root.dataset.stickyCta;
    return () => {
      delete root.dataset.stickyCta;
    };
  }, [visible, dismissed]);

  if (dismissed) return null;

  return (
    <div
      className={`fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 transition duration-300 md:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
      aria-hidden={!visible}
      // aria-hidden alone hides it from a screen reader while leaving its
      // buttons in the tab order, so a keyboard user could tab into a panel
      // nobody can see. pointer-events-none stops the mouse, not the keyboard.
      // inert takes the whole subtree out of focus and the accessibility tree
      // together, which is the thing that was actually meant here.
      inert={!visible}
    >
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3 shadow-lg backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            {locale === "fr" ? "Progression carrière" : "Career momentum"}
          </p>
          <button
            type="button"
            onClick={() => {
              setStoredValue(storageKey, "1");
            }}
            // Measured 30.4x16: the smallest control on the site, and the one
            // a reader presses to get a floating card out of the way.
            className="tap-target -mr-2 px-2 text-xs text-[color:var(--muted)] hover:text-[color:var(--text)]"
          >
            {locale === "fr" ? "Fermer" : "Close"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <TrackableAnchor
            href={leadMagnetHref}
            event="lead_magnet_click"
            meta={{ page: "sticky_post_cta", locale }}
            className="btn-primary flex-1 text-center text-xs"
          >
            {locale === "fr" ? "Stages ouverts" : "Open internships"}
          </TrackableAnchor>
          <Link href={`/${locale}/resources`} className="btn-secondary flex-1 text-center text-xs">
            {locale === "fr" ? "Ressources" : "Resources"}
          </Link>
        </div>
      </div>
    </div>
  );
}
