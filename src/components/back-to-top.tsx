"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";

// Label and aria-label were hardcoded English on every French article, brief
// and comparison page.
export function BackToTop({ locale = "en" }: { locale?: Locale }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 650);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={locale === "fr" ? "Haut de page" : "Back to top"}
      // The hidden state was pointer-events-none and opacity-0 and nothing
      // else, which hides a control from a mouse and from eyes and from
      // nobody else. So on every article, brief and comparison page there was
      // a tab stop and a screen-reader button called "Back to top" sitting at
      // the top of the document, where pressing it does nothing a reader can
      // perceive -- a control that is invisible and still operable. The three
      // other floating panels on this site (sticky-post-cta,
      // scroll-capture-cta, sticky-tools-cta) each carry inert for exactly
      // this, with the reason written on them; this one was the omission.
      // inert takes it out of the focus order and the accessibility tree
      // together, and aria-hidden is kept alongside it for the browsers whose
      // inert support is newer than their aria support.
      inert={!visible}
      aria-hidden={!visible}
      className={`back-to-top fixed right-4 z-40 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-xs font-semibold text-[color:var(--text)] shadow-lg backdrop-blur-xl transition md:right-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      } bottom-24 md:bottom-8`}
    >
      ↑ {locale === "fr" ? "Haut" : "Top"}
    </button>
  );
}
