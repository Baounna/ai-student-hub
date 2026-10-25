import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The 480 auto-brief pages claimed to have written other outlets' reporting.
 *
 * Each one emitted NewsArticle JSON-LD with `headline: item.title` -- the
 * source outlet's headline, word for word -- `datePublished: item.publishedAt`,
 * the moment that outlet published, `dateModified: item.discoveredAt`, the
 * moment our crawler first saw it, typed as an edit to an article we never
 * wrote, and `author` and `publisher` both naming this site. A machine reads
 * that literally: AI and Cybersecurity News published AWS's article, at AWS's
 * publication time, under AWS's headline. It is a byline over somebody else's
 * work on seventy percent of the site's URLs, and this publication's entire
 * product is that its provenance is honest.
 *
 * robots noindex kept it out of Google, which is not the same as it not being
 * served: the markup went out on every request and any non-Google consumer read
 * it. So the block is gone. These hold it gone, and hold the visible provenance
 * that replaces it in place.
 */
/**
 * Asserted against the code, not the comments.
 *
 * The comment where the deleted block used to be names every field it got
 * wrong, so a plain search of the file finds "NewsArticle" and "dateModified"
 * in the prose explaining why they are gone.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("what the auto briefs claim to have written", () => {
  const file = path.join(process.cwd(), "src/app/[lang]/news/auto/[slug]/page.tsx");
  const source = readFileSync(file, "utf8");
  const code = withoutComments(source);

  it("emits no JSON-LD at all", () => {
    expect(code).not.toContain("application/ld+json");
    expect(code).not.toContain("@context");
  });

  it("names neither an author nor a publisher for someone else's reporting", () => {
    for (const claim of ["organizationAuthorNode", "publisherNode", "author:", "publisher:"]) {
      expect(code, `the auto brief asserts ${claim} again`).not.toContain(claim);
    }
  });

  it("dates nothing, since neither date on these pages is ours", () => {
    // publishedAt belongs to the source outlet and discoveredAt is when our
    // crawler saw it; as datePublished/dateModified they described an article
    // we wrote and then revised.
    expect(code).not.toMatch(/datePublished|dateModified|NewsArticle|headline:/);
  });

  it("still tells a reader where the brief came from", () => {
    // The markup was redundant, not load-bearing: the page says the source's
    // name, links the original, says the brief is generated from it, and lists
    // both references. If that ever goes, the deletion above stops being free.
    expect(source).toContain("item.source");
    expect(source).toContain("item.href");
    expect(source).toContain("item.sourceFeed");
    expect(source).toMatch(/Primary source/);
    expect(source).toMatch(/automatically generated from an official source/);
  });

  it("stays out of the index, which is why no markup is owed", () => {
    expect(source).toMatch(/robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);
  });
});
