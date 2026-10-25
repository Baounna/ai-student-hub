import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import sitemap from "@/app/sitemap";
import { getAllTags, slugify } from "@/content/posts";
import { getAllNewsTags, newsBriefs } from "@/content/news";
import { MIN_POSTS_TO_INDEX, briefsWithTag, isIndexableTaxonomy, itemsWithTag, postsWithTag } from "@/lib/taxonomy";

/**
 * A tag page's indexability was decided by half its content.
 *
 * The page built its tag list from post tags AND news tags, rendered the
 * articles and then a "News on this topic" list, and 404'd only when both were
 * empty -- but it asked isIndexableTaxonomy(postsWithTag(...)), a count of blog
 * posts. So a tag with two posts and four briefs rendered six entries and asked
 * to be left out of the index, and a tag carried only by briefs rendered a real
 * list, asked to be left out, and was missing from the sitemap entirely,
 * because that loop only ever walked post tags.
 *
 * The two agree on today's data, so nothing on the live site contradicts
 * itself. This is the threshold measuring the wrong thing: free today, and it
 * costs a real page its search result the day the brief count grows. These are
 * written against counts rather than tag names so they keep working as content
 * is added.
 */
const tagSlugs = Array.from(new Set([...getAllTags(), ...getAllNewsTags()].map((tag) => slugify(tag))));

describe("what a tag page is judged on", () => {
  it("counts the briefs the page renders, not just the posts", () => {
    for (const tag of tagSlugs) {
      const expectedBriefs = newsBriefs.filter((brief) => brief.tags.some((t) => slugify(t) === tag)).length;

      expect(briefsWithTag(tag)).toBe(expectedBriefs);
      expect(itemsWithTag(tag)).toBe(postsWithTag(tag) + expectedBriefs);
    }
  });

  it("sees the tags that exist only on briefs", () => {
    const newsOnly = tagSlugs.filter((tag) => postsWithTag(tag) === 0 && briefsWithTag(tag) > 0);

    // If this empties, the fixture changed, not the bug: these are the tags the
    // old count scored zero and the page rendered a list for anyway.
    expect(newsOnly.length).toBeGreaterThan(0);
    for (const tag of newsOnly) expect(itemsWithTag(tag)).toBeGreaterThan(0);
  });

  it("the page and the sitemap agree, over every tag either of them knows", () => {
    const urls = new Set(sitemap().map((entry) => entry.url));
    for (const tag of tagSlugs) {
      const indexable = isIndexableTaxonomy(itemsWithTag(tag));
      for (const locale of ["en", "fr"] as const) {
        const listed = [...urls].some((url) => url.endsWith(`/${locale}/blog/tag/${tag}`));
        expect(listed, `/${locale}/blog/tag/${tag}: ${itemsWithTag(tag)} items, listed=${listed}`).toBe(indexable);
      }
    }
  });

  it("lists no tag page below the threshold", () => {
    const tagUrls = sitemap()
      .map((entry) => entry.url)
      .filter((url) => url.includes("/blog/tag/"));

    expect(tagUrls.length).toBeGreaterThan(0);
    for (const url of tagUrls) {
      const slug = url.split("/blog/tag/")[1];
      expect(itemsWithTag(slug), url).toBeGreaterThanOrEqual(MIN_POSTS_TO_INDEX);
    }
  });

  it("every listed tag page carries a lastmod it can justify", () => {
    // A news-only tag has no post date to take, which used to mean no date at
    // all for a page whose list does have one.
    for (const entry of sitemap().filter((e) => e.url.includes("/blog/tag/"))) {
      const slug = entry.url.split("/blog/tag/")[1];
      if (briefsWithTag(slug) > 0 || postsWithTag(slug) > 0) expect(entry.lastModified).toBeTruthy();
    }
  });

  it("the page asks the same question the sitemap does", () => {
    const source = readFileSync(path.join(process.cwd(), "src/app/[lang]/blog/tag/[tag]/page.tsx"), "utf8");

    // Comments stripped: the one above the robots line names postsWithTag as
    // the thing it stopped calling.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

    expect(code).toContain("isIndexableTaxonomy(itemsWithTag(params.tag))");
    expect(code, "the tag page counts posts only again").not.toMatch(/postsWithTag\(/);
  });
});
