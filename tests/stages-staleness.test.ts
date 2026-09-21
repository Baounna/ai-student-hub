import { describe, it, expect, vi } from "vitest";

/**
 * The stale banner and the "last checked" headline are the page's whole claim
 * to honesty, and they were reading two different clocks.
 *
 * updatedAt moves whenever anything writes stages.json — `npm run add:stage`
 * re-stamps it on every single entry added. checkedAt moves only when a link
 * was actually opened and found alive. This fixture is the ordinary
 * maintenance week that separates them: an entry was added today, and nothing
 * has been re-verified since June.
 *
 * Mocked at the JSON module, because the real file's two dates sit a day apart
 * and cannot demonstrate a divergence of months.
 */
vi.mock("@/content/stages.json", () => ({
  default: {
    version: 1,
    updatedAt: "2026-09-21T12:00:00.000Z",
    items: [
      {
        id: "acme-stage-pfe-rabat-rolling",
        role: "Stage PFE",
        company: "Acme",
        city: "Rabat",
        country: "MA",
        kind: "pfe",
        href: "https://example.com/jobs/1",
        checkedAt: "2026-06-01"
      }
    ]
  }
}));

const NOW = Date.parse("2026-09-21T12:00:00.000Z");

describe("the stale banner", () => {
  it("fires on unchecked links even when the file was written today", async () => {
    const { getStagesAgeDays, getStagesCheckedAgeDays, isStagesListStale, STALE_AFTER_DAYS } =
      await import("@/content/stages");

    // The file itself is brand new...
    expect(getStagesAgeDays(NOW)).toBe(0);
    // ...but nothing on it has been verified in over three months, and that is
    // the number the page already prints to the reader.
    expect(getStagesCheckedAgeDays(NOW)).toBeGreaterThan(STALE_AFTER_DAYS);

    // Keying the banner on updatedAt meant the page printed "Last checked: 112
    // days ago" directly above no warning at all.
    expect(isStagesListStale(NOW)).toBe(true);
  });

  it("stays quiet while the links really have been checked recently", async () => {
    const { isStagesListStale, getStagesLastCheckedAt, STALE_AFTER_DAYS } = await import("@/content/stages");
    const checkedAt = Date.parse(`${getStagesLastCheckedAt()}T12:00:00Z`);

    expect(isStagesListStale(checkedAt + STALE_AFTER_DAYS * 86_400_000)).toBe(false);
    expect(isStagesListStale(checkedAt + (STALE_AFTER_DAYS + 1) * 86_400_000)).toBe(true);
  });
});
