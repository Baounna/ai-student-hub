import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Every section a reader might type or paste needs a short URL.
 *
 * The localized routes live under /[lang]/…, so bare /stages is a separate
 * route that has to exist on purpose. Six sections had a stub; /stages and
 * /news did not, and both were plain 404s — /stages being the obvious URL for
 * the part of the site most worth linking to, and the one someone would paste
 * into a message. Nothing caught it because the localized route worked
 * perfectly and nobody types the locale.
 *
 * Exempt, deliberately: the legal pages. Nobody links to /privacy by hand, and
 * the footer links are already locale-correct. If that judgement changes, add
 * the stubs rather than loosening this list.
 */
const EXEMPT = new Set(["privacy", "terms", "affiliate-disclosure"]);

const localizedSections = readdirSync("src/app/[lang]")
  .filter((name) => !name.startsWith("[") && !name.startsWith("."))
  .filter((name) => statSync(path.join("src/app/[lang]", name)).isDirectory())
  .filter((name) => existsSync(path.join("src/app/[lang]", name, "page.tsx")));

describe("short URL stubs", () => {
  it("finds the localized sections, so the check is not vacuous", () => {
    expect(localizedSections.length).toBeGreaterThanOrEqual(8);
    expect(localizedSections).toContain("stages");
  });

  it.each(localizedSections.filter((s) => !EXEMPT.has(s)))(
    "/%s resolves instead of 404ing",
    (section) => {
      expect(existsSync(path.join("src/app", section, "page.tsx"))).toBe(true);
    }
  );

  it("picks the locale from the request rather than hardcoding one", () => {
    // A hardcoded /en sent a French reader into the wrong edition; the comment
    // in src/app/about/page.tsx records that being fixed once already.
    const offenders = localizedSections
      .filter((section) => existsSync(path.join("src/app", section, "page.tsx")))
      .filter((section) => {
        const source = readFileSync(path.join("src/app", section, "page.tsx"), "utf8");
        return !source.includes("preferredLocale");
      });
    expect(offenders).toEqual([]);
  });
});
