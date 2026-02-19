"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { siteConfig } from "@/config/site";

export function ScrollCaptureCta({ locale }: { locale: Locale }) {
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("scroll_capture_dismissed") === "1";
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    const onScroll = () => {
      if (window.innerWidth < 768) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const depth = window.scrollY / max;
      setVisible(depth > 0.4);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-5 z-40 mx-auto hidden w-full max-w-lg px-4 transition duration-300 md:block ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">
          {locale === "fr" ? "Roadmap gratuite" : "Free roadmap"}
        </p>
        <p className="mt-1 text-sm text-[color:var(--text)]">
          {locale === "fr"
            ? "Reçois le plan 30 jours pour transformer ce contenu en résultats carrière."
            : "Get the 30-day plan to turn this content into internship outcomes."}
        </p>
        <div className="mt-3 flex gap-2">
          <a href={leadMagnetHref} className="btn-primary flex-1 text-center text-xs">
            {locale === "fr" ? "Recevoir la roadmap" : "Get roadmap"}
          </a>
          <Link href={`/${locale}/resources`} className="btn-secondary flex-1 text-center text-xs">
            {locale === "fr" ? "Voir outils" : "See tools"}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("scroll_capture_dismissed", "1");
            setDismissed(true);
          }}
          className="mt-2 text-xs text-[color:var(--muted)] underline"
        >
          {locale === "fr" ? "Fermer" : "Dismiss"}
        </button>
      </div>
    </div>
  );
}
