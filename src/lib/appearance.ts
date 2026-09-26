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

