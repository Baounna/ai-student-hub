import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { recommendedTools } from "@/content/posts";

/**
 * /resources offered three "recommended stacks" that were three subsets of the
 * same three tools.
 *
 * recommendedTools is [DigitalOcean, Coursera, Grammarly]. The cards resolved
 * to DigitalOcean + Coursera, DigitalOcean + Grammarly, and all three, and each
 * carried a distinct purpose claim: "Minimum viable stack to ship your first
 * deployed AI project" over one host and a course platform, "Balanced for
 * technical execution and stronger career signal" over those two and a grammar
 * checker. The claims were the only thing telling the cards apart, and a reader
 * who knows the three tools can see that.
 *
 * The framing is gone and the tool cards speak for themselves. With it went the
 * `??` fallbacks -- "Cloud Deploy Stack", "AI Learning Platform", "Student
 * Productivity Workspace" -- the invented product names src/content/posts.ts
 * documents removing as names that told a reader nothing. They were
 * unreachable, all three tools exist, and these were the last copies.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("the recommended stacks on /resources", () => {
  const source = readFileSync(path.join(process.cwd(), "src/app/[lang]/resources/page.tsx"), "utf8");
  const code = withoutComments(source);

  it("no longer groups three tools into three stacks", () => {
    expect(code).not.toContain("stackCards");
    expect(code).not.toMatch(/Recommended stacks|Stacks recommandées/);
    expect(code).not.toMatch(/Starter Stack|Portfolio Stack|Interview-Ready Stack/);
  });

  it("carries none of the invented product names", () => {
    for (const invented of ["Cloud Deploy Stack", "AI Learning Platform", "Student Productivity Workspace"]) {
      expect(code, `${invented} is back on /resources`).not.toContain(invented);
    }
  });

  it("still shows every tool, with its own description beside it", () => {
    // The list the stacks were subsets of is the honest version of them.
    expect(code).toContain("recommendedTools.map");
    expect(code).toContain("tool.summary[locale]");
    expect(code).toContain("tool.benefit[locale]");
    expect(recommendedTools.length).toBeGreaterThan(0);
  });

  it("shares with its language on it", () => {
    // Next merges metadata one top-level field at a time, so this page's own
    // openGraph replaced the root layout's and took og:locale and og:site_name
    // with it: /fr/resources shared to LinkedIn with nothing saying it is in
    // French. Spread first, so the page's own values still win.
    expect(code).toMatch(/openGraph:\s*\{\s*\.\.\.openGraphDefaults\(/);
  });
});
