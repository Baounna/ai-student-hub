"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { siteConfig } from "@/config/site";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { isSafeHttpUrl, normalizeHttpUrl } from "@/lib/url";

type StickyToolsCtaProps = {
  locale: Locale;
  source: "tools_index" | "tools_detail";
};

export function StickyToolsCta({ locale, source }: StickyToolsCtaProps) {
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;
  const checkoutUrlRaw = (process.env.NEXT_PUBLIC_PRODUCT_CHECKOUT_URL || "").trim();
  const checkoutUrl = isSafeHttpUrl(checkoutUrlRaw) ? normalizeHttpUrl(checkoutUrlRaw) : "";
  const hasCheckout = Boolean(checkoutUrl);

  const [showMobile, setShowMobile] = useState(false);
  const [dismissedMobile, setDismissedMobile] = useState(false);

  useEffect(() => {
    const storageKey = `sticky_tools_cta_dismissed_${source}_${locale}`;
    const dismissed = localStorage.getItem(storageKey) === "1";
    if (dismissed) {
      setDismissedMobile(true);
      return;
    }

    const onScroll = () => {
      if (window.innerWidth >= 768) return;
      setShowMobile(window.scrollY > 320);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [locale, source]);

  return (
    <>
      {!dismissedMobile ? (
        <div
          className={`fixed inset-x-4 bottom-[calc(4.8rem+env(safe-area-inset-bottom))] z-40 transition duration-300 md:hidden ${
            showMobile ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
          }`}
          aria-hidden={!showMobile}
        >
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3 shadow-lg backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                {locale === "fr" ? "Outils -> action" : "Tools -> action"}
              </p>
              <button
                type="button"
                onClick={() => {
                  const storageKey = `sticky_tools_cta_dismissed_${source}_${locale}`;
                  localStorage.setItem(storageKey, "1");
                  setDismissedMobile(true);
                }}
                className="text-xs text-[color:var(--muted)] hover:text-[color:var(--text)]"
              >
                {locale === "fr" ? "Fermer" : "Close"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TrackableAnchor
                href={leadMagnetHref}
                event="lead_magnet_click"
                meta={{ page: source, locale, slot: "mobile_sticky" }}
                className="btn-primary text-center text-xs"
              >
                {locale === "fr" ? "Roadmap" : "Roadmap"}
              </TrackableAnchor>
              {hasCheckout ? (
                <TrackableAnchor
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  event="product_checkout_click"
                  meta={{ page: source, locale, slot: "mobile_sticky" }}
                  className="btn-secondary text-center text-xs"
                >
                  {locale === "fr" ? "Guide" : "Guide"}
                </TrackableAnchor>
              ) : (
                <Link href={`/${locale}/product/ai-career-guide`} className="btn-secondary text-center text-xs">
                  {locale === "fr" ? "Guide" : "Guide"}
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
