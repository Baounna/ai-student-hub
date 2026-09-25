import type { BlogPost } from "@/content/posts";

/**
 * The reference numbers to show against one paragraph.
 *
 * Returns an empty list unless the post explicitly maps that paragraph, so the
 * default is no marker rather than a generated one. Out-of-range and duplicate
 * numbers are dropped: a marker linking to #reference-9 on a post with three
 * references is a dead anchor, and rendering it would trade a false citation for
 * a broken one.
 */
export function citationsForParagraph(
  post: Pick<BlogPost, "references" | "paragraphCitations">,
  paragraphIndex: number
): number[] {
  const mapped = post.paragraphCitations?.[paragraphIndex];
  if (!Array.isArray(mapped)) return [];
  const total = post.references.length;
  const seen = new Set<number>();
  for (const value of mapped) {
    if (!Number.isInteger(value)) continue;
    if (value < 1 || value > total) continue;
    seen.add(value);
  }
  return [...seen].sort((a, b) => a - b);
}

/**
 * True when any paragraph in the post carries real attribution. Used to decide
 * whether the article explains its markers at all -- a legend for markers that
 * do not exist is its own small lie.
 */
export function hasParagraphCitations(post: Pick<BlogPost, "references" | "paragraphCitations">): boolean {
  const map = post.paragraphCitations;
  if (!map) return false;
  return Object.keys(map).some((key) => citationsForParagraph(post, Number(key)).length > 0);
}
