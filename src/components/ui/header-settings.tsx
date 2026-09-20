"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { useStoredValue } from "@/lib/use-stored-value";
import {
  applyContentWidth,
  applyTextSize,
  applyThemePreference,
  appearanceStorageKeys,
  type ContentWidth,
  type TextSize,
  type ThemePreference
} from "@/lib/appearance";

type HeaderSettingsProps = {
  locale: Locale;
  compact?: boolean;
};

function optionClass(active: boolean) {
  return active
    ? "rounded-full border border-[color:var(--primary)] bg-[color:var(--bg-soft)]/60 px-3 py-1 text-xs font-semibold text-[color:var(--text-strong)]"
    : "rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-medium text-[color:var(--text)] hover:border-[color:var(--primary)]/40";
}

function withLocale(pathname: string, targetLocale: Locale) {
  const clean = pathname.replace(/\/+$/, "");
  const parts = clean.split("/").filter(Boolean);
  if (!parts.length) return `/${targetLocale}`;
  if (parts[0] === "en" || parts[0] === "fr") {
    parts[0] = targetLocale;
    return `/${parts.join("/")}`;
  }
  return `/${targetLocale}/${parts.join("/")}`;
}

export function HeaderSettings({ locale, compact = false }: HeaderSettingsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  // Read straight from storage instead of copying it into state on mount:
  // one render instead of two, and the panel follows changes made anywhere
  // else — including another tab.
  const theme = useStoredValue<ThemePreference>(
    appearanceStorageKeys.themePreference,
    (raw) => (raw === "auto" || raw === "light" || raw === "dark" ? raw : "auto"),
    "auto"
  );
  const textSize = useStoredValue<TextSize>(
    appearanceStorageKeys.textSize,
    (raw) => (raw === "small" || raw === "large" ? raw : "medium"),
    "medium"
  );
  const width = useStoredValue<ContentWidth>(
    appearanceStorageKeys.contentWidth,
    (raw) => (raw === "wide" ? "wide" : "standard"),
    "standard"
  );

  const t = {
    title: locale === "fr" ? "Paramètres" : "Settings",
    theme: locale === "fr" ? "Thème" : "Theme",
    text: locale === "fr" ? "Texte" : "Text",
    width: locale === "fr" ? "Largeur" : "Width",
    language: locale === "fr" ? "Langue" : "Language",
    auto: locale === "fr" ? "Auto" : "Auto",
    dark: locale === "fr" ? "Sombre" : "Dark",
    light: locale === "fr" ? "Clair" : "Light",
    small: locale === "fr" ? "Petit" : "Small",
    standard: locale === "fr" ? "Standard" : "Standard",
    large: locale === "fr" ? "Grand" : "Large",
    wide: locale === "fr" ? "Large" : "Wide"
  };

  useEffect(() => {
    function onDown(event: PointerEvent) {
      if (!open) return;
      const node = rootRef.current;
      if (!node) return;
      if (event.target instanceof Node && !node.contains(event.target)) setOpen(false);
    }

    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const pathnameValue = pathname || `/${locale}`;
  const query = searchParams?.toString();
  const enHref = `${withLocale(pathnameValue, "en")}${query ? `?${query}` : ""}`;
  const frHref = `${withLocale(pathnameValue, "fr")}${query ? `?${query}` : ""}`;

  const triggerClass = useMemo(() => {
    if (compact) {
      return "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]/78 p-0 text-[color:var(--text)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--surface),#ffffff_22%)]";
    }
    return "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]/78 p-0 text-[color:var(--text)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--surface),#ffffff_22%)]";
  }, [compact]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.title}
        title={t.title}
        className={`${triggerClass} ${
          open
            ? "border-[color:var(--primary)] bg-[color:var(--bg-soft)]/65 text-[color:var(--text-strong)]"
            : "hover:border-[color:var(--primary)]/40 hover:text-[color:var(--text-strong)]"
        }`}
      >
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`${compact ? "h-[0.9rem] w-[0.9rem]" : "h-[1rem] w-[1rem]"} text-current`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="10" cy="10" r="2.4" />
          <path d="M10 2.2v1.6M10 16.2v1.6M17.8 10h-1.6M3.8 10H2.2M15.5 4.5l-1.1 1.1M5.6 14.4l-1.1 1.1M15.5 15.5l-1.1-1.1M5.6 5.6L4.5 4.5" />
        </svg>
        <span className="sr-only">{t.title}</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-1rem))] rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 shadow-[0_24px_56px_-36px_rgba(5,14,32,0.92)] backdrop-blur-xl">
          <div className="space-y-4">
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">{t.theme}</p>
              <div className="flex flex-wrap gap-2">
                {(["auto", "dark", "light"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={optionClass(theme === mode)}
                    onClick={() => applyThemePreference(mode)}
                  >
                    {mode === "auto" ? t.auto : mode === "dark" ? t.dark : t.light}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">{t.text}</p>
              <div className="flex flex-wrap gap-2">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={optionClass(textSize === size)}
                    onClick={() => applyTextSize(size)}
                  >
                    {size === "small" ? t.small : size === "medium" ? t.standard : t.large}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">{t.width}</p>
              <div className="flex flex-wrap gap-2">
                {(["standard", "wide"] as const).map((currentWidth) => (
                  <button
                    key={currentWidth}
                    type="button"
                    className={optionClass(width === currentWidth)}
                    onClick={() => applyContentWidth(currentWidth)}
                  >
                    {currentWidth === "standard" ? t.standard : t.wide}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">{t.language}</p>
              <div className="flex flex-wrap gap-2">
                <Link href={enHref} className={optionClass(locale === "en")}>
                  EN
                </Link>
                <Link href={frHref} className={optionClass(locale === "fr")}>
                  FR
                </Link>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
