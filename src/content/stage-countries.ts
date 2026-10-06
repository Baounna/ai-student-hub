import { countryLabel, getStages, type Stage } from "@/content/stages";
import type { Locale } from "@/i18n/config";

/**
 * How many listings a country needs before it gets its own page.
 *
 * The whole board lives at two URLs, /en/stages and /fr/stages, and the country
 * views exist only as ?country=MA — a query parameter the page explicitly
 * canonicalises back to /stages, so no country view can be found in a search.
 * A student in Casablanca searching for an internship in Morocco has no page to
 * land on, which is the one audience this board was built for.
 *
 * Four, because a page has to be worth arriving at. Spain, Portugal, Belgium
 * and the United Kingdom have one listing each: a page for a single row is a
 * thin page, and shipping ten of those to catch a search term is the doorway
 * pattern search engines demote and readers resent. They stay reachable through
 * the filter chips on the main board, which is the honest home for them.
 */
export const COUNTRY_PAGE_MIN_LISTINGS = 4;

/** Lower-case ISO 3166-1 alpha-2, the same slug in both languages so the
 *  hreflang pair is exact. The country name does the work in the title and the
 *  heading, where a search engine actually reads it. */
export function countrySlug(code: string): string {
  return code.toLowerCase();
}

export function countryFromSlug(slug: string): string | null {
  const code = slug.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && countriesWithPages().includes(code) ? code : null;
}

export function listingsByCountry(now = Date.now()): Map<string, Stage[]> {
  const byCountry = new Map<string, Stage[]>();
  for (const stage of getStages(now)) {
    const list = byCountry.get(stage.country);
    if (list) list.push(stage);
    else byCountry.set(stage.country, [stage]);
  }
  return byCountry;
}

/** Ordered by size, so the pages a reader is offered lead with the ones that
 *  have the most to show. */
export function countriesWithPages(now = Date.now()): string[] {
  return [...listingsByCountry(now).entries()]
    .filter(([, list]) => list.length >= COUNTRY_PAGE_MIN_LISTINGS)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([code]) => code);
}

export function countryPagePath(code: string, locale: Locale): string {
  return `/${locale}/stages/${countrySlug(code)}`;
}

export function countryPageTitle(code: string, locale: Locale): string {
  const name = countryLabel(code, locale);
  return locale === "fr"
    ? `Stages IA et cybersécurité ${inCountryFr(name)}`
    : `AI and cybersecurity internships in ${inCountryEn(name)}`;
}

/**
 * English needs the article on a handful of them: "in United States" and "in
 * Netherlands" read as machine output, which on a page whose whole claim is
 * that a person checked these listings is the wrong first impression. Same
 * class of mistake as the French prepositions below, caught the same way --
 * by printing all twelve titles and reading them.
 */
function inCountryEn(name: string): string {
  return /^(United States|United Kingdom|Netherlands)$/.test(name) ? `the ${name}` : name;
}

/**
 * French needs the right preposition, and it depends on the country's gender
 * and number: au Maroc, en France, aux Pays-Bas, aux États-Unis. "en Maroc" is
 * the kind of mistake that tells a French-speaking reader instantly that nobody
 * who speaks their language read the page.
 */
function inCountryFr(name: string): string {
  if (name.startsWith("États-Unis") || name.startsWith("Pays-Bas")) return `aux ${name}`;
  if (name === "Maroc" || name === "Canada" || name === "Portugal") return `au ${name}`;
  return `en ${name}`;
}
