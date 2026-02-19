"use client";

import { useEffect, useState } from "react";
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

type AppearancePanelProps = {
  locale: Locale;
};

function optionButtonClass(active: boolean) {
  return `rounded-full border px-3 py-1 text-xs font-medium ${
    active
      ? "border-[color:var(--primary)] bg-[color:var(--bg-soft)]/65 text-[color:var(--text-strong)]"
      : "border-[color:var(--border)] text-[color:var(--text)] hover:border-[color:var(--primary)]/40"
  }`;
}

export function AppearancePanel({ locale }: AppearancePanelProps) {
  const [mounted, setMounted] = useState(false);
  const [panelState, setPanelState] = useState<AppearancePanelState>("visible");
  const [theme, setTheme] = useState<ThemePreference>("auto");
  const [textSize, setTextSize] = useState<TextSize>("medium");
  const [contentWidth, setContentWidth] = useState<ContentWidth>("standard");

  useEffect(() => {
    const storedThemePref = localStorage.getItem(appearanceStorageKeys.themePreference);
    const storedTheme = localStorage.getItem(appearanceStorageKeys.theme);
    const storedTextSize = localStorage.getItem(appearanceStorageKeys.textSize);
    const storedWidth = localStorage.getItem(appearanceStorageKeys.contentWidth);
    const storedPanelState = localStorage.getItem(appearanceStorageKeys.appearancePanel);

    const nextTheme: ThemePreference =
      storedThemePref === "auto" || storedThemePref === "light" || storedThemePref === "dark"
        ? storedThemePref
        : storedTheme === "light"
          ? "light"
          : "dark";
    const nextTextSize: TextSize =
      storedTextSize === "small" || storedTextSize === "large" ? storedTextSize : "medium";
    const nextWidth: ContentWidth = storedWidth === "wide" ? "wide" : "standard";
    const nextPanelState: AppearancePanelState = storedPanelState === "hidden" ? "hidden" : "visible";

    setPanelState(nextPanelState);
    setTheme(nextTheme);
    setTextSize(nextTextSize);
    setContentWidth(nextWidth);

    applyAppearancePanel(nextPanelState);
    applyThemePreference(nextTheme);
    applyTextSize(nextTextSize);
    applyContentWidth(nextWidth);
    setMounted(true);
  }, []);

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
          setPanelState("visible");
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
            setPanelState("hidden");
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
                onClick={() => {
                  setTextSize(size);
                  applyTextSize(size);
                }}
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
                onClick={() => {
                  setContentWidth(width);
                  applyContentWidth(width);
                }}
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
                onClick={() => {
                  setTheme(mode);
                  applyThemePreference(mode);
                }}
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
