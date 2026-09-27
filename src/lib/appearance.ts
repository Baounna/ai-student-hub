export type Theme = "dark" | "light";
export type ThemePreference = Theme | "auto";
export type TextSize = "small" | "medium" | "large";
export type ContentWidth = "standard" | "wide";

export const appearanceStorageKeys = {
  theme: "theme",
  themePreference: "appearance_theme_preference",
  textSize: "appearance_text_size",
  contentWidth: "appearance_content_width",
  appearancePanel: "appearance_panel"
} as const;

/**
 * The `storage` event only fires in *other* tabs, so a same-tab write is
 * invisible to anything reading through useSyncExternalStore. Every setter
 * below announces its change so subscribers in this tab re-render too.
 */
export const APPEARANCE_CHANGE_EVENT = "appearance:change";

function announce() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(APPEARANCE_CHANGE_EVENT));
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}


/**
 * Re-apply the reader's stored appearance to the document.
 *
 * The root layout runs this as a beforeInteractive script so the right theme is
 * on <html> before the first paint. On a 404 that script never runs. Next
 * delivers a not-found as an error fallback -- the response digest is literally
 * NEXT_HTTP_ERROR_FALLBACK;404 -- and serves its own minimal
 * `<html id="__next_error__">` document, so our <html>, our <head> and that
 * script exist only as data inside the RSC payload. React rebuilds the tree on
 * the client from the JSX, including the literal data-theme="light", and nothing
 * ever corrects it: a reader who chose dark got a full-white 404 page.
 *
 * So the same resolution runs again from a mounted component, which happens on
 * every response because every response hydrates. On a normal page the
 * attributes already hold these values and this changes nothing.
 *
 * Read-only on purpose: it writes no storage key and announces no change,
 * because nothing about the reader's preference has changed.
 */
export function applyStoredAppearance() {
  if (typeof document === "undefined") return;

  try {
    const storedPreference = localStorage.getItem(appearanceStorageKeys.themePreference);
    const storedTheme = localStorage.getItem(appearanceStorageKeys.theme);
    // The same order of precedence as the inline script in src/app/layout.tsx.
    const theme: Theme =
      storedPreference === "auto"
        ? getSystemTheme()
        : storedPreference === "light" || storedPreference === "dark"
          ? storedPreference
          : storedTheme === "dark"
            ? "dark"
            : "light";

    const storedTextSize = localStorage.getItem(appearanceStorageKeys.textSize);
    const textSize: TextSize =
      storedTextSize === "small" || storedTextSize === "large" ? storedTextSize : "medium";

    const storedWidth = localStorage.getItem(appearanceStorageKeys.contentWidth);
    const contentWidth: ContentWidth = storedWidth === "wide" ? "wide" : "standard";

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-text-size", textSize);
    document.documentElement.setAttribute("data-content-width", contentWidth);
  } catch {
    // Storage can throw outright in a private window. The markup's own defaults
    // are already correct in that case, so there is nothing to put right.
  }
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") return;
  const resolved = preference === "auto" ? getSystemTheme() : preference;
  document.documentElement.setAttribute("data-theme", resolved);
  localStorage.setItem(appearanceStorageKeys.theme, resolved);
  localStorage.setItem(appearanceStorageKeys.themePreference, preference);
  announce();
}

export function applyTextSize(size: TextSize) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-text-size", size);
  localStorage.setItem(appearanceStorageKeys.textSize, size);
  announce();
}

export function applyContentWidth(width: ContentWidth) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-content-width", width);
  localStorage.setItem(appearanceStorageKeys.contentWidth, width);
  announce();
}

