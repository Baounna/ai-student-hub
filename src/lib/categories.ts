import type { Locale } from "@/i18n/config";

/**
 * The category names readers see, per locale.
 *
 * The French names already existed, in src/lib/suggest-index.ts, where only the
 * typeahead used them. So a French reader searching "carriere" was offered
 * "Carriere/Entretiens" in the dropdown and landed on a page whose H1,
 * breadcrumb, title and description all said "Career/Interviews" -- the French
 * translation of the taxonomy existed and the pages it names did not use it.
 *
 * Accents are restored here. They were stripped in the old map, which reads like
 * caution about matching, but src/lib/suggest.ts normalises NFD and drops
 * combining marks before comparing, so "carriere" already matches "Carrière".
 * A visible heading should be spelled correctly.
 *
 * Keys are the category strings the content files use, which are also the source
 * of the URL slug -- so the slug stays English in both locales and the FR and EN
 * pages for one category remain a genuine translation pair.
 */
const FRENCH_NAMES: Record<string, string> = {
  "AI Fundamentals": "Fondamentaux IA",
  "ML Engineering": "Ingénierie ML",
  "LLM Systems": "Systèmes LLM",
  "CS Fundamentals": "Fondamentaux informatique",
  "Systems & Backend": "Systèmes & Backend",
  "Cloud/DevOps": "Cloud/DevOps",
  "Security & Performance": "Sécurité & Performance",
  "Career/Interviews": "Carrière/Entretiens"
};

export function categoryName(category: string, locale: Locale) {
  if (locale !== "fr") return category;
  return FRENCH_NAMES[category] || category;
}
