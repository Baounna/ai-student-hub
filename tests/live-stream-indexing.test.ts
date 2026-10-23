import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import sitemap from "@/app/sitemap";

/**
 * /[lang]/news/live asked to be indexed, and it has nothing of its own to rank.
 *
 * Everything below its header is somebody else's headline, their hostname and a
 * list of their feed URLs -- not one original sentence. The French edition
 * renders the same English headlines with only the chrome translated, so
 * /en/news/live and /fr/news/live were near-identical pages, both in the
 * sitemap at priority 0.82 and changeFrequency hourly, each naming the other as
 * its hreflang alternate.
 *
 * src/app/[lang]/news/auto/[slug]/page.tsx noindexed exactly this class of
 * content, with the argument written out at length. It applies here word for
 * word and had simply not been applied.
 */
describe("the live stream's indexing", () => {
  const source = readFileSync(path.join(process.cwd(), "src/app/[lang]/news/live/page.tsx"), "utf8");

  it("is out of the index", () => {
    expect(source).toMatch(/robots:\s*\{\s*index:\s*false/);
  });

  it("still passes link equity", () => {
    // The outbound source links are genuine credit, and the links back into
    // /news and /blog should keep counting. This is a page that stops asking to
    // be ranked, not one that stops being part of the site.
    expect(source).toMatch(/robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);
  });

  it("is not in the sitemap, in either locale", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.filter((url) => url.endsWith("/news/live"))).toEqual([]);
  });

  it("has not taken /news down with it", () => {
    // The curation on the /news index is ours and stays indexable, exactly as
    // the auto-brief note promised when it drew this line the first time.
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.filter((url) => url.endsWith("/news"))).toHaveLength(2);

    const index = readFileSync(path.join(process.cwd(), "src/app/[lang]/news/page.tsx"), "utf8");
    expect(index).not.toMatch(/index:\s*false/);
  });
});
