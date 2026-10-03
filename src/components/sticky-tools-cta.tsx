"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { setStoredValue, useStoredValue } from "@/lib/use-stored-value";
import { siteConfig } from "@/config/site";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { canSellProduct, getProductCheckoutUrl } from "@/lib/product";
import { getGuideCtaHref } from "@/lib/product";

type StickyToolsCtaProps = {
  locale: Locale;
  source: "tools_index" | "tools_detail";
};

export function StickyToolsCta({ locale, source }: StickyToolsCtaProps) {
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;
  const checkoutUrl = getProductCheckoutUrl();
  const hasCheckout = canSellProduct();

  const storageKey = `sticky_tools_cta_dismissed_${source}_${locale}`;
  const [showMobile, setShowMobile] = useState(false);
  // Read during render, so the banner is already gone on the first paint
  // for someone who dismissed it earlier.
  const dismissedMobile = useStoredValue(storageKey, (raw) => raw === "1", false);

  useEffect(() => {
    if (dismissedMobile) return;

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
  }, [dismissedMobile]);

  /**
   * Publish the same state the article CTA publishes.
   *
   * globals.css carries a documented rule -- "one floating control at a time on
   * a phone" -- that stands the back-to-top pill down while a sticky card is on
   * screen. The article card sets data-sticky-cta and the rule works there.
   * This card never set it, so on every comparison guide both floated at once
   * and overlapped by 42x33px. Lowering this card's z-index stopped it
   * swallowing the pill's taps; it did not stop them sharing the corner. Now
   * the rule applies here too, which is what it was written for.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (showMobile && !dismissedMobile) root.dataset.stickyCta = "1";
    else delete root.dataset.stickyCta;
    return () => {
      delete root.dataset.stickyCta;
    };
  }, [showMobile, dismissedMobile]);

  return (
    <>
      {!dismissedMobile ? (
        <div
          // z-30, matching sticky-post-cta. At z-40 this sat at the same
          // stacking level as the back-to-top button and later in the DOM, so
          // it covered 100% of it on every comparison guide at every phone
          // width -- elementsFromPoint on the button returned this card's
          // "Guide" link instead. The article variant was already z-30, which
          // is why /blog/[slug] never showed the fault.
          className={`fixed inset-x-4 bottom-[calc(4.8rem+env(safe-area-inset-bottom))] z-30 transition duration-300 md:hidden ${
            showMobile ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
          }`}
          aria-hidden={!showMobile}
          inert={!showMobile}
        >
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3 shadow-lg backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                {locale === "fr" ? "Outils → action" : "Tools -> action"}
              </p>
              <button
                type="button"
                onClick={() => {
                  const storageKey = `sticky_tools_cta_dismissed_${source}_${locale}`;
                  setStoredValue(storageKey, "1");
                }}
                // Measured 30.4x16: the smallest control on the site, and the one
                // a reader presses to get a floating card out of the way.
                className="tap-target -mr-2 px-2 text-xs text-[color:var(--muted)] hover:text-[color:var(--text)]"
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
                {locale === "fr" ? "Stages" : "Internships"}
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
                <Link href={getGuideCtaHref(locale)} className="btn-secondary text-center text-xs">
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
