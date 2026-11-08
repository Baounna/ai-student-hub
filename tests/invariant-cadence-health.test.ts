import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
// @ts-expect-error - plain .mjs script, no types
import { cadenceVerdict, healthVerdict } from "../scripts/invariants.mjs";

const NOW = Date.parse("2026-11-08T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

/**
 * Invariant 6 — the cadence promised equals the cadence kept.
 *
 * Every page carries "At most one email a week" over a signup form, and
 * drafts/.last-issue.json has said `sentAt: null` since it was reset. The
 * watchdog reports the gap as work waiting on a person, which it is. This
 * reports what it also is: a sentence on the site that is not true, and the
 * one untrue sentence that costs a reader something — a student hands over an
 * address expecting listings.
 */
describe("cadenceVerdict", () => {
  it("fails while the site promises an email nobody sends", () => {
    const v = cadenceVerdict({ promisesWeekly: true, sentAt: null, nowMs: NOW, graceDays: 14 });
    expect(v.ok).toBe(false);
    expect(v.why).toContain("none has ever been sent");
  });

  it("passes once an issue has gone out on time", () => {
    expect(cadenceVerdict({ promisesWeekly: true, sentAt: daysAgo(5), nowMs: NOW, graceDays: 14 }).ok).toBe(true);
  });

  it("gives a late issue grace, and a changed cadence none", () => {
    // A week late is a late issue; a month late is a different cadence.
    expect(cadenceVerdict({ promisesWeekly: true, sentAt: daysAgo(10), nowMs: NOW, graceDays: 14 }).ok).toBe(true);
    const stale = cadenceVerdict({ promisesWeekly: true, sentAt: daysAgo(40), nowMs: NOW, graceDays: 14 });
    expect(stale.ok).toBe(false);
    expect(stale.why).toContain("40 days ago");
  });

  it("has nothing to enforce when the copy promises nothing", () => {
    // Removing the promise is a valid way to make this true, and the check
    // must not punish it.
    expect(cadenceVerdict({ promisesWeekly: false, sentAt: null, nowMs: NOW, graceDays: 14 }).ok).toBe(true);
  });

  it("treats an unreadable date as never sent", () => {
    expect(cadenceVerdict({ promisesWeekly: true, sentAt: "soon", nowMs: NOW, graceDays: 14 }).ok).toBe(false);
  });
});

/**
 * Invariant 12 — everything the health report lists is a decision, not a defect.
 *
 * The report exists so someone returning after weeks learns the truth in two
 * minutes. That only works if its list means one thing. A list mixing "you
 * have not sent the newsletter" with "a scheduled job is broken" teaches its
 * reader to skim, and skimming is how the Internship Finder sat failing for
 * ten days.
 */
describe("healthVerdict", () => {
  const known = ["promises an email that is not going out", "says \"latest\" over content"];

  it("passes when every line is a recorded decision", () => {
    const v = healthVerdict(["the signup promises an email that is not going out"], known);
    expect(v.ok).toBe(true);
  });

  it("fails on a line nobody has classified", () => {
    // A line that is not a known decision is, by definition, something new.
    const v = healthVerdict(["Internship Finder — last 2d ago, failure"], known);
    expect(v.ok).toBe(false);
    expect(v.why).toContain("Internship Finder");
  });

  it("names every unclassified line, not just the first", () => {
    const v = healthVerdict(["job A failed", "job B failed"], known);
    expect(v.why).toContain("job A failed");
    expect(v.why).toContain("job B failed");
  });

  it("passes an empty list", () => {
    expect(healthVerdict([], known).ok).toBe(true);
  });

  it("keeps the signatures in code, not in a file the check reads", () => {
    // Reading them from the ledger would let the check be silenced by editing
    // a JSON file.
    const script = readFileSync("scripts/invariants.mjs", "utf8");
    expect(script).toMatch(/const OWNER_DECISIONS = \[/);
    expect(script).not.toMatch(/OWNER_DECISIONS = JSON\.parse/);
  });
});

describe("health sees a manual confirmation", () => {
  it("does not keep reporting a failure a manual run has disproved", () => {
    // The Finder was dispatched by hand on 8 November to confirm a fix,
    // succeeded, and committed two listings — while the report went on naming
    // its 5 November scheduled failure, because the run that proved it fixed
    // was the wrong event type to be seen.
    const health = readFileSync("scripts/health.mjs", "utf8");
    expect(health).toMatch(/const latestAny = new Map\(\)/);
    expect(health).toMatch(/since confirmed by a manual run/);
    // Cadence still comes from the scheduled runs; only the verdict changed.
    expect(health).toMatch(/const runs = all\.filter\(\(r\) => r\.event === "schedule"\)/);
  });
});
