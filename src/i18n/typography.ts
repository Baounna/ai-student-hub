import type { Locale } from "@/i18n/config";

/**
 * French puts a space before : ; ! and ?
 *
 * The space is U+00A0 so the punctuation cannot wrap onto the next line on its
 * own, matching what the written content already does.
 *
 * This exists because tests/french-typography.test.ts could only see the inside
 * of string literals, and nine labels put the colon OUTSIDE one:
 *
 *     {locale === "fr" ? "Dernière synchronisation" : "Last sync"}: {date}
 *
 * The colon there is JSX text. It is in no string, so no scan of strings could
 * ever find it, and the French half of nine pages read "Dernière
 * synchronisation: 4 nov. 2026" while the test written to prevent exactly that
 * reported green. Putting the punctuation back inside a function is what makes
 * it checkable.
 */
export function withColon(label: string, locale: Locale): string {
  // Trailing whitespace is trimmed first, so a label that already ends in a
  // space does not end up with two of them before the colon. The escape is
  // written out rather than pasted, because an invisible U+00A0 in source is
  // the kind of character a later edit silently drops.
  const text = label.replace(/[\s\u00a0]+$/, "");
  return locale === "fr" ? `${text}\u00a0:` : `${text}:`;
}
