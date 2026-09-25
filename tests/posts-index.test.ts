import { describe, it, expect } from "vitest";
import { posts } from "@/content/posts";
// @ts-expect-error - plain .mjs script, no types
import { readPostIndex } from "../scripts/lib/posts-index.mjs";

/**
 * scripts/lib/posts-index.mjs reads the guides out of the content files as
 * text, because the weekly-issue script is plain Node and cannot resolve the
 * "@/" alias those files import through. A text parser pointed at a file people
 * edit is only honest if something proves it still agrees with the real module.
 * That is this file: vitest does resolve the alias, so it can import the actual
 * posts array and compare field by field. If a content file is reshaped and the
 * parser silently starts returning eleven guides instead of twenty-four, this
 * fails here rather than in an email that promises a guide nobody wrote.
 */
describe("the weekly issue reads the same guides the site publishes", () => {
  it("finds every published guide, and no extras", async () => {
    const parsed = await readPostIndex();
    expect(parsed.map((p: { slug: string }) => p.slug).sort()).toEqual(posts.map((p) => p.slug).sort());
  });

  it("reads each title and date exactly as the module has it", async () => {
    const parsed: { slug: string; title: string; publishedAt: string }[] = await readPostIndex();
    const real = new Map(posts.map((p) => [p.slug, p]));
    for (const p of parsed) {
      const source = real.get(p.slug);
      expect(source, `parsed a slug the module does not have: ${p.slug}`).toBeTruthy();
      expect(p.title).toBe(source!.title);
      expect(p.publishedAt).toBe(source!.publishedAt);
    }
  });

  // Comparison pages live in the same array shape at the same indentation and
  // also carry a slug. They are not guides and must never be quoted as one.
  it("does not mistake a comparison page for a guide", async () => {
    const parsed = await readPostIndex();
    const slugs = parsed.map((p: { slug: string }) => p.slug);
    expect(slugs).not.toContain("best-cloud-platform-for-student-ai-projects");
    expect(slugs).not.toContain("best-backend-stack-for-ml-student-apps");
    expect(slugs).not.toContain("best-devops-workflow-for-student-engineers");
  });
});
