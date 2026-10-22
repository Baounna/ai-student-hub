import { countryLabel, getStages, type Stage, type StageKind } from "@/content/stages";
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

/**
 * The same test /stages uses to count security roles, because the data has no
 * field for it.
 *
 * Copied rather than imported: the one copy lives inline in
 * src/app/[lang]/stages/page.tsx, and the two must not drift -- a title that
 * promises cyber from one regex while the board counts with another would be
 * two different answers to the same question on two pages of the same site.
 * tests/country-claims.test.ts reads that file and fails if the patterns stop
 * matching. Move it here and import it from there the next time that page is
 * open for editing.
 */
export const SECURITY_ROLE_PATTERN =
  /cyber|s[ée]curit|\bSOC\b|\bSSI\b|pentest|forensic|\bIAM\b|\bCERT\b|vuln/i;

export function isSecurityRole(role: string): boolean {
  return SECURITY_ROLE_PATTERN.test(role);
}

/**
 * How much of a country's list has to be security work before the title may
 * say "cybersecurity".
 *
 * Every country page was titled "AI and cybersecurity internships in X", a
 * two-part promise, and for most of them the second half was close to empty:
 * Canada 0 of 4, the United States 1 of 12, Germany 1 of 9, and Morocco -- the
 * audience these pages were built for -- 1 of 8. A student who searched for a
 * cyber internship in Casablanca, landed on a page whose heading named one,
 * and then read eight AI and data listings has been sent somewhere under false
 * pretences; that is the trip this site exists to save them.
 *
 * A third, because the title has room for two subjects and the smaller one has
 * to be worth a reader's click, not merely present. France keeps both halves
 * on 39 of 53. The rest say AI and tech, which is true of every row -- and the
 * cyber listings those countries do have are still a filter click away on the
 * board, and still counted in the sentence under the heading.
 */
export const CYBER_TITLE_MIN_SHARE = 1 / 3;

/** Counted from the country's own listings, never written down. */
export function countrySecurityCount(code: string, now = Date.now()): number {
  return (listingsByCountry(now).get(code) ?? []).filter((stage) => isSecurityRole(stage.role)).length;
}

/** Whether this country's list earns the word in its title and lead sentence. */
export function countryNamesCyber(code: string, now = Date.now()): boolean {
  const listings = listingsByCountry(now).get(code) ?? [];
  if (!listings.length) return false;
  return countrySecurityCount(code, now) / listings.length >= CYBER_TITLE_MIN_SHARE;
}

export function countryPageTitle(code: string, locale: Locale, now = Date.now()): string {
  const name = countryLabel(code, locale);
  const cyber = countryNamesCyber(code, now);
  if (locale === "fr") {
    return cyber
      ? `Stages IA et cybersécurité ${inCountryFr(name)}`
      : `Stages IA et informatique ${inCountryFr(name)}`;
  }
  return cyber
    ? `AI and cybersecurity internships in ${inCountryEn(name)}`
    : `AI and tech internships in ${inCountryEn(name)}`;
}

/**
 * The kinds this country actually lists, in the order a reader meets them on
 * the board.
 *
 * The lead paragraph and the ItemList description both said "internships,
 * apprenticeships and final-year projects" over every country. The United
 * States lists twelve internships and nothing else; Canada four; Morocco has
 * no apprenticeship at all. Two of the three named categories were empty on
 * those pages, which is a reader scrolling for an alternance that was never
 * there.
 */
const KIND_ORDER: readonly StageKind[] = ["stage", "alternance", "pfe"];

const KIND_PLURALS: Record<StageKind, Record<Locale, string>> = {
  stage: { en: "internships", fr: "stages" },
  alternance: { en: "apprenticeships", fr: "alternances" },
  pfe: { en: "final-year projects", fr: "PFE" }
};

function joinList(parts: string[], locale: Locale): string {
  if (parts.length <= 1) return parts[0] ?? "";
  const last = parts[parts.length - 1];
  return `${parts.slice(0, -1).join(", ")} ${locale === "fr" ? "et" : "and"} ${last}`;
}

/**
 * The sentence under the heading, counted from the same listings the page then
 * renders.
 *
 * Lives here rather than in the page so the H1 and this paragraph cannot
 * disagree about whether the country has cyber work in it, and so a test can
 * hold both to the data.
 */
export function countryPageBlurb(code: string, locale: Locale, now = Date.now()): string {
  const listings = listingsByCountry(now).get(code) ?? [];
  const name = countryLabel(code, locale);
  const present = KIND_ORDER.filter((kind) => listings.some((stage) => stage.kind === kind));
  const kinds = joinList(
    present.map((kind) => KIND_PLURALS[kind][locale]),
    locale
  );
  const subject = countryNamesCyber(code, now)
    ? locale === "fr"
      ? "IA et cybersécurité"
      : "AI and cybersecurity"
    : locale === "fr"
      ? "IA et informatique"
      : "AI and tech";

  if (locale === "fr") {
    // "stages" and "PFE" are masculine, "alternances" feminine: a list of only
    // alternances would read "ouvertes". Agreement done properly, for the same
    // reason the prepositions below are -- a French reader can tell when nobody
    // who speaks their language read the page.
    const agreement = present.some((kind) => kind !== "alternance") ? "ouverts" : "ouvertes";
    return `${listings.length} ${kinds} en ${subject} ${agreement} aux étudiants, vérifiés chaque semaine. ${name}.`;
  }
  return `${listings.length} ${kinds} in ${subject}, re-checked every week. ${name}.`;
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
