import type { Locale } from "@/i18n/config";

/**
 * The two page titles that live outside the content files.
 *
 * Posts, briefs and comparisons carry their own titles, so anything that needs
 * to know what headlines the site publishes can read them. /stages and /compare
 * held theirs as local constants inside their page modules, and src/lib/og-titles.ts
 * -- which bounds what /api/og will render -- had no way to see them. The result
 * was that both pages' social previews silently fell back to the generic brand
 * card, in both languages. One source now, imported by the page and by the set.
 */
export function stagesPageTitle(locale: Locale): string {
  return locale === "fr"
    ? "Stages IA et cybersécurité en Europe, Amérique du Nord et au Maroc"
    : "AI and cybersecurity internships in Europe, North America and Morocco";
}

export function comparePageTitle(locale: Locale): string {
  return locale === "fr"
    ? "Outils IA + cybersécurité pratiques pour le travail réel"
    : "Practical AI + Cybersecurity Tools for Real Work";
}

/**
 * Three more pages that hold their title as a local constant.
 *
 * Same problem as /stages and /compare, found the same way: their social
 * previews were silently falling back to the generic brand card, because
 * src/lib/og-titles.ts could not see a title that lives inside a page module.
 * Six pages across the two locales, each sharing as an untitled card.
 */
export function liveNewsPageTitle(locale: Locale): string {
  return locale === "fr" ? "Flux live AI + Cybersecurity" : "Live AI + Cybersecurity stream";
}

export function donatePageTitle(locale: Locale): string {
  return locale === "fr" ? "Faire un don" : "Donate";
}

export function careerGuidePageTitle(locale: Locale): string {
  return locale === "fr" ? "Guide Carrière IA" : "AI Career Guide";
}
