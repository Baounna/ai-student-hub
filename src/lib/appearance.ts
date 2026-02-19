export type Theme = "dark" | "light";
export type ThemePreference = Theme | "auto";
export type TextSize = "small" | "medium" | "large";
export type ContentWidth = "standard" | "wide";
export type AppearancePanelState = "visible" | "hidden";

export const appearanceStorageKeys = {
  theme: "theme",
  themePreference: "appearance_theme_preference",
  textSize: "appearance_text_size",
  contentWidth: "appearance_content_width",
  appearancePanel: "appearance_panel"
} as const;

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(appearanceStorageKeys.theme, theme);
  localStorage.setItem(appearanceStorageKeys.themePreference, theme);
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") return;
  const resolved = preference === "auto" ? getSystemTheme() : preference;
  document.documentElement.setAttribute("data-theme", resolved);
  localStorage.setItem(appearanceStorageKeys.theme, resolved);
  localStorage.setItem(appearanceStorageKeys.themePreference, preference);
}

export function applyTextSize(size: TextSize) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-text-size", size);
  localStorage.setItem(appearanceStorageKeys.textSize, size);
}

export function applyContentWidth(width: ContentWidth) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-content-width", width);
  localStorage.setItem(appearanceStorageKeys.contentWidth, width);
}

export function applyAppearancePanel(state: AppearancePanelState) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-appearance-panel", state);
  localStorage.setItem(appearanceStorageKeys.appearancePanel, state);
}
