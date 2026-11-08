import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { contentAgeDays, EDITORIAL_STALE_AFTER_DAYS, isEditorialStale, newestPublishedAt } from "@/lib/content-age";
import { getLocalizedNews } from "@/content/news";
import { getLocalizedPosts } from "@/content/posts";

/**
 * The board already refuses to go quietly out of date; the writing did not.
 *
 * /stages prints "This list has not been checked recently" past
 * STALE_AFTER_DAYS. /news and /blog had no equivalent, and they are the part
 * of the site that actually stops moving -- listings and web signals refresh
 * twice a day, which disguises it. On 2026-11-08 the news page carried nine
 * briefs dated February 2026 under a heading reading "Actualités récentes".
 */
const NOW = Date.parse("2026-11-08T12:00:00Z");
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(NOW - n * DAY).toISOString().slice(0, 10);

describe("editorial staleness", () => {
  it("stays silent while the content is current", () => {
    expect(isEditorialStale(daysAgo(10), NOW)).toBe(false);
    expect(isEditorialStale(daysAgo(EDITORIAL_STALE_AFTER_DAYS - 1), NOW)).toBe(false);
  });

  it("speaks at the threshold, not a day later", () => {
    expect(isEditorialStale(daysAgo(EDITORIAL_STALE_AFTER_DAYS), NOW)).toBe(true);
  });

  it("treats a date it cannot read as unknown age, never as today", () => {
    // Infinity rather than 0: content with no readable date must trip the
    // notice, not silently claim to be published this morning.
    expect(contentAgeDays("", NOW)).toBe(Number.POSITIVE_INFINITY);
    expect(contentAgeDays("not a date", NOW)).toBe(Number.POSITIVE_INFINITY);
    expect(isEditorialStale("", NOW)).toBe(true);
  });

  it("anchors a bare date at noon, like the board does", () => {
    // A YYYY-MM-DD parsed as midnight UTC drifts by a day for readers west of
    // it; getStagesCheckedAgeDays carries the same fix and the same comment.
    expect(contentAgeDays("2026-11-07", NOW)).toBe(1);
  });

  it("takes the newest item, not the first in the array", () => {
    // The blog list is in array order, not date order, so first-is-newest
    // would have reported the wrong age on exactly the page that needed it.
    expect(
      newestPublishedAt([{ publishedAt: "2026-02-08" }, { publishedAt: "2026-09-19" }, { publishedAt: "2026-02-20" }])
    ).toBe("2026-09-19");
    expect(newestPublishedAt([])).toBe("");
    expect(newestPublishedAt([{ publishedAt: "nonsense" }])).toBe("");
  });

  it("would fire on the real briefs today, which is why it exists", () => {
    // Guards against the notice being wired to a list that never goes stale.
    const briefs = getLocalizedNews("fr");
    expect(briefs.length).toBeGreaterThan(0);
    expect(newestPublishedAt(briefs)).not.toBe("");
    expect(isEditorialStale(newestPublishedAt(briefs), NOW)).toBe(true);
  });

  it("reads the real posts list without throwing", () => {
    const posts = getLocalizedPosts("fr");
    expect(posts.length).toBeGreaterThan(0);
    expect(newestPublishedAt(posts)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("is rendered on both pages, not merely written", () => {
    for (const page of ["src/app/[lang]/news/page.tsx", "src/app/[lang]/blog/page.tsx"]) {
      expect(readFileSync(page, "utf8"), page).toMatch(/<ContentAgeNotice\s/);
    }
  });

  it("uses a heading, so a screen reader skimming by headings meets it", () => {
    // The board's warning was once styled to look like a heading without being
    // one, and heading navigation jumped straight past it to the rows.
    expect(readFileSync("src/components/content-age-notice.tsx", "utf8")).toMatch(/<h2 /);
  });
});
