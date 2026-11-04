import { describe, it, expect } from "vitest";
import { posts, studentStudyTools } from "@/content/posts";
import { newsBriefs } from "@/content/news";
// @ts-expect-error - plain .mjs script, no types
import { citationIndex } from "../scripts/lib/citation-index.mjs";

/**
 * scripts/lib/citation-index.mjs parses the content files as text, because the
 * checker is a plain .mjs script and the content imports through the "@/" alias
 * that node cannot resolve. A parser pointed at a moving file is only safe if
 * something compares it to the real thing, which is what this does: vitest does
 * resolve the alias, so the modules here are what actually ships.
 *
 * The failure this exists to prevent is not a crash. It is the checker quietly
 * finding forty links where the site publishes sixty, and reporting a clean run
 * over the twenty it never looked at.
 */

function externals(hrefs: (string | undefined)[]): string[] {
  return hrefs.filter((href): href is string => typeof href === "string" && /^https?:\/\//.test(href));
}

describe("citation index", () => {
  it("finds every external link the content modules actually carry", async () => {
    const expected = new Set(
      externals([
        ...posts.flatMap((post) => post.references.map((reference) => reference.href)),
        // recommendedTools carry affiliateHref, which comes from the
        // environment rather than the content file; verify:affiliates checks
        // those five. The comparison pages cite nothing.
        ...studentStudyTools.map((tool) => tool.href),
        ...newsBriefs.map((brief) => brief.source?.href)
      ])
    );

    const found = new Set<string>((await citationIndex()).map((entry: { href: string }) => entry.href));

    // Named so a failure says which direction it drifted.
    const missedByParser = [...expected].filter((href) => !found.has(href));
    const inventedByParser = [...found].filter((href) => !expected.has(href));

    expect(missedByParser).toEqual([]);
    expect(inventedByParser).toEqual([]);
  });

  it("attributes every link to something a person can go and look at", async () => {
    const entries = (await citationIndex()) as { owner: string; kind: string; href: string }[];
    expect(entries.length).toBeGreaterThan(100);
    for (const entry of entries) {
      expect(entry.owner, entry.href).toBeTruthy();
      expect(["citation", "tool"]).toContain(entry.kind);
    }
  });

  it("separates a cited source from a tool the site recommends", async () => {
    const entries = (await citationIndex()) as { kind: string; href: string }[];
    const toolHrefs = new Set(externals(studentStudyTools.map((tool) => tool.href)));
    for (const entry of entries) {
      if (toolHrefs.has(entry.href)) expect(entry.kind).toBe("tool");
    }
    // A tool link failing is a broken recommendation; a citation failing is an
    // unsupported claim. The report says which, so the kinds must not blur.
    expect(entries.some((entry) => entry.kind === "citation")).toBe(true);
    expect(entries.some((entry) => entry.kind === "tool")).toBe(true);
  });
});
