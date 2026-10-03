import { locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocalizedPosts, getLocalizedComparisons } from "@/content/posts";
import { getLocalizedNews } from "@/content/news";
import { getAutoNews } from "@/content/auto-news";
import { categoryName } from "@/lib/categories";
import { getAllCategories, getAllTags } from "@/content/posts";
import { sanitizeTextInput } from "@/lib/input";
import { siteConfig } from "@/config/site";
import {
  careerGuidePageTitle,
  comparePageTitle,
  donatePageTitle,
  liveNewsPageTitle,
  stagesPageTitle
} from "@/lib/page-titles";

/**
 * Every headline this site can legitimately ask /api/og to draw.
 *
 * /api/og took its text from the query string, and each distinct ?title= was a
 * fresh Satori render served `immutable` -- so a loop of unique titles was a
 * loop of unique CDN objects and unique renders, and the only thing in its way
 * was a rate limiter that lives in one serverless instance's memory and
 * therefore multiplies by however many lanes are warm. Measured on a production
 * build: forty invented titles, forty renders, zero refusals.
 *
 * Tightening the limiter does not fix that, because the limit is per instance
 * and the cost is per render either way. Bounding the INPUT does: with the set
 * of real headlines fixed, an attacker can only ever ask for images that a
 * reader was going to request anyway, and every one of them is cacheable.
 *
 * This project has no payment method on file, so the failure being avoided is
 * not a bill -- it is the Hobby plan pausing and the site going dark.
 */
let cache: Set<string> | null = null;

/** Compared after the same sanitiser the route applies, so the two agree. */
function normalize(title: string): string {
  return sanitizeTextInput(title, { maxLength: 200 }).trim().toLowerCase();
}

function buildKnownTitles(): Set<string> {
  const titles = new Set<string>();
  const add = (value: string | undefined) => {
    if (!value) return;
    const key = normalize(value);
    if (key) titles.add(key);
  };

  add(siteConfig.brandName);

  for (const locale of locales) {
    const dict = getDictionary(locale);
    // The static pages name themselves through the dictionary.
    add(dict.about.title);
    add(dict.blog.title);
    add(dict.news.title);
    add(dict.resources.title);

    for (const post of getLocalizedPosts(locale)) add(post.title);
    for (const brief of getLocalizedNews(locale)) add(brief.title);
    // The automated feed is rewritten twice a day; this is read at module load,
    // and the module is reloaded with every deployment the agent's commit
    // triggers. A title that arrives between deployments falls back rather
    // than failing, which is the right way round.
    for (const item of getAutoNews(locale, 500)) add(item.title);
    for (const comparison of getLocalizedComparisons(locale)) add(comparison.title);
    /**
     * Category and tag pages compose their title rather than using a bare name,
     * and /stages and /compare hold theirs as local constants. All four were
     * missing from the first version of this set, and the check that catches
     * that is tests/og-titles.test.ts, which reads the same page modules and
     * fails if any title they publish is not here.
     */
    for (const category of getAllCategories()) {
      const label = categoryName(category, locale);
      add(locale === "fr" ? `Articles ${label}` : `${label} articles`);
    }
    for (const tag of getAllTags()) {
      add(locale === "fr" ? `Articles #${tag}` : `#${tag} articles`);
    }
    add(stagesPageTitle(locale));
    add(comparePageTitle(locale));
    add(liveNewsPageTitle(locale));
    add(donatePageTitle(locale));
    add(careerGuidePageTitle(locale));
    // The three legal pages. Their titles are plain strings in their own
    // modules; listed here rather than exported, because unlike the pages above
    // nothing else needs to know them.
    add(locale === "fr" ? "Politique de confidentialité" : "Privacy Policy");
    add(locale === "fr" ? "Conditions d'utilisation" : "Terms of Use");
    add(locale === "fr" ? "Politique de liens" : "Link Policy");
    // Feature-flagged off and noindex today, so nobody shares it -- but it is
    // one line, and it is correct the day the flag goes on.
    add(locale === "fr" ? "Sprint croissance 14 jours" : "14-day growth sprint");
  }

  return titles;
}

export function isKnownOgTitle(title: string): boolean {
  if (!cache) cache = buildKnownTitles();
  return cache.has(normalize(title));
}

/** Exposed for the test that proves the set covers what the site asks for. */
export function knownOgTitleCount(): number {
  if (!cache) cache = buildKnownTitles();
  return cache.size;
}

/**
 * Every slug /api/cover will draw a card for.
 *
 * The same unbounded-render problem as the title set above, reached through the
 * path instead of the query string: an unknown slug did not 404, it fell
 * through titleFor() to titleFromSlug() and paletteFor() to the default
 * palette, so /api/cover/anything/en/made-up-slug-12345 returned a 200 PNG.
 * Measured: ten invented slugs, ten renders.
 */
let coverCache: Set<string> | null = null;

function buildKnownCoverSlugs(): Set<string> {
  const slugs = new Set<string>();

  for (const locale of locales) {
    for (const post of getLocalizedPosts(locale)) slugs.add(post.slug);
    for (const brief of getLocalizedNews(locale)) slugs.add(brief.slug);
    for (const item of getAutoNews(locale, 500)) if (item.slug) slugs.add(item.slug);
    for (const comparison of getLocalizedComparisons(locale)) slugs.add(comparison.slug);
  }

  /**
   * The three decorative tiles on /news, and the comparison hub's hero.
   *
   * Listed rather than derived: the first guess here was to accept any
   * "news-<topic-slug>" whose topic the site publishes, which would have
   * rejected "news-security-standards" -- a real tile, whose nearest topic
   * slugifies to "security-performance". Deriving a rule from a name that only
   * looks systematic is how a working page starts 404ing.
   */
  slugs.add("cover");
  slugs.add("compare-index");
  slugs.add("news-ai-systems");
  slugs.add("news-computer-systems");
  slugs.add("news-security-standards");

  return slugs;
}

export function isKnownCoverSlug(slug: string): boolean {
  if (!coverCache) coverCache = buildKnownCoverSlugs();
  return coverCache.has(slug);
}

/** Exposed so a test can assert the set covers every page that asks for one. */
export function knownCoverSlugCount(): number {
  if (!coverCache) coverCache = buildKnownCoverSlugs();
  return coverCache.size;
}
