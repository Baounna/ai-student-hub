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

/**
 * What the search box may do to a value that is still being typed: strip
 * control characters, and nothing else.
 *
 * The first version of this ran sanitizeSearchQuery on every keystroke. That
 * ends in .trim(), and a space is trailing whitespace at the instant you type
 * it, so every space was deleted before it reached the input — "claude ai and
 * openai" arrived as "claudeaiandopenai".
 *
 * The second version kept a single trailing space but still collapsed runs of
 * two or more, so pressing space repeatedly did nothing after the first press.
 * Which is the same bug wearing a smaller coat: the field was still editing the
 * user's keystrokes underneath them.
 *
 * A text field should show what was typed. Collapsing and trimming happen at
 * submit, and the server sanitizes the parameter again when it reads it, so
 * nothing downstream depends on this doing any of it. maxLength on the input
 * already caps the length; the slice here is belt and braces.
 */
export function sanitizeSearchInputLive(value: unknown, maxLength = 120) {
  const raw = typeof value === "string" ? value : "";
  return raw.replace(CONTROL_CHAR_REGEX, " ").slice(0, Math.max(1, maxLength));
}
