import type { MetadataRoute } from "next";
import { comparisons, getAllCategories, getAllTags, posts, slugify } from "@/content/posts";
import { newsBriefs } from "@/content/news";
import { getAutoNewsUpdatedAt } from "@/content/auto-news";
import { getAutoToolsUpdatedAt } from "@/content/auto-tools";
import { locales } from "@/i18n/config";
import { absoluteUrl } from "@/lib/site-url";
import { getStagesUpdatedAt } from "@/content/stages";

/**
 * lastmod is a claim about the content, not about the deploy.
 *
 * Most of this file used to stamp `new Date()`, so every URL carried the
 * moment the build ran. The content agents push auto-news.json and
 * auto-tools.json on a schedule and each push redeploys, which meant 175 of
 * the 245 URLs here claimed to have changed today — every day, whatever had
 * actually happened. A crawler that learns a site's lastmod is noise stops
 * reading it, and then the dates that are real (posts, briefs, the internship
 * list) lose the signal along with the invented ones.
 *
 * So every date below is derived from the data the page renders. Where no
 * honest date exists, the entry ships with no lastmod at all: the field is
 * optional in the sitemap protocol for exactly this case, and an absent
 * lastmod is a smaller lie than a false one.
 *
 * changeFrequency and priority are left exactly as they were found. Google has
 * said publicly that it ignores both, and priority was only ever a ranking of
 * our own URLs against each other rather than a request to anyone. Swapping
 * one set of invented numbers for another would be motion, not work; this
 * note is worth more than the numbers are.
 */

/** Newest of a set of date strings; undefined when none of them parse. */
function newestOf(values: Array<string | undefined>): string | undefined {
  let newest: string | undefined;
  let newestTime = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    if (!value) continue;
    const time = Date.parse(value);
    if (!Number.isFinite(time) || time <= newestTime) continue;
    newest = value;
    newestTime = time;
  }

  return newest;
}

/**
 * An invalid Date does not throw — it serializes into the XML as garbage and
 * the whole entry becomes unreadable. Anything we cannot parse loses its
 * lastmod instead, which is the outcome we would have chosen anyway.
 */
function asDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time) : undefined;
}

/** Newest publishedAt among the posts a listing page actually lists. */
function newestPostIn(match: (post: (typeof posts)[number]) => boolean): string | undefined {
  return newestOf(posts.filter(match).map((post) => post.publishedAt));
}

/**
 * The hand-written pages — /about, /donate, /resources, the product page —
 * have no data behind them, so nothing can derive a date for them. This is the
 * commit that last edited their copy (a2caf28, the French accent pass), read
 * off `git log -1 -- "src/app/[lang]/about/page.tsx"`.
 *
 * Move it when you rewrite that copy. Forgetting understates one change and
 * costs a re-crawl; the build clock overstated every page every day and cost
 * the file its credibility, which is the more expensive of the two.
 */
const EDITORIAL_PAGES_UPDATED_AT = "2026-09-20T16:32:30.000Z";

/**
 * The comparison tables are a const array in src/content/posts.ts with no date
 * field of its own. This is when that array last changed (9f570db). Same rule:
 * edit the tables, move the date.
 */
const COMPARISONS_UPDATED_AT = "2026-06-24T13:08:02.000Z";

export default function sitemap(): MetadataRoute.Sitemap {
  const newestPostAt = newestOf(posts.map((post) => post.publishedAt));
  const newestBriefAt = newestOf(newsBriefs.map((brief) => brief.publishedAt));
  const autoNewsAt = getAutoNewsUpdatedAt();
  const autoToolsAt = getAutoToolsUpdatedAt();

  // The home page is a digest of everything that moves: newest posts, newest
  // briefs, and the auto-news feed it renders inline.
  const homeAt = newestOf([newestPostAt, newestBriefAt, autoNewsAt]);

  const rootEntry: MetadataRoute.Sitemap = [
    {
      // "/" redirects by Accept-Language to /en or /fr, so it is the home page
      // under another name and shares its date.
      url: absoluteUrl("/"),
      lastModified: asDate(homeAt),
      changeFrequency: "daily",
      priority: 1
    }
  ];

  const localizedStaticPages = locales.flatMap((locale) =>
    [
      { route: "", lastModified: homeAt, priority: 0.95, changeFrequency: "daily" as const },
      {
        // /news puts the hand-written briefs above the auto-news feed, so it is
        // as new as whichever of the two moved last.
        route: "/news",
        lastModified: newestOf([newestBriefAt, autoNewsAt]),
        priority: 0.95,
        changeFrequency: "hourly" as const
      },
      {
        // The live stream is fetched per request from feeds we do not control,
        // so its true age is unknowable at build time. The auto-news snapshot
        // is both its fallback and the freshest content we can prove it
        // contains — a floor, never an overstatement.
        route: "/news/live",
        lastModified: autoNewsAt,
        priority: 0.82,
        changeFrequency: "hourly" as const
      },
      { route: "/blog", lastModified: newestPostAt, priority: 0.92, changeFrequency: "daily" as const },
      { route: "/about", lastModified: EDITORIAL_PAGES_UPDATED_AT, priority: 0.68, changeFrequency: "monthly" as const },
      {
        // The tool lists are hand-maintained data in posts.ts, edited in the
        // same pass as the page copy.
        route: "/resources",
        lastModified: EDITORIAL_PAGES_UPDATED_AT,
        priority: 0.9,
        changeFrequency: "weekly" as const
      },
      {
        // The compare index carries the auto-tools feed under the comparison
        // cards, so it moves with either.
        route: "/compare",
        lastModified: newestOf([COMPARISONS_UPDATED_AT, autoToolsAt]),
        priority: 0.9,
        changeFrequency: "weekly" as const
      },
      {
        // The stages list changes when the data changes, not when the site
        // deploys. A lastmod that never advances teaches a crawler to stop
        // looking, which is the opposite of what a weekly list needs.
        route: "/stages",
        lastModified: getStagesUpdatedAt(),
        priority: 0.93,
        changeFrequency: "weekly" as const
      },
      { route: "/donate", lastModified: EDITORIAL_PAGES_UPDATED_AT, priority: 0.52, changeFrequency: "monthly" as const },
      {
        route: "/product/ai-career-guide",
        lastModified: EDITORIAL_PAGES_UPDATED_AT,
        priority: 0.86,
        changeFrequency: "weekly" as const
      }
    ].map((item) => ({
      url: absoluteUrl(`/${locale}${item.route}`),
      lastModified: asDate(item.lastModified),
      changeFrequency: item.changeFrequency,
      priority: item.priority
    }))
  );

  const blogPages = locales.flatMap((locale) =>
    posts.map((post) => ({
      url: absoluteUrl(`/${locale}/blog/${post.slug}`),
      lastModified: asDate(post.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.84
    }))
  );
  const newsPages = locales.flatMap((locale) =>
    newsBriefs.map((brief) => ({
      url: absoluteUrl(`/${locale}/news/${brief.slug}`),
      lastModified: asDate(brief.publishedAt),
      changeFrequency: "daily" as const,
      priority: 0.87
    }))
  );
  // The auto briefs are deliberately absent. They carry robots noindex, and
  // listing a page in the sitemap is a request to index it — asking for the
  // opposite of what the page itself says wastes crawl budget on 480 URLs and
  // sends a contradictory signal.
  //
  // Worth knowing before changing this back: almost nothing links to those
  // detail pages. /news renders the live feed when it has one and links each
  // item straight to its original source; the "Read auto brief" link only
  // appears in the fallback branch, when the live fetch comes back empty. So
  // the sitemap was effectively their only route in, for crawlers and readers
  // alike. Whether 480 near-orphaned pages should exist at all is a separate
  // question from whether they belong in the index.

  const localizedComparisonPages = locales.flatMap((locale) =>
    comparisons.map((comparison) => ({
      url: absoluteUrl(`/${locale}/compare/${comparison.slug}`),
      // Per-comparison dates would be better, but ComparisonPage has no date
      // field and inventing one per slug would be guessing. The whole array
      // was last edited together, so they share that date.
      lastModified: asDate(COMPARISONS_UPDATED_AT),
      changeFrequency: "weekly" as const,
      priority: 0.86
    }))
  );

  const categoryPages = locales.flatMap((locale) =>
    getAllCategories().map((category) => ({
      url: absoluteUrl(`/${locale}/blog/category/${slugify(category)}`),
      // A category page changes when its newest post does. getAllCategories()
      // also returns the REQUIRED_CATEGORY_COVERAGE entries that no post fills
      // yet: those pages have never shown anything, so they go out with no
      // lastmod rather than borrowing one from elsewhere.
      lastModified: asDate(newestPostIn((post) => slugify(post.category) === slugify(category))),
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  );

  const tagPages = locales.flatMap((locale) =>
    getAllTags().map((tag) => ({
      url: absoluteUrl(`/${locale}/blog/tag/${slugify(tag)}`),
      // Same rule as categories, matched the way the tag page itself filters.
      lastModified: asDate(newestPostIn((post) => post.tags.some((postTag) => slugify(postTag) === slugify(tag)))),
      changeFrequency: "weekly" as const,
      priority: 0.65
    }))
  );

  return [
    ...rootEntry,
    ...localizedStaticPages,
    ...blogPages,
    ...newsPages,
    ...localizedComparisonPages,
    ...categoryPages,
    ...tagPages
  ];
}
