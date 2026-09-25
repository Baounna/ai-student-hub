import { describe, it, expect } from "vitest";
import { citationsForParagraph, hasParagraphCitations } from "@/lib/citations";
import { posts } from "@/content/posts";

const post = (paragraphCitations?: Record<number, number[]>) => ({
  references: [
    { source: "a", label: { en: "A", fr: "A" }, href: "https://a.test" },
    { source: "b", label: { en: "B", fr: "B" }, href: "https://b.test" },
    { source: "c", label: { en: "C", fr: "C" }, href: "https://c.test" }
  ],
  paragraphCitations
});

/**
 * Every paragraph used to carry a marker chosen by
 * (paragraphIndex % references.length) + 1 -- 506 numbered footnotes across
 * both locales, each asserting that a specific sentence was backed by a
 * specific source, none of which anyone had compared. A footnote is a promise.
 */
describe("paragraph citations", () => {
  it("shows no marker when the paragraph has no stated attribution", () => {
    expect(citationsForParagraph(post(), 0)).toEqual([]);
    expect(citationsForParagraph(post({ 5: [1] }), 0)).toEqual([]);
  });

  it("shows the references a paragraph was actually checked against", () => {
    expect(citationsForParagraph(post({ 2: [1, 3] }), 2)).toEqual([1, 3]);
  });

  it("sorts and de-duplicates so the markers read in order", () => {
    expect(citationsForParagraph(post({ 0: [3, 1, 3] }), 0)).toEqual([1, 3]);
  });

  // A marker pointing at #reference-9 on a three-source post is a dead anchor.
  // Trading a false citation for a broken one is not a fix.
  it("drops numbers that no reference answers to", () => {
    expect(citationsForParagraph(post({ 0: [0, 4, 9, -1, 2] }), 0)).toEqual([2]);
    expect(citationsForParagraph(post({ 0: [1.5, Number.NaN] }), 0)).toEqual([]);
  });

  it("reports whether a post has any real attribution at all", () => {
    expect(hasParagraphCitations(post())).toBe(false);
    expect(hasParagraphCitations(post({ 0: [] }))).toBe(false);
    expect(hasParagraphCitations(post({ 0: [99] }))).toBe(false);
    expect(hasParagraphCitations(post({ 0: [1] }))).toBe(true);
  });

  /**
   * The regression that matters: no published post may reintroduce a marker on
   * every paragraph. If attribution is ever added, it has to be to specific
   * paragraphs and never to all of them, which is what the old cycle did.
   */
  it("no published post marks every one of its paragraphs", () => {
    for (const p of posts) {
      const marked = p.locales.en.content.filter((_, i) => citationsForParagraph(p, i).length > 0).length;
      expect(marked, `${p.slug} marks all ${marked} paragraphs`).toBeLessThan(p.locales.en.content.length);
    }
  });

  it("no published post cites a reference number it does not have", () => {
    for (const p of posts) {
      for (const [key, value] of Object.entries(p.paragraphCitations || {})) {
        const kept = citationsForParagraph(p, Number(key));
        expect(kept, `${p.slug} paragraph ${key} cites outside 1..${p.references.length}`).toEqual(
          [...new Set(value)].sort((a, b) => a - b)
        );
      }
    }
  });
});
