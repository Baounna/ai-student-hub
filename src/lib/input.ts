const CONTROL_CHAR_REGEX = /[\u0000-\u001f\u007f]/g;
const MULTISPACE_REGEX = /\s+/g;

type SanitizeTextOptions = {
  maxLength?: number;
  collapseWhitespace?: boolean;
};

export function sanitizeTextInput(value: unknown, options: SanitizeTextOptions = {}) {
  const { maxLength = 280, collapseWhitespace = true } = options;
  const raw = typeof value === "string" ? value : "";
  const withoutControls = raw.replace(CONTROL_CHAR_REGEX, " ");
  const normalized = collapseWhitespace ? withoutControls.replace(MULTISPACE_REGEX, " ").trim() : withoutControls.trim();
  return normalized.slice(0, Math.max(1, maxLength));
}

export function sanitizeEmailInput(value: unknown) {
  const normalized = sanitizeTextInput(value, { maxLength: 254, collapseWhitespace: true }).toLowerCase();
  return normalized.replace(/\s/g, "");
}

export function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export function sanitizeSourceInput(value: unknown, fallback: string, maxLength = 64) {
  const normalized = sanitizeTextInput(value, { maxLength, collapseWhitespace: true }).toLowerCase();
  const tokenized = normalized.replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return tokenized || fallback;
}

export function sanitizeSearchQuery(value: unknown, maxLength = 120) {
  return sanitizeTextInput(value, { maxLength, collapseWhitespace: true });
}
