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

/**
 * How many of a post's references a paragraph actually points at.
 *
 * The blog index showed `{totalReferences}+ cited sources`, which was wrong
 * twice. The "+" was a literal typed into the JSX next to an exact sum, so
 * "105+" told the reader there were more than 105 when there were exactly 105.
 * And 38 of those 105 are pointed at by no paragraph in any article -- entire
 * reference lists on two posts -- so "cited" described a third of the figure
 * inaccurately. The article page is already careful here: a post with no inline
 * markers gets the heading "Further reading" and says plainly that "no passage
 * is cited individually". The index called the same two posts' references
 * "cited sources" on the card right next to that article's title.
 */
export function citedReferenceCount(post: Pick<BlogPost, "references" | "paragraphCitations">): number {
  const used = new Set<number>();
  for (const key of Object.keys(post.paragraphCitations ?? {})) {
    for (const value of citationsForParagraph(post, Number(key))) used.add(value);
  }
  return used.size;
}

/**
 * The label that matches the number: a reference a paragraph points at is a
 * citation, one that is only listed is a reading list.
 */
export function referenceCountLabel(cited: number, locale: "en" | "fr"): string {
  if (cited > 0) return locale === "fr" ? "sources citées" : "cited sources";
  return locale === "fr" ? "sources consultées" : "sources consulted";
}
