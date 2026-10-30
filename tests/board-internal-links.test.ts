import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { posts } from "@/content/posts";
import { siteConfig } from "@/config/site";

/**
 * The links into the internship board, which have now gone missing twice.
 *
 * An SEO audit found that two of twenty-seven posts linked to /stages at all.
 * A later rewrite of the callouts -- a good rewrite, which replaced invented
 * "resource stacks" with one real instruction -- took both of those links with
 * it, and nothing failed, because a callout with `links: []` is valid and
 * renders a tidy empty row. The board is the only thing on this site that is
 * checked every week, and for two spells nothing a reader could be reading
 * pointed at it.
 *
 * Reading the content rather than the markup, because that is where both
 * disappearances happened.
 */
const STAGES = /^\/stages(\?|$)/;

describe("posts link into the internship board", () => {
  const linking = posts.filter((post) => post.affiliateCallout.links.some((link) => STAGES.test(link.href)));

  it("more than one post offers the board as a next click", () => {
    // Not a count anyone has to maintain: the point is that the board is never
    // again reachable from zero articles, or from only the one that happens to
    // be about internships.
    expect(linking.length).toBeGreaterThan(1);
  });

  it("reaches the CS and security set, where security internship intent lands", () => {
    // These twelve posts are what a student searching "security internship",
    // "Linux hardening" or "prompt injection" arrives on, and all twelve had
    // no way through to the board.
    const csSlugs = linking.map((post) => post.slug).filter((slug) => slug !== "student-ai-internship-roadmap");
    expect(csSlugs.length).toBeGreaterThan(0);
  });

  it("offers one board link per post, not a row of them", () => {
    // The house form for these callouts is one instruction and at most one
    // button. A second /stages button in the same block also collides on the
    // React key, which is href plus label.
    for (const post of linking) {
      const boardLinks = post.affiliateCallout.links.filter((link) => STAGES.test(link.href));
      expect(boardLinks.length, `${post.slug}`).toBe(1);
    }
  });

  it("leaves most posts without one", () => {
    // A button under every article is a button nobody reads, and the nine CS
    // posts where the board is a change of subject keep their empty links
    // array on purpose.
    expect(linking.length).toBeLessThan(posts.length / 2);
  });
});

/**
 * The trust panel's strongest sentence, and whether you can act on it.
 *
 * "The internship list is re-checked every week" renders on eleven templates
 * in both languages, which makes it the site's most repeated claim -- and the
 * words "internship list" were not a link, so a reader persuaded by it had to
 * go and find the board themselves from the page that had just told them why
 * to go.
 */
describe("the weekly-check claim links to the list it describes", () => {
  const trust = readFileSync("src/components/editorial-trust.tsx", "utf8");

  it("makes the named list a link, in both languages", () => {
    expect(trust).toMatch(/href=\{`\/\$\{locale\}\/stages`\}/);
    expect(trust).toMatch(/>\s*internship list\s*</);
    expect(trust).toMatch(/>\s*liste des stages\s*</);
  });

  it("keeps the sentence that was corrected, word for word", () => {
    // The wording is load-bearing: "either shows its check date or says we
    // could not verify it" replaced an absolute that two unverifiable rows
    // broke. Splitting the string around a link must not reword it.
    expect(trust).toMatch(/is re-checked every week, and every entry either shows its check date or says we could not verify it\./);
    expect(trust).toMatch(/est revérifiée chaque semaine : chaque offre affiche sa date de vérification, ou indique que nous/);
  });
});

/**
 * The country pages' trail, which started halfway down the site.
 *
 * Twelve URLs built to be found in a search opened with "AI and cyber
 * internships / France" and no way up to the front of the site, while every
 * other template starts at the brand name. Breadcrumbs emits the
 * BreadcrumbList from the same array, so the structured data was a level short
 * too.
 */
describe("the stages pages' breadcrumbs and cards", () => {
  const country = readFileSync("src/app/[lang]/stages/[country]/page.tsx", "utf8");
  const board = readFileSync("src/app/[lang]/stages/page.tsx", "utf8");

  it("starts the country trail at the brand name", () => {
    const items = country.slice(country.indexOf("<Breadcrumbs"), country.indexOf("<h1"));
    expect(items).toContain("siteConfig.brandName");
    // The brand crumb is only a Home crumb if it goes home.
    expect(items).toMatch(/siteConfig\.brandName, href: `\/\$\{locale\}`/);
    expect(siteConfig.brandName.length).toBeGreaterThan(0);
  });

  it("gives both stages routes a twitter image", () => {
    // X falls back to og:image, so the cards looked right and these two were
    // the only routes on the site without their own -- on the pages people
    // share to send someone a job.
    for (const [name, source] of [
      ["stages", board],
      ["stages/[country]", country]
    ] as const) {
      const twitter = source.slice(source.indexOf("twitter:"));
      expect(twitter.slice(0, 400), name).toContain("images");
    }
  });
});
