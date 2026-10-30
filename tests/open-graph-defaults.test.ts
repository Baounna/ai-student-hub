import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Fourteen pages shipped a social card with no og:site_name and no og:locale,
 * and nothing failed.
 *
 * Next merges metadata one top-level field at a time: "Duplicate keys are
 * replaced based on their ordering" (node_modules/next/dist/docs/01-app/
 * 03-api-reference/04-functions/generate-metadata.md). So the moment a page
 * exports its own `openGraph`, the root layout's is gone -- not merged into,
 * replaced -- and with it the two fields only the layout was carrying. The
 * visible cost was French: /fr/about, /fr/news and all seven /fr/compare pages
 * shared to LinkedIn and Facebook announcing themselves as the site's default
 * language, which is the opposite of the point of publishing in two.
 *
 * src/i18n/helpers.ts exports openGraphDefaults(locale) for exactly this, so
 * the fix on each page is one spread as the first key of its own openGraph.
 * This test is what stops the fourteenth page: a new page that sets openGraph
 * and forgets the spread fails here, at the only moment anyone is looking.
 *
 * If this fails on a page you just wrote, add `...openGraphDefaults(locale)` as
 * the FIRST key of its openGraph object -- first, so the page's own title,
 * description, url and images still win over the defaults.
 */

function pageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...pageFiles(full));
    else if (entry.name === "page.tsx") out.push(full);
  }
  return out;
}

/**
 * Comments go before anything is matched, and that is load-bearing rather than
 * tidy. The house style quotes code in prose -- several of these pages carry a
 * paragraph with the words `openGraph` and `openGraphDefaults` in it explaining
 * why the spread is there -- so a test reading the raw source would find the
 * name in the explanation of the bug and pass a page that never calls it. Other
 * tests in this repo had that exact false pass.
 *
 * A regex cannot do this: `//` appears inside the feed and source URLs these
 * pages embed as strings, and cutting from there would eat real code. So this
 * walks the characters and skips over string and template literals.
 */
function stripComments(source: string): string {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];

    if (char === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }
    if (char === "/" && next === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      out += char;
      i++;
      while (i < source.length) {
        if (source[i] === "\\") {
          out += source.slice(i, i + 2);
          i += 2;
          continue;
        }
        out += source[i];
        if (source[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    out += char;
    i++;
  }
  return out;
}

describe("Open Graph defaults on every page that sets its own openGraph", () => {
  const files = pageFiles(join("src", "app", "[lang]"));
  const setters = files.filter((file) => stripComments(readFileSync(file, "utf8")).includes("openGraph:"));

  it("found the pages at all, so a bad glob cannot pass this file", () => {
    // All 21 page.tsx under [lang] set their own openGraph today. The floor is
    // loose enough that retiring a few pages is not a failure, and tight enough
    // that a walk matching nothing -- or matching only the eight that were
    // already fixed -- cannot report success.
    expect(setters.length).toBeGreaterThanOrEqual(15);
    expect(files.length).toBeGreaterThanOrEqual(setters.length);
  });

  it("spreads openGraphDefaults, so og:site_name and og:locale survive the merge", () => {
    const missing = setters.filter(
      (file) => !stripComments(readFileSync(file, "utf8")).includes("...openGraphDefaults(")
    );

    expect(missing).toEqual([]);
  });

  it("imports the helper rather than restating the two fields inline", () => {
    // A page that hand-writes siteName/locale drifts from the helper the day
    // the brand name or a locale changes, and nothing would say so.
    const restated: string[] = [];
    for (const file of setters) {
      const code = stripComments(readFileSync(file, "utf8"));
      if (!code.includes('from "@/i18n/helpers"')) restated.push(file);
    }

    expect(restated).toEqual([]);
  });

  it("strips comments before matching, which is the whole reason this is not a grep", () => {
    const quoted = [
      "// a page needs ...openGraphDefaults(locale) spread into openGraph:",
      "/* openGraph: { ...openGraphDefaults(locale) } */",
      'const url = "https://example.com/a//b"; // openGraphDefaults'
    ].join("\n");
    const stripped = stripComments(quoted);

    expect(stripped).not.toContain("openGraphDefaults");
    expect(stripped).not.toContain("openGraph:");
    // The URL is inside a string literal, so none of it is a comment.
    expect(stripped).toContain("https://example.com/a//b");
  });
});
