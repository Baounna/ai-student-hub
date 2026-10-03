import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { isKnownOgTitle } from "@/lib/og-titles";

/**
 * Six pages shared as a generic brand card and six more as a blank one, and
 * nothing failed — /api/og answers an unknown title with a 308 to the untitled
 * card, which is the right behaviour for a reader and completely silent to a
 * build.
 *
 * Both halves of that failure are the same shape: a page whose title lives as a
 * plain string inside its own module, where src/lib/og-titles.ts cannot see it.
 * /stages and /compare hit it first; /news/live, /donate and the career guide
 * hit it next; the three legal pages had no image at all.
 *
 * So this reads the page modules the way the bug does, rather than trusting a
 * list someone remembered to update.
 */
function pageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...pageFiles(full));
    else if (entry === "page.tsx") out.push(full);
  }
  return out;
}

describe("social preview coverage", () => {
  const files = pageFiles("src/app/[lang]");

  it("every page that sets a literal metadata title can render an image for it", () => {
    const unrenderable: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      // `const title = fr ? "..." : "..."` and `title: "..."` inside metadata.
      for (const m of source.matchAll(/const title = (?:fr|locale === "fr") \? "([^"]+)" : "([^"]+)"/g)) {
        for (const candidate of [m[1], m[2]]) {
          if (!isKnownOgTitle(candidate)) unrenderable.push(`${file}: "${candidate}"`);
        }
      }
    }

    expect(unrenderable).toEqual([]);
  });

  it("every page under [lang] declares an og:image", () => {
    // A page with openGraph but no images inherits nothing — Next merges per
    // top-level field, so the parent's images do not fill the gap.
    const missing: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      if (!source.includes("openGraph")) continue;
      const block = source.slice(source.indexOf("openGraph"));
      const end = block.indexOf("twitter");
      if (!block.slice(0, end > 0 ? end : 600).includes("images")) missing.push(file);
    }

    expect(missing).toEqual([]);
  });
});
