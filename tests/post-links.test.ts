import { describe, it, expect } from "vitest";
import { posts } from "@/content/posts";

const slugs = new Set(posts.map((p) => p.slug));

describe("post cross-links", () => {
  // relatedSlugs is a plain string array, so a typo or a renamed post does not
  // fail the build — the related section just silently renders one fewer card.
  // Nothing caught that before this test.
  it("every relatedSlug points at a post that exists", () => {
    const broken: string[] = [];
    for (const post of posts) {
      for (const related of post.relatedSlugs) {
        if (!slugs.has(related)) broken.push(`${post.slug} -> ${related}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("no post links to itself", () => {
    const selfLinks = posts.filter((p) => p.relatedSlugs.includes(p.slug)).map((p) => p.slug);
    expect(selfLinks).toEqual([]);
  });

  it("every post offers a way onward", () => {
    // A post with no outbound links is a dead end for a reader who just
    // finished it, and an isolated node to a crawler working out what the
    // site is about.
    const orphans = posts.filter((p) => p.relatedSlugs.length === 0).map((p) => p.slug);
    expect(orphans).toEqual([]);
  });

  it("slugs are unique", () => {
    expect(slugs.size).toBe(posts.length);
  });
});
