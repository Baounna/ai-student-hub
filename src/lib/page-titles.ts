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
