import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
// @ts-expect-error - plain .mjs script, no types
import { quietNewsSources } from "../scripts/watchdog.mjs";

/**
 * A dead feed used to be invisible.
 *
 * "Content freshness" reads auto-news.json's updatedAt, and that file is
 * rewritten every twelve hours as long as any one of the nineteen sources
 * answers. So seventeen healthy sources kept the timestamp green while a source
 * that had redesigned its HTML sat there contributing nothing -- parsePageItems
 * matches no anchors, returns an empty array, and the run prints success.
 *
 * On 2026-11-08 Anthropic Engineering had produced nothing for 26 days and
 * Kubernetes Blog for 9, against a file updated the previous evening and a
 * watchdog calling content freshness healthy.
 *
 * You cannot make a third party's blog go quiet to prove an alarm works, which
 * is why the judgement is a pure function -- the same reason
 * scheduledWorkflowProblems is one.
 */
const NOW = Date.parse("2026-11-08T12:00:00Z");
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(NOW - n * DAY).toISOString();

const ADVISORY = 10;
const FAIL = 21;
const verdict = (items: unknown[]) => quietNewsSources(items, NOW, ADVISORY, FAIL);

describe("quietNewsSources", () => {
  it("says nothing when every source is producing", () => {
    const result = verdict([
      { source: "Anthropic News", discoveredAt: daysAgo(1) },
      { source: "Cloudflare Blog", discoveredAt: daysAgo(3) }
    ]);
    expect(result.total).toBe(2);
    expect(result.quiet).toEqual([]);
    expect(result.silent).toEqual([]);
  });

  it("catches the source that went quiet while the file stayed fresh", () => {
    // The real shape of the bug: one dead feed, many live ones.
    const items = [
      { source: "Anthropic Engineering", discoveredAt: daysAgo(26) },
      ...Array.from({ length: 17 }, (_, i) => ({ source: `Live ${i}`, discoveredAt: daysAgo(1) }))
    ];
    const result = verdict(items);
    expect(result.total).toBe(18);
    expect(result.quiet.map((q: { source: string }) => q.source)).toEqual(["Anthropic Engineering"]);
    expect(result.silent).toHaveLength(1);
  });

  it("separates a quiet blog from a dead one", () => {
    // A blog that posts monthly is not broken; a check that cries wolf every
    // fortnight is one the owner learns to skip.
    const result = verdict([
      { source: "Monthly", discoveredAt: daysAgo(12) },
      { source: "Gone", discoveredAt: daysAgo(30) }
    ]);
    expect(result.quiet.map((q: { source: string }) => q.source)).toEqual(["Gone", "Monthly"]);
    expect(result.silent.map((q: { source: string }) => q.source)).toEqual(["Gone"]);
  });

  it("reports the worst offender first, so the named few are the right few", () => {
    // Only the first four are printed in the issue body.
    const result = verdict([
      { source: "A", discoveredAt: daysAgo(11) },
      { source: "B", discoveredAt: daysAgo(40) },
      { source: "C", discoveredAt: daysAgo(25) }
    ]);
    expect(result.quiet.map((q: { days: number }) => q.days)).toEqual([40, 25, 11]);
  });

  it("takes a source's newest item, not its oldest", () => {
    // Sixteen items are kept per source; one old entry must not condemn a feed
    // that posted this morning.
    const result = verdict([
      { source: "Busy", discoveredAt: daysAgo(40) },
      { source: "Busy", discoveredAt: daysAgo(1) }
    ]);
    expect(result.quiet).toEqual([]);
  });

  it("counts an undated item as unreadable, never as healthy", () => {
    // Absence of evidence is not evidence -- the distinction this file already
    // insists on for employer boards.
    expect(verdict([{ source: "Undated" }]).total).toBe(0);
    expect(verdict([{ source: "Undated", discoveredAt: "not a date" }]).total).toBe(0);
    expect(verdict([]).total).toBe(0);
  });

  it("falls back to publishedAt when discoveredAt is missing", () => {
    expect(verdict([{ source: "Old format", publishedAt: daysAgo(2) }]).total).toBe(1);
  });

  it("is wired into the daily run, not merely defined", () => {
    // A check nobody calls is the failure this whole file exists to prevent.
    const script = readFileSync("scripts/watchdog.mjs", "utf8");
    expect(script).toMatch(/await checkNewsSourcesStillProducing\(\);/);
  });
});
