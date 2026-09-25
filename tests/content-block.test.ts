import { describe, it, expect } from "vitest";
import { parseContentBlock, proseOnly } from "@/lib/content-block";
import { posts } from "@/content/posts";

describe("content blocks", () => {
  it("leaves an ordinary paragraph alone", () => {
    const p = "The first time a model returns 0.99 it feels like the project worked.";
    expect(parseContentBlock(p)).toEqual({ kind: "text", text: p });
  });

  it("reads a fenced block and its language", () => {
    const block = parseContentBlock("```bash\npython3 bench.py\n```");
    expect(block).toEqual({ kind: "code", code: "python3 bench.py", lang: "bash" });
  });

  it("keeps indentation inside the block, which is the whole point for Python", () => {
    const block = parseContentBlock("```python\nfor i in range(3):\n    print(i)\n```");
    expect(block.kind).toBe("code");
    if (block.kind === "code") expect(block.code).toBe("for i in range(3):\n    print(i)");
  });

  it("handles a block with no language tag", () => {
    const block = parseContentBlock("```\nplain\n```");
    expect(block).toEqual({ kind: "code", code: "plain", lang: "" });
  });

  it("handles a missing closing fence rather than losing the content", () => {
    const block = parseContentBlock("```sh\nnpm run build");
    expect(block).toEqual({ kind: "code", code: "npm run build", lang: "sh" });
  });

  // A language tag becomes a class name, so it cannot be arbitrary content.
  it("rejects a language tag that is not a plain token", () => {
    const block = parseContentBlock('```js" onload="alert(1)\ncode\n```');
    expect(block.kind).toBe("code");
    if (block.kind === "code") expect(block.lang).toBe("");
  });

  // Degenerate fences must stay prose: an empty box where a sentence belonged
  // is worse than a paragraph that happens to start with backticks.
  it("treats a fence with no body as text", () => {
    expect(parseContentBlock("```bash").kind).toBe("text");
    expect(parseContentBlock("```\n\n```").kind).toBe("text");
  });

  it("separates prose from code for read-time counting", () => {
    expect(proseOnly(["one", "```sh\nls\n```", "two"])).toEqual(["one", "two"]);
  });

  /**
   * The published content must keep parsing as prose until code is deliberately
   * added: paragraphCitations maps by index, so a paragraph silently becoming a
   * code block would move every marker after it.
   */
  it("does not reclassify any existing published paragraph by accident", () => {
    for (const p of posts) {
      for (const locale of ["en", "fr"] as const) {
        const content = p.locales[locale].content;
        content.forEach((entry, i) => {
          const block = parseContentBlock(entry);
          if (block.kind === "code") {
            // Allowed, but it must be code in BOTH locales or the indices diverge.
            const other = locale === "en" ? "fr" : "en";
            expect(
              parseContentBlock(p.locales[other].content[i]).kind,
              `${p.slug} paragraph ${i} is code in ${locale} but not in ${other}`
            ).toBe("code");
          }
        });
      }
    }
  });
});
