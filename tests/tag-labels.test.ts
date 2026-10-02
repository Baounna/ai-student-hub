import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { tagLabel } from "@/lib/tags";
import { getAllTags, studentStudyTools } from "@/content/posts";
import { newsBriefs } from "@/content/news";

/**
 * Every tag chip on the site was the raw slug, so /fr/blog, /fr/news, every
 * French article and every /fr/blog/tag/* page read "# research #
 * reproducibility # vulnerabilities" under French headings — and /fr/compare's
 * tool cards read "# notes # pdf # summary # revision".
 *
 * The slug stays English because it is also the URL, exactly as with categories
 * and news topics; only the chip is translated.
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

describe("tag labels", () => {
  const allTags = [
    ...getAllTags(),
    ...newsBriefs.flatMap((brief) => brief.tags),
    ...studentStudyTools.flatMap((tool) => tool.keywords.slice(0, 4))
  ];

  it("has a French label for every tag the site renders", () => {
    // A tag whose French form is identical is still listed in the map, so this
    // only fires for one nobody has looked at.
    const missing = [...new Set(allTags)].filter((tag) => tagLabel(tag, "fr") === tag && !isSameInFrench(tag));

    expect(missing).toEqual([]);
  });

  function isSameInFrench(tag: string) {
    return [
      "agents", "architecture", "backend", "benchmarks", "devops", "edge", "fastapi", "http",
      "kubernetes", "linux", "llm", "mlops", "multimodal", "performance", "portfolio", "postgres",
      "rag", "transformers", "vision", "deep-learning", "machine learning", "machine-learning",
      "ml", "open-source", "ci", "code", "documentation", "images", "markdown", "notes", "pdf",
      "quiz", "sources", "citation", "citations", "questions", "certification", "emails"
    ].includes(tag);
  }

  it("leaves the English chips alone", () => {
    for (const tag of [...new Set(allTags)]) {
      expect(tagLabel(tag, "en")).toBe(tag);
    }
  });

  it("passes an unknown tag through rather than blanking it", () => {
    expect(tagLabel("some-new-tag", "fr")).toBe("some-new-tag");
    expect(tagLabel("", "fr")).toBe("");
  });

  it("is never rendered raw in JSX", () => {
    const offenders: string[] = [];
    for (const file of tsxFiles("src/app")) {
      readFileSync(file, "utf8").split("\n").forEach((line, index) => {
        if (!/^\s*#\{\s*(?:tag|keyword)\s*\}\s*$/.test(line)) return;
        offenders.push(`${file}:${index + 1}`);
      });
    }

    expect(offenders).toEqual([]);
  });
});
