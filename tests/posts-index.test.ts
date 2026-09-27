import { afterAll, describe, it, expect } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
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

/**
 * The other half of the same contract: what scripts/new-post.mjs writes has to
 * be what this reads back. It was not. The writer escapes a title with
 * JSON.stringify, and the reader only undid \" and \\, so a title containing a
 * newline came back with a literal backslash-n in it and went out in an email
 * subject that way. Worse, JSON.stringify leaves U+2028 raw, and the reader
 * matches fields with ".", which does not match a line terminator -- so such a
 * title matched nothing, the entry failed the "has a title" filter, and the
 * guide vanished from the newsletter with no error anywhere.
 */
describe("what the scaffolder writes is what the issue reads", () => {
  const scratch: string[] = [];

  afterAll(async () => {
    await Promise.all(scratch.map((dir) => fs.rm(dir, { recursive: true, force: true })));
  });

  // The scaffolder's own escaping, kept in step by the cases below.
  const js = (value: string) =>
    JSON.stringify(value).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

  async function indexOf(title: string) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "posts-index-"));
    scratch.push(dir);
    await fs.mkdir(path.join(dir, "src/content"), { recursive: true });
    const entry = `const basePosts: BlogPost[] = [
  {
    slug: "scratch-guide",
    title: ${js(title)},
    publishedAt: "2026-09-27",
  },
];
`;
    await fs.writeFile(path.join(dir, "src/content/posts.ts"), entry);
    await fs.writeFile(path.join(dir, "src/content/posts-cs.ts"), "const csPosts = [];\n");
    return readPostIndex(dir);
  }

  it.each([
    ["a plain title", "How to Read a CVE"],
    ["a quote and a backslash", 'The "safe" path C:\\tmp'],
    ["a trailing backslash", "Escaping in TypeScript \\"],
    ["a newline", "Line one\nLine two"],
    ["a tab", "Tab\there"],
    ["a line separator", "Sep\u2028here"],
    ["a paragraph separator", "Sep\u2029here"],
    ["an apostrophe", "Don't panic"],
    ["accented French", "Lire un CVE sans paniquer \u2014 s\u00e9v\u00e9rit\u00e9"]
  ])("round-trips %s", async (_label, title) => {
    const parsed = await indexOf(title);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe(title);
  });
});
