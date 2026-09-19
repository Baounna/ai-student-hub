import type { Locale } from "@/i18n/config";

/**
 * Reading time is stored as an English string ("7 min read") because it is
 * measured once at build time from the English body. Rendering that string
 * directly on a French page printed "Lecture en 7 min read." — a French
 * sentence wrapped around an English fragment, on every post.
 *
 * The English side had its own version of the bug: the template read
 * "${post.readTime} reading time.", which rendered "7 min read reading time."
 *
 * Parse the number once, format per locale.
 */
export function readMinutes(readTime: string): number {
  const minutes = Number.parseInt(readTime, 10);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
}

export function formatReadTime(readTime: string, locale: Locale): string {
  const minutes = readMinutes(readTime);
  if (!minutes) return "";
  return locale === "fr" ? `${minutes} min de lecture` : `${minutes} min read`;
}
