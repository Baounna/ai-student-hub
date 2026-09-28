import { posts, slugify } from "@/content/posts";

/**
 * When a tag or category page is worth putting in the index.
 *
 * 53 of the site's 67 tags matched exactly one post, and each of those pages
 * was indexable and in the sitemap. That made 134 of 251 sitemap URLs -- 53% of
 * everything a crawler was pointed at -- pages whose entire content is a single
 * link to an article that is already indexed on its own. On a domain with no
 * authority that is the classic way a small site dilutes itself: the thinnest
 * content occupies most of the indexable surface, while the genuinely scarce
 * thing here, 82 hand-verified internships, occupies two URLs.
 *
 * Three posts is the line because that is where the page stops being a
 * redundant link and starts being a list worth landing on. The rule is applied
 * by counting, not by a hand-kept allowlist, so a tag becomes indexable by
 * itself on the day a third post uses it -- and nobody has to remember.
 *
 * follow stays on throughout: the pages remain useful navigation for readers
 * and the links out of them still count. This is about what deserves to be a
 * search result, not about hiding anything.
 */
export const MIN_POSTS_TO_INDEX = 3;

export function postsInCategory(categorySlug: string) {
  return posts.filter((post) => slugify(post.category) === slugify(categorySlug)).length;
}

export function postsWithTag(tagSlug: string) {
  return posts.filter((post) => post.tags.some((tag) => slugify(tag) === slugify(tagSlug))).length;
}

export function isIndexableTaxonomy(count: number) {
  return count >= MIN_POSTS_TO_INDEX;
}
