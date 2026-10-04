import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { isRecentlyAdded, RECENTLY_ADDED_DAYS, getStages } from "@/content/stages";

/**
 * postedAt records when a listing was added to this board, not when the
 * employer published it — the field's own comment says so. Anything built on it
 * has to say "added", because telling a student a role was posted on a date we
 * actually imported it would be exactly the kind of small untruth this site
 * spent a fortnight removing.
 */
const NOW = new Date("2026-10-04T12:00:00Z");

describe("isRecentlyAdded", () => {
  it("counts a listing added inside the window", () => {
    expect(isRecentlyAdded({ postedAt: "2026-10-01" } as never, NOW)).toBe(true);
    expect(isRecentlyAdded({ postedAt: "2026-10-04" } as never, NOW)).toBe(true);
  });

  it("does not count one added before it", () => {
    expect(isRecentlyAdded({ postedAt: "2026-09-20" } as never, NOW)).toBe(false);
  });

  it("treats the boundary as inside", () => {
    const boundary = new Date(NOW.getTime() - RECENTLY_ADDED_DAYS * 86_400_000);
    expect(isRecentlyAdded({ postedAt: boundary.toISOString().slice(0, 10) } as never, NOW)).toBe(true);
  });

  it("refuses a future date rather than calling it new", () => {
    // A clock skew or a typo must not promote a listing.
    expect(isRecentlyAdded({ postedAt: "2026-12-01" } as never, NOW)).toBe(false);
  });

  it("says no when there is no date at all", () => {
    expect(isRecentlyAdded({} as never, NOW)).toBe(false);
    expect(isRecentlyAdded({ postedAt: "" } as never, NOW)).toBe(false);
    expect(isRecentlyAdded({ postedAt: "not-a-date" } as never, NOW)).toBe(false);
  });

  it("matches the real board", () => {
    // Every listing carries the field, so this is a real count, not a sample.
    const stages = getStages();
    expect(stages.every((s) => s.postedAt)).toBe(true);
    const recent = stages.filter((s) => isRecentlyAdded(s, NOW));
    expect(recent.length).toBeGreaterThan(0);
    expect(recent.length).toBeLessThan(stages.length);
  });
});

describe("the wording on /stages", () => {
  const source = readFileSync(new URL("../src/app/[lang]/stages/page.tsx", import.meta.url), "utf8");
  // Comments discuss the words we chose not to use, so they have to come out
  // before asking whether the page says them. Without this the file's own
  // explanation of why it avoids "Posted" fails the test that enforces it.
  const prose = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  it("never calls the import date a posting date", () => {
    // The chip and the badge describe postedAt. "Posted 2 days ago" would be a
    // claim about the employer that this data cannot support; "Added" and
    // "New here" are claims about this board, which it can.
    for (const label of ["filterAdded", "filterRecent", "recentBadge"]) {
      expect(source).toContain(label);
    }
    expect(prose).not.toMatch(/\b(Posted|Publiée? le|Posté)\b/);
  });

  it("keeps the badge off closed rows", () => {
    expect(source).toContain("!closed && isRecentlyAdded(stage)");
  });
});
