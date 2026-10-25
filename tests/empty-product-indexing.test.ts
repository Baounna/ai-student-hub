import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { getGuideCtaHref } from "@/lib/product";

/**
 * /product/ai-career-guide was advertised hardest of anything on the site and
 * had nothing on it.
 *
 * Its own meta description reads "This guide is not written yet. Here is what
 * already exists, free." src/lib/product.ts gates the whole shop behind
 * GUIDE_EXISTS = false and routes all twenty-eight former inbound links away
 * from the page, so nothing links to it. Meanwhile the sitemap listed it at
 * priority 0.86 -- above /blog and above every country board. A SERP snippet
 * reading "this guide is not written yet", under a brand whose pitch is
 * verified work, is worse for a reader than no result at all.
 *
 * GUIDE_EXISTS is private to src/lib/product.ts, so both the page and the
 * sitemap derive the answer from getGuideCtaHref, which is a pure function of
 * it. That is what makes this reverse itself the day the guide is written
 * instead of waiting for someone to remember. These checks are written the
 * same way -- against the gate rather than against today's value of it -- so
 * they keep their teeth after it flips.
 */
const GUIDE_EXISTS = getGuideCtaHref("en") === "/en/product/ai-career-guide";

describe("a page that says it is empty", () => {
  const file = path.join(process.cwd(), "src/app/[lang]/product/ai-career-guide/page.tsx");
  const source = readFileSync(file, "utf8");

  it("is in the sitemap only when there is a guide to list", () => {
    const listed = sitemap().filter((entry) => entry.url.endsWith("/product/ai-career-guide"));

    expect(listed.length).toBe(GUIDE_EXISTS ? 2 : 0);
  });

  it("asks not to be indexed while it is empty, and still passes its links on", () => {
    // follow stays on: "What actually exists" sends a reader to the board, the
    // blog and the tools lab, which is where they should have landed.
    expect(source).toMatch(/robots:\s*GUIDE_EXISTS\s*\?\s*undefined\s*:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);
  });

  it("decides from the constant that governs the product, not by hand", () => {
    // A hardcoded exclusion is one someone has to undo, so both call sites must
    // derive it -- then the sitemap entry and the noindex come back together
    // the moment the guide is written.
    //
    // They used to infer it from a link, `getGuideCtaHref("en") ===
    // "/en/product/ai-career-guide"`, because product.ts exported the fact
    // nowhere: canSellProduct() conflates "the guide exists" with "a checkout
    // URL is set", and a sitemap cannot import a page module. Correct, but it
    // stated one fact in two places as a riddle. product.ts now exports
    // guideExists(), so this asserts the fact is asked for rather than
    // reconstructed.
    const sitemapSource = readFileSync(path.join(process.cwd(), "src/app/sitemap.ts"), "utf8");
    for (const [label, text] of [["product page", source], ["sitemap", sitemapSource]] as const) {
      expect(text, label).toContain("guideExists");
      expect(text, `${label} should not reconstruct the fact from a link`).not.toContain(
        'getGuideCtaHref("en") ==='
      );
    }
  });

  it("has not taken the pages a reader should reach down with it", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls.filter((url) => url.endsWith("/blog"))).toHaveLength(2);
    expect(urls.filter((url) => url.endsWith("/stages"))).toHaveLength(2);
  });
});

/**
 * /health returns operational JSON -- timestamps and item counts for the
 * watchdog -- and sits at /health rather than /api/health, so the "/api/" line
 * in robots.txt never covered it. Nothing links to it and no sitemap lists it,
 * which left the X-Robots-Tag the route sets as the only thing keeping it out
 * of results, and a header is only read if a crawler spends a request fetching
 * the JSON first. Both now: the Disallow saves the crawl, the header covers
 * anyone who links to /health directly.
 */
describe("the health endpoint", () => {
  it("is disallowed in robots.txt", () => {
    const rules = robots().rules;
    const all = (Array.isArray(rules) ? rules : [rules]).flatMap((rule) =>
      Array.isArray(rule.disallow) ? rule.disallow : rule.disallow ? [rule.disallow] : []
    );

    expect(all).toContain("/health");
  });

  it("keeps the header as well, because a Disallow is not a noindex", () => {
    const route = readFileSync(path.join(process.cwd(), "src/app/health/route.ts"), "utf8");

    expect(route).toContain("X-Robots-Tag");
  });

  it("is in no sitemap, so nothing contradicts the Disallow", () => {
    expect(sitemap().filter((entry) => entry.url.endsWith("/health"))).toEqual([]);
  });
});
