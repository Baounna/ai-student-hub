import { describe, it, expect } from "vitest";
import { isKnownOgTitle, isKnownCoverSlug, knownOgTitleCount, knownCoverSlugCount } from "@/lib/og-titles";
import { locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocalizedPosts, getLocalizedComparisons, getAllCategories, getAllTags } from "@/content/posts";
import { getLocalizedNews } from "@/content/news";
import { categoryName } from "@/lib/categories";
import { comparePageTitle, stagesPageTitle } from "@/lib/page-titles";
import { countriesWithPages, countryPageTitle } from "@/content/stage-countries";
import { readFileSync, readdirSync } from "node:fs";
import { siteConfig } from "@/config/site";

/**
 * /api/og drew whatever text was in the query string, and /api/cover drew a card
 * for any slug at all, each render its own immutable CDN object. Measured on a
 * production build: forty invented titles produced forty renders, ten invented
 * slugs produced ten. The rate limiter in front of both lives in one serverless
 * instance's memory, so it multiplies by however many lanes are warm.
 *
 * These assert the opposite risk -- that bounding the input has not cut off a
 * page the site really publishes. Every title below is read from the same place
 * the page reads it, so renaming a page moves both together or fails here.
 */
describe("the set of renderable titles", () => {
  it("covers every page title the site publishes", () => {
    const missing: string[] = [];
    const check = (title: string | undefined, where: string) => {
      if (title && !isKnownOgTitle(title)) missing.push(`${where}: ${title}`);
    };

    check(siteConfig.brandName, "brand");
    for (const locale of locales) {
      const dict = getDictionary(locale);
      check(dict.about.title, `${locale} /about`);
      check(dict.blog.title, `${locale} /blog`);
      check(dict.news.title, `${locale} /news`);
      check(dict.resources.title, `${locale} /resources`);
      check(stagesPageTitle(locale), `${locale} /stages`);
      check(comparePageTitle(locale), `${locale} /compare`);

      for (const post of getLocalizedPosts(locale)) check(post.title, `${locale} post ${post.slug}`);
      for (const brief of getLocalizedNews(locale)) check(brief.title, `${locale} brief ${brief.slug}`);
      for (const c of getLocalizedComparisons(locale)) check(c.title, `${locale} comparison ${c.slug}`);

      // Composed exactly as the category and tag pages compose them.
      for (const category of getAllCategories()) {
        const label = categoryName(category, locale);
        check(locale === "fr" ? `Articles ${label}` : `${label} articles`, `${locale} category ${category}`);
      }
      for (const tag of getAllTags()) {
        check(locale === "fr" ? `Articles #${tag}` : `#${tag} articles`, `${locale} tag ${tag}`);
      }
    }

    expect(missing).toEqual([]);
  });

  /**
   * The country boards shipped with an og:image that 308s to the untitled
   * brand card, because this allowlist knew stagesPageTitle() and not
   * countryPageTitle(). It was the third page shape to do this — page-titles.ts
   * records /stages, /compare, then live news, donate and the career guide —
   * and every time the test passed, because the test only knew the routes
   * somebody remembered to add to it.
   */
  it("covers every country board, in both languages", () => {
    const codes = countriesWithPages();
    expect(codes.length).toBeGreaterThan(0);
    for (const locale of locales) {
      for (const code of codes) {
        const title = countryPageTitle(code, locale);
        expect(isKnownOgTitle(title), `${locale}/stages/${code}: "${title}" would share as the generic card`).toBe(true);
      }
    }
  });

  /**
   * The guard that does not need updating. Any route that builds a social card
   * calls ogImageUrl(); this finds every one of them and insists this file
   * imports something capable of producing its titles. It cannot verify the
   * strings — a route's title can depend on its params — but it fails the
   * moment a new page shape starts making cards that nothing here feeds.
   */
  it("knows about every route that builds a social card", () => {
    const routes: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(full);
        else if (entry.name === "page.tsx" && readFileSync(full, "utf8").includes("ogImageUrl(")) routes.push(full);
      }
    };
    walk("src/app/[lang]");
    expect(routes.length).toBeGreaterThan(5);

    const source = readFileSync("src/lib/og-titles.ts", "utf8");
    // Each route's titles must come from a module this allowlist reads.
    const sources = ["page-titles", "stage-countries", "posts", "news", "dictionaries", "categories"];
    for (const dependency of sources) {
      expect(source, `og-titles.ts should draw from ${dependency}`).toContain(dependency);
    }
  });

  it("refuses a title the site does not publish", () => {
    expect(isKnownOgTitle("free money click here")).toBe(false);
    expect(isKnownOgTitle("")).toBe(false);
    expect(isKnownOgTitle("a".repeat(500))).toBe(false);
  });

  it("matches a real title regardless of case and surrounding space", () => {
    const title = getLocalizedPosts("en")[0].title;
    expect(isKnownOgTitle(title)).toBe(true);
    expect(isKnownOgTitle(`  ${title.toUpperCase()}  `)).toBe(true);
  });

  it("has a set large enough to be the real content, not an empty fallback", () => {
    // An empty set would redirect every image on the site to the brand card,
    // which looks like nothing being wrong until someone shares a link.
    expect(knownOgTitleCount()).toBeGreaterThan(100);
    expect(knownCoverSlugCount()).toBeGreaterThan(30);
  });
});

describe("the set of renderable cover slugs", () => {
  it("covers every post, brief and comparison", () => {
    const missing: string[] = [];
    for (const locale of locales) {
      for (const post of getLocalizedPosts(locale)) {
        if (!isKnownCoverSlug(post.slug)) missing.push(`post ${post.slug}`);
      }
      for (const brief of getLocalizedNews(locale)) {
        if (!isKnownCoverSlug(brief.slug)) missing.push(`brief ${brief.slug}`);
      }
      for (const c of getLocalizedComparisons(locale)) {
        if (!isKnownCoverSlug(c.slug)) missing.push(`comparison ${c.slug}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("covers the three decorative tiles and the comparison hub hero", () => {
    // Listed rather than derived: "news-security-standards" is a real tile whose
    // nearest topic slugifies to "security-performance", so a rule inferred from
    // the naming would have 404'd a working image.
    for (const slug of ["news-ai-systems", "news-security-standards", "news-computer-systems", "compare-index", "cover"]) {
      expect(isKnownCoverSlug(slug), slug).toBe(true);
    }
  });

  it("refuses a slug the site does not publish", () => {
    expect(isKnownCoverSlug("does-not-exist-12345")).toBe(false);
    expect(isKnownCoverSlug("news-made-up-topic")).toBe(false);
    expect(isKnownCoverSlug("")).toBe(false);
  });
});
