import { describe, it, expect, vi } from "vitest";

/**
 * getStagesLastCheckedAt falls back to the file's updatedAt when no entry
 * carries a checkedAt of its own — and updatedAt is a full ISO timestamp, not a
 * bare YYYY-MM-DD day. The caller appended "T12:00:00Z" to it unconditionally,
 * producing "2026-09-21T12:00:00.000ZT12:00:00Z", which parses to NaN.
 *
 * The age then came back as Infinity, and the page prints that straight into
 * "Last checked: Infinity days ago". It matters more now that the stale banner
 * reads the same number.
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
        href: "https://example.com/jobs/1"
        // no checkedAt
      }
    ]
  }
}));

describe("freshness with no per-entry checks recorded", () => {
  it("falls back to the file's own timestamp instead of reporting Infinity", async () => {
    const { getStagesCheckedAgeDays } = await import("@/content/stages");
    const now = Date.parse("2026-09-24T12:00:00.000Z");

    expect(getStagesCheckedAgeDays(now)).toBe(3);
  });
});
