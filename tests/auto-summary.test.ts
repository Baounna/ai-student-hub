import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { isUsableSummary, usableSummary, usableTitle, decodeEntities } from "@/lib/auto-summary";
import { getAutoNews } from "@/content/auto-news";
import { getAutoTools } from "@/content/auto-tools";
import { locales } from "@/i18n/config";

/**
 * The two JSON files these read are written twice a day by an agent and pushed
 * straight to main with no typecheck, no test and no content gate. The agent
 * builds a summary by taking the markup around a link and deleting the title
 * from it, so what lands in the file is whatever was nearby. The guard that
 * used to exist replaced an EMPTY summary, which let everything else through.
 *
 * The card reading "Title" was the fourth card on /compare.
 *
 * These assert the rendered output, not the JSON — the JSON is machine-owned
 * and hand-editing it would be overwritten by the next run.
 */
describe("the quality gate on machine-written text", () => {
  it("rejects the junk that is actually in those files", () => {
    // Every one of these is a real value from auto-tools.json or auto-news.json.
    expect(isUsableSummary("Title", "Barclays scales Claude")).toBe(false);
    expect(isUsableSummary("Category Title Sep 2", "Some headline")).toBe(false);
    expect(isUsableSummary('.jpg"/> Matan Kushner, Tom Dale, and 1 other', "x")).toBe(false);
    expect(isUsableSummary("· Changelog", "Sep 23, 2026")).toBe(false);
    expect(isUsableSummary("3.7", "Some release")).toBe(false);
    expect(isUsableSummary("Node.js 22.23.3 (LTS)", "x")).toBe(false);
    expect(isUsableSummary("", "x")).toBe(false);
    expect(isUsableSummary("30 September 30 Sep", "x")).toBe(false);
    // A summary that just repeats the headline tells the reader nothing.
    expect(isUsableSummary("Announcing Rust 1.99.0", "Announcing Rust 1.99.0")).toBe(false);
  });

  it("keeps a real summary untouched", () => {
    const real =
      "Supabase Logs is moving to usage-based pricing. We're announcing early so you have time to adjust.";
    expect(isUsableSummary(real, "Logs usage-based pricing")).toBe(true);
    expect(usableSummary(real, "Logs usage-based pricing", "Supabase", "en")).toBe(real);
  });

  it("falls back to naming the source, which is always true", () => {
    expect(usableSummary("Title", "Barclays scales Claude", "Anthropic News", "en")).toBe(
      "Barclays scales Claude — reported by Anthropic News."
    );
    expect(usableSummary("Title", "Barclays scales Claude", "Anthropic News", "fr")).toBe(
      "Barclays scales Claude — via Anthropic News."
    );
  });

  it("trims a title that swallowed the page header", () => {
    // Three titles in auto-tools.json run past 240 characters because the whole
    // page chrome came with them, contributor byline included.
    const scraped =
      "Vercel Agent now installs private packages from npm and custom registries " +
      "Vercel Agent installs private npm packages using your team's shared environment variables. " +
      "Add NPM_TOKEN or NPM_RC to authenticate with private and custom registries. Matan Kushner, Tom Dale, and 1 other";
    const trimmed = usableTitle(scraped);

    expect(trimmed.length).toBeLessThanOrEqual(141);
    expect(trimmed).not.toContain("and 1 other");
    expect(usableTitle("A normal headline")).toBe("A normal headline");
  });

  it("leaves nothing junk-looking on any rendered card", () => {
    const problems: string[] = [];
    for (const locale of locales) {
      for (const item of [...getAutoNews(locale, 500), ...getAutoTools(locale, 500)]) {
        const summary = item.summary ?? "";
        if (!summary.trim()) problems.push(`${item.slug}: empty summary`);
        if (/[<>]|&[a-z]+;|\.jpg"/i.test(summary)) problems.push(`${item.slug}: markup in summary`);
        if (summary.trim().toLowerCase() === "title") problems.push(`${item.slug}: literal "Title"`);
        if (summary.trim().toLowerCase() === item.title.trim().toLowerCase()) {
          problems.push(`${item.slug}: summary repeats the title`);
        }
        if (item.title.length > 141) problems.push(`${item.slug}: title ${item.title.length} chars`);
      }
    }

    expect(problems).toEqual([]);
  });
});

describe("HTML entities from a feed", () => {
  /**
   * A Hugging Face title arrived as "The model that didn&apos;t exist" and
   * reached the live news page with the escape intact, so a reader saw the
   * literal characters. It also defeated the gate twice over: the entity WAS
   * the markup the gate rejects, and the fallback it fell back to was built
   * from the same undecoded title, so rejecting the summary produced a new
   * string carrying the same escape.
   */
  it("decodes an escape before a reader ever sees it", () => {
    expect(decodeEntities("didn&apos;t")).toBe("didn't");
    expect(decodeEntities("A &amp; B")).toBe("A & B");
    expect(decodeEntities("&#39;quoted&#39;")).toBe("'quoted'");
    expect(decodeEntities("&#x27;hex&#x27;")).toBe("'hex'");
    // Double-escaped, which is how this one arrived.
    expect(decodeEntities("didn&amp;apos;t")).toBe("didn't");
  });

  it("does not let the fallback reintroduce what the gate removed", () => {
    const out = usableSummary("", "The model that didn&apos;t exist", "Hugging Face Blog", "en");
    expect(out).not.toMatch(/&[a-z]+;/i);
    expect(out).toContain("didn't");
  });

  it("leaves ordinary text alone", () => {
    expect(decodeEntities("A normal headline")).toBe("A normal headline");
    expect(decodeEntities("")).toBe("");
  });

  it("decodes at ingestion too, so nothing new is written with one", () => {
    const agent = readFileSync("scripts/auto-news-agent.mjs", "utf8");
    expect(agent).toContain("decodeEntities");
  });
});
