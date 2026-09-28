import { describe, it, expect } from "vitest";
import { getAllCategories, getAllTags, posts, slugify } from "@/content/posts";
import { MIN_POSTS_TO_INDEX, isIndexableTaxonomy, postsInCategory, postsWithTag } from "@/lib/taxonomy";

/**
 * 53 of 67 tags matched exactly one post, and every one of those pages was
 * indexable and in the sitemap: 134 of 251 sitemap URLs were a link to an
 * article the sitemap also listed directly. These lock the rule that replaced
 * that, and they are written against counts rather than a list of tag names so
 * they keep working as posts are added.
 */
describe("taxonomy indexing rule", () => {
  it("counts what the pages themselves filter on", () => {
    for (const tag of getAllTags()) {
      const expected = posts.filter((p) => p.tags.some((t) => slugify(t) === slugify(tag))).length;
      expect(postsWithTag(slugify(tag))).toBe(expected);
    }
    for (const category of getAllCategories()) {
      const expected = posts.filter((p) => slugify(p.category) === slugify(category)).length;
      expect(postsInCategory(slugify(category))).toBe(expected);
    }
  });

  it("keeps a page out of the index until it lists enough posts", () => {
    expect(isIndexableTaxonomy(MIN_POSTS_TO_INDEX - 1)).toBe(false);
    expect(isIndexableTaxonomy(MIN_POSTS_TO_INDEX)).toBe(true);
    expect(isIndexableTaxonomy(0)).toBe(false);
  });

  it("indexes no taxonomy page that lists fewer posts than the threshold", () => {
    const wrong = [
      ...getAllTags().filter((t) => isIndexableTaxonomy(postsWithTag(slugify(t))) && postsWithTag(slugify(t)) < MIN_POSTS_TO_INDEX),
      ...getAllCategories().filter(
        (c) => isIndexableTaxonomy(postsInCategory(slugify(c))) && postsInCategory(slugify(c)) < MIN_POSTS_TO_INDEX
      )
    ];

    expect(wrong).toEqual([]);
  });

  it("still indexes the tags that are real hubs", () => {
    // If this ever empties, the threshold is too high for the site's size.
    const indexable = getAllTags().filter((t) => isIndexableTaxonomy(postsWithTag(slugify(t))));

    expect(indexable.length).toBeGreaterThan(0);
  });

  it("an unknown slug is not indexable", () => {
    expect(postsWithTag("no-such-tag")).toBe(0);
    expect(postsInCategory("no-such-category")).toBe(0);
    expect(isIndexableTaxonomy(postsWithTag("no-such-tag"))).toBe(false);
  });
});
