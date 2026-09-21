import type { Locale } from "@/i18n/config";

type SectionKey = "news" | "blog" | "resources" | "stages" | "compare";

const SECTION_LABELS: Record<SectionKey, Record<Locale, string>> = {
  news: { en: "Back to the news", fr: "Retour aux actualités" },
  blog: { en: "Back to the blog", fr: "Retour au blog" },
  resources: { en: "Back to resources", fr: "Retour aux ressources" },
  stages: { en: "Back to internships", fr: "Retour aux stages" },
  compare: { en: "Back to the tools", fr: "Retour aux outils" }
};

// `in` walks the prototype chain, so "/en/constructor/x" would pass it and then
// index to undefined. Own keys only.
function isSectionKey(value: string): value is SectionKey {
  return Object.prototype.hasOwnProperty.call(SECTION_LABELS, value);
}

/**
 * The index page a broken route sits under, or null when there isn't a useful
 * one.
 *
 * This is what lets a single boundary at [lang] stand in for a boundary in
 * every heavy segment. The shell is identical either way — there is no layout
 * between [lang]/layout.tsx and the leaf pages — so the only thing a
 * blog/[slug]/error.tsx could add over the locale-level one is a more relevant
 * way out. Deriving that from the path gives the same result without five
 * near-identical files to keep in step.
 *
 * Only offered from *below* an index (length >= 3). A reader whose /en/blog
 * itself failed gains nothing from a link back to /en/blog; retry is their
 * route forward, and home is the fallback.
 */
export function sectionRecoveryLink(
  pathname: string | null | undefined,
  locale: Locale
): { href: string; label: string } | null {
  const segments = (pathname || "").split("/").filter(Boolean);
  const section = segments[1] ?? "";

  if (segments.length < 3 || !isSectionKey(section)) return null;

  return { href: `/${locale}/${section}`, label: SECTION_LABELS[section][locale] };
}
