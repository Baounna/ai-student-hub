import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
// @ts-expect-error - plain .mjs script, no types
import { editorialAgeVerdict, newsletterCadenceVerdict } from "../scripts/watchdog.mjs";

/**
 * Two things rot while nobody is looking, and neither used to be watched.
 *
 * Every page carries "At most one email a week" over a signup form, and
 * drafts/.last-issue.json has said `sentAt: null` since it was reset: no issue
 * has ever been sent. And the newest hand-written content on 2026-11-08 was a
 * blog post from 2026-09-19 and nine news briefs from February 2026, under
 * headings reading "Latest AI + Cybersecurity articles".
 *
 * The automated half of the site refreshes twice a day and hides both, which is
 * why each needs its own check.
 */
const NOW = Date.parse("2026-11-08T12:00:00Z");
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(NOW - n * DAY).toISOString();

describe("newsletterCadenceVerdict", () => {
  it("says plainly that nothing has ever been sent", () => {
    const v = newsletterCadenceVerdict(null, "drafts/issue-2026-11-08.html", NOW, 14);
    expect(v.detail).toContain("no issue has ever been sent");
    // Advisory, not failing: a person has not done something only a person can
    // do. Nothing is broken.
    expect(v.ok).toBe(true);
    expect(v.advisory).toBe(true);
  });

  it("names the draft that is waiting, so the fix is one paste", () => {
    expect(newsletterCadenceVerdict(null, "drafts/issue-2026-11-08.html", NOW, 14).detail).toContain(
      "drafts/issue-2026-11-08.html"
    );
    expect(newsletterCadenceVerdict(null, "", NOW, 14).detail).toContain("no draft is waiting");
  });

  it("stays quiet while the promised cadence is being kept", () => {
    const v = newsletterCadenceVerdict(daysAgo(5), "", NOW, 14);
    expect(v.advisory).toBe(false);
    expect(v.detail).toContain("5d ago");
  });

  it("speaks up once the site's promise has outrun the record", () => {
    const v = newsletterCadenceVerdict(daysAgo(40), "drafts/issue-2026-11-08.html", NOW, 14);
    expect(v.advisory).toBe(true);
    expect(v.detail).toContain("promises one a week");
  });

  it("treats an unreadable date as never sent, not as recently sent", () => {
    expect(newsletterCadenceVerdict("not a date", "", NOW, 14).detail).toContain("no issue has ever been sent");
  });
});

describe("editorialAgeVerdict", () => {
  const entry = (label: string, days: number) => ({ label, date: daysAgo(days) });

  it("is quiet when something was published recently", () => {
    const v = editorialAgeVerdict([entry("blog", 10), entry("briefs", 20)], NOW, 60, 120);
    expect(v.ok).toBe(true);
    expect(v.advisory).toBe(false);
  });

  it("raises the oldest stream, not the newest", () => {
    // The real shape: an active blog beside briefs frozen in February.
    const v = editorialAgeVerdict([entry("blog", 50), entry("briefs", 262)], NOW, 60, 120);
    expect(v.ok).toBe(false);
    expect(v.detail).toContain("briefs 262d");
    // Worst first, so the named stream is the one to act on.
    expect(v.detail.indexOf("briefs")).toBeLessThan(v.detail.indexOf("blog"));
  });

  it("warns before it fails", () => {
    const v = editorialAgeVerdict([entry("blog", 90)], NOW, 60, 120);
    expect(v.ok).toBe(true);
    expect(v.advisory).toBe(true);
  });

  it("never reports unreadable dates as healthy", () => {
    // Absence of evidence is not evidence, as this file insists elsewhere.
    const v = editorialAgeVerdict([{ label: "blog", date: "" }], NOW, 60, 120);
    expect(v.advisory).toBe(true);
    expect(v.detail).toContain("no dated article");
    expect(editorialAgeVerdict([], NOW, 60, 120).advisory).toBe(true);
  });
});

describe("both checks run in the daily job", () => {
  it("is wired in, not merely defined", () => {
    // A check nobody calls is the failure this whole file exists to prevent.
    const script = readFileSync("scripts/watchdog.mjs", "utf8");
    expect(script).toMatch(/await checkNewsletterCadence\(\);/);
    expect(script).toMatch(/await checkEditorialAge\(\);/);
  });

  it("reads the real date format the content files use", () => {
    // The check scrapes publishedAt literals; if that spelling changes, it
    // silently finds nothing and reports "no dated article" forever.
    const posts = readFileSync("src/content/posts.ts", "utf8");
    expect(posts).toMatch(/publishedAt:\s*"\d{4}-\d{2}-\d{2}"/);
  });
});
