import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { categoryName } from "@/lib/categories";
import { getAllCategories } from "@/content/posts";

/**
 * The French names for the eight categories have existed since the typeahead
 * needed them, and the category PAGE used them — its H1 and breadcrumb said
 * "Systèmes LLM". Every card on that same page said "LLM Systems". One
 * category, two languages, one viewport, because fourteen render sites
 * interpolated the raw value instead of calling categoryName.
 */
function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full));
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("category labels", () => {
  it("has a French name for every category in the content", () => {
    const untranslated = getAllCategories().filter((category) => {
      const fr = categoryName(category, "fr");
      // Cloud/DevOps is genuinely written the same way in French.
      return fr === category && category !== "Cloud/DevOps";
    });

    expect(untranslated).toEqual([]);
  });

  it("is never interpolated raw into a rendered page", () => {
    // Guards the shape of the bug rather than one instance of it: a bare
    // {something.category} in JSX is a label that will be English on /fr.
    const offenders: string[] = [];
    for (const file of tsxFiles("src/app")) {
      const source = readFileSync(file, "utf8");
      source.split("\n").forEach((line, index) => {
        // Only the blog taxonomy. `params.category` is a URL segment, and the
        // automated tools feed carries its own machine-generated categories
        // ("AI Platform", "Developer Platform") that FRENCH_NAMES does not
        // cover and that are not this map's to translate.
        if (!/\{\s*(?:post|featuredPost|candidate|brief)\.category\s*\}/.test(line)) return;
        if (line.includes("categoryName")) return;
        offenders.push(`${file}:${index + 1}`);
      });
    }

    expect(offenders).toEqual([]);
  });
});
