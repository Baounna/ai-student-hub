"use client";

import { useEffect } from "react";
import {
  applyAppearancePanel,
  applyContentWidth,
  applyTextSize,
  applyThemePreference,
  type AppearancePanelState,
  appearanceStorageKeys,
  type ContentWidth,
  type TextSize,
  type ThemePreference
} from "@/lib/appearance";
import type { Locale } from "@/i18n/config";
import { useHasMounted, useStoredValue } from "@/lib/use-stored-value";

type AppearancePanelProps = {
  locale: Locale;
};

// Selected state is a border and a background tint, which a screen reader
// cannot see and a reader who cannot distinguish the two colours cannot either.
// The buttons below carry aria-pressed so the state is in the accessible name.
function optionButtonClass(active: boolean) {
  return `rounded-full border px-3 py-1 text-xs font-medium ${
    active
      ? "border-[color:var(--primary)] bg-[color:var(--bg-soft)]/65 text-[color:var(--text-strong)]"
      : "border-[color:var(--border)] text-[color:var(--text)] hover:border-[color:var(--primary)]/40"
  }`;
}

export function AppearancePanel({ locale }: AppearancePanelProps) {
  const mounted = useHasMounted();
  // Storage owns these; reading them during render keeps this panel and the
  // header settings in step without either copying the other's value.
  const panelState = useStoredValue<AppearancePanelState>(
    appearanceStorageKeys.appearancePanel,
    (raw) => (raw === "hidden" ? "hidden" : "visible"),
    "visible"
  );
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
  const contentWidth = useStoredValue<ContentWidth>(
    appearanceStorageKeys.contentWidth,
    (raw) => (raw === "wide" ? "wide" : "standard"),
    "standard"
  );

  // The pre-hydration script in layout.tsx already applies theme, text size and
  // width from storage. Only the panel's own visibility is not covered there.
  useEffect(() => {
    applyAppearancePanel(panelState);
  }, [panelState]);

  const copy = {
    title: locale === "fr" ? "Apparence" : "Appearance",
    hide: locale === "fr" ? "masquer" : "hide",
    show: locale === "fr" ? "afficher" : "show",
    text: locale === "fr" ? "Texte" : "Text",
    width: locale === "fr" ? "Largeur" : "Width",
    color: locale === "fr" ? "Couleur" : "Color",
    auto: locale === "fr" ? "Auto" : "Auto",
    small: locale === "fr" ? "Petit" : "Small",
    medium: locale === "fr" ? "Standard" : "Standard",
    large: locale === "fr" ? "Grand" : "Large",
    standard: locale === "fr" ? "Standard" : "Standard",
    wide: locale === "fr" ? "Large" : "Wide",
    dark: locale === "fr" ? "Sombre" : "Dark",
    light: locale === "fr" ? "Clair" : "Light"
  };

  if (!mounted) return null;

  if (panelState === "hidden") {
    return (
      <button
        type="button"
        onClick={() => {
          applyAppearancePanel("visible");
        }}
        className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-xs font-semibold text-[color:var(--text)] shadow-lg backdrop-blur-xl"
      >
        {copy.title}
        <span className="rounded bg-[color:var(--surface)] px-2 py-0.5 text-[10px] text-[color:var(--muted)]">{copy.show}</span>
      </button>
    );
  }

  return (
    <aside className="max-h-[calc(100vh-11rem)] w-56 overflow-y-auto rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)]/95 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between border-b border-[color:var(--border)] pb-2">
        <p className="font-display text-base font-semibold text-[color:var(--text-strong)]">{copy.title}</p>
        <button
          type="button"
          onClick={() => {
            applyAppearancePanel("hidden");
          }}
          className="rounded bg-[color:var(--surface)] px-2 py-0.5 text-[10px] text-[color:var(--muted)] hover:text-[color:var(--text)]"
        >
          {copy.hide}
        </button>
      </div>

      <div className="space-y-5 text-sm">
        <section>
          <p className="mb-2 text-[color:var(--muted)]">{copy.text}</p>
          <div className="flex flex-wrap gap-2">
            {(["small", "medium", "large"] as const).map((size) => (
              <button
                key={size}
                type="button"
                disabled={!mounted}
                aria-pressed={textSize === size}
                onClick={() => applyTextSize(size)}
                className={optionButtonClass(textSize === size)}
              >
                {size === "small" ? copy.small : size === "medium" ? copy.medium : copy.large}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-[color:var(--muted)]">{copy.width}</p>
          <div className="flex flex-wrap gap-2">
            {(["standard", "wide"] as const).map((width) => (
              <button
                key={width}
                type="button"
                disabled={!mounted}
                aria-pressed={contentWidth === width}
                onClick={() => applyContentWidth(width)}
                className={optionButtonClass(contentWidth === width)}
              >
                {width === "standard" ? copy.standard : copy.wide}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 text-[color:var(--muted)]">{copy.color}</p>
          <div className="flex flex-wrap gap-2">
            {(["auto", "light", "dark"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={!mounted}
                aria-pressed={theme === mode}
                onClick={() => applyThemePreference(mode)}
                className={optionButtonClass(theme === mode)}
              >
                {mode === "auto" ? copy.auto : mode === "dark" ? copy.dark : copy.light}
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
