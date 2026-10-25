import { newsBriefs, slugifyTopic } from "@/content/news";
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
 * Three is the line because that is where the page stops being a redundant
 * link and starts being a list worth landing on. The rule is applied by
 * counting, not by a hand-kept allowlist, so a tag becomes indexable by itself
 * on the day a third piece uses it -- and nobody has to remember. Three of
 * what differs by page: a category page lists posts, a tag page lists posts and
 * briefs together, and each counts what it renders. See itemsWithTag.
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

/** Hand-written briefs carrying this tag, matched the way getNewsByTag does. */
export function briefsWithTag(tagSlug: string) {
  return newsBriefs.filter((brief) => brief.tags.some((tag) => slugifyTopic(tag) === slugifyTopic(tagSlug))).length;
}

/**
 * What a tag page actually lists, which is what the threshold has to measure.
 *
 * The tag page decided its own indexability from postsWithTag alone -- a count
 * of blog posts. But its generateStaticParams builds the tag list from post
 * tags AND news tags, and its body renders the articles and then a "News on
 * this topic" list, 404ing only when both are empty. So the number deciding
 * whether a page is worth being a search result was a count of half the page:
 * a tag with two posts and four briefs renders six entries and asked to be
 * left out, and a tag carried only by briefs rendered a real list, asked to be
 * left out, and was missing from the sitemap entirely.
 *
 * The page and the sitemap did agree with each other, so nothing on the live
 * site contradicted itself -- they were both wrong in the same direction. On
 * today's content that is four tags: llm (2 posts + 1 brief), deployment and
 * backend (2 + 2) and devops (2 + 1) each render three or four entries, and
 * each was noindexed and left out of the sitemap for listing "too little".
 */
export function itemsWithTag(tagSlug: string) {
  return postsWithTag(tagSlug) + briefsWithTag(tagSlug);
}

export function isIndexableTaxonomy(count: number) {
  return count >= MIN_POSTS_TO_INDEX;
}
