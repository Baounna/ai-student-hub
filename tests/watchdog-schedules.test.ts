import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
// @ts-expect-error - plain .mjs script, no types
import { scheduledWorkflowProblems, scheduledWorkflowVerdict, REVIEW_CHANNELS } from "../scripts/watchdog.mjs";

/**
 * The failure this covers is the one the project already had: the writer agent
 * failed eleven consecutive Mondays and nothing said so. The existing workflow
 * check could not have caught it, because it derives its list of workflows from
 * the runs it just fetched -- a workflow that stops running is simply absent,
 * and the report still says every workflow passed.
 *
 * You cannot make a real workflow stop firing to test the alarm, which is why
 * the judgement is a pure function and why these exist.
 */
const NOW = Date.parse("2026-09-28T12:00:00Z");
const hoursAgo = (n: number) => new Date(NOW - n * 3_600_000).toISOString();

const DAILY = { file: "watchdog.yml", hours: 24 };
const WEEKLY = { file: "blog-writer-agent.yml", hours: 168 };
const TWICE_DAILY = { file: "auto-news-agent.yml", hours: 12 };

describe("scheduledWorkflowProblems", () => {
  it("says nothing when everything fired on time", () => {
    const result = scheduledWorkflowProblems(
      [DAILY, WEEKLY, TWICE_DAILY],
      new Map([
        [DAILY.file, hoursAgo(20)],
        [WEEKLY.file, hoursAgo(150)],
        [TWICE_DAILY.file, hoursAgo(6)]
      ]),
      NOW
    );

    expect(result.problems).toEqual([]);
    expect(result.checked).toBe(3);
  });

  it("catches a weekly workflow that stopped firing", () => {
    // Eleven missed Mondays is ~1848h. One missed Monday already trips it.
    const result = scheduledWorkflowProblems([WEEKLY], new Map([[WEEKLY.file, hoursAgo(400)]]), NOW);

    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]).toContain("blog-writer-agent.yml");
    expect(result.problems[0]).toContain("expected every ~168h");
  });

  it("catches a workflow that has never run", () => {
    const result = scheduledWorkflowProblems([DAILY], new Map([[DAILY.file, null]]), NOW);

    expect(result.problems).toEqual(["watchdog.yml (never run)"]);
  });

  it("does not report an absence when GitHub could not be asked", () => {
    // undefined means "no answer", which is not "stopped". Reporting the first
    // as the second is how a check starts lying, and a check that cries wolf
    // gets ignored -- which is the original failure wearing a different hat.
    const result = scheduledWorkflowProblems([DAILY, WEEKLY], new Map([[DAILY.file, hoursAgo(2)]]), NOW);

    expect(result.problems).toEqual([]);
    expect(result.checked).toBe(1);
    expect(result.unknown).toBe(1);
  });

  it("gives the scheduler a full day of slack before complaining", () => {
    // GitHub fires these five to eight hours late as a matter of course.
    const justInside = scheduledWorkflowProblems([DAILY], new Map([[DAILY.file, hoursAgo(47)]]), NOW);
    const justOutside = scheduledWorkflowProblems([DAILY], new Map([[DAILY.file, hoursAgo(49)]]), NOW);

    expect(justInside.problems).toEqual([]);
    expect(justOutside.problems).toHaveLength(1);
  });

  it("does not choke on an unreadable date", () => {
    const result = scheduledWorkflowProblems([DAILY], new Map([[DAILY.file, "not-a-date"]]), NOW);

    expect(result.problems).toEqual(["watchdog.yml (unreadable run date)"]);
  });

  it("reports every quiet workflow, not just the first", () => {
    const result = scheduledWorkflowProblems(
      [DAILY, WEEKLY],
      new Map([
        [DAILY.file, hoursAgo(300)],
        [WEEKLY.file, null]
      ]),
      NOW
    );

    expect(result.problems).toHaveLength(2);
  });
});

/**
 * The pure function above was right the whole time. The bug was in what the
 * watchdog did with its answer, and in where the call sat.
 *
 * checkScheduledWorkflowsStillFiring() was the last line inside
 * checkWorkflowHealth()'s try block, after a `gh run list` that throws whenever
 * gh has no token -- which was every single run, because the workflow step set
 * none. Execution jumped to the catch, which recorded "gh CLI unavailable here
 * - skipped" with ok=true. Verified against the live run of 2026-10-01: its
 * output has no "Scheduled workflows" line at all. The alarm written after an
 * eleven-Monday silent outage had never once armed, and reported green.
 *
 * And had it run with GitHub unreachable, it would still have passed: every
 * workflow counted as unknown, no problems found, "all 0 scheduled workflows
 * fired within their cadence" printed as a pass.
 */
describe("scheduledWorkflowVerdict", () => {
  const NOW = Date.parse("2026-10-01T12:00:00.000Z");
  const expected = [
    { file: "check-stages.yml", hours: 168 },
    { file: "watchdog.yml", hours: 24 }
  ];

  it("fails when GitHub answered for nothing at all", () => {
    // Every file absent from the map: gh threw for each one.
    const verdict = scheduledWorkflowVerdict(expected, new Map(), NOW);

    expect(verdict.ok).toBe(false);
    expect(verdict.detail).toMatch(/could not verify any of the 2/);
  });

  it("passes when every workflow fired recently", () => {
    const lastRuns = new Map([
      ["check-stages.yml", "2026-09-29T05:30:00.000Z"],
      ["watchdog.yml", "2026-10-01T07:15:00.000Z"]
    ]);
    const verdict = scheduledWorkflowVerdict(expected, lastRuns, NOW);

    expect(verdict.ok).toBe(true);
    expect(verdict.detail).toMatch(/all 2 scheduled workflows/);
  });

  it("fails when one has gone quiet, and names it", () => {
    const lastRuns = new Map([
      ["check-stages.yml", "2026-08-01T05:30:00.000Z"],
      ["watchdog.yml", "2026-10-01T07:15:00.000Z"]
    ]);
    const verdict = scheduledWorkflowVerdict(expected, lastRuns, NOW);

    expect(verdict.ok).toBe(false);
    expect(verdict.detail).toContain("check-stages.yml");
  });

  it("still passes on a partial outage, and says how much it could not see", () => {
    // One answered and is healthy; the other GitHub would not answer for. That
    // is not evidence the second has stopped, so it is a pass with a caveat --
    // the distinction this whole check exists to preserve.
    const lastRuns = new Map([["watchdog.yml", "2026-10-01T07:15:00.000Z"]]);
    const verdict = scheduledWorkflowVerdict(expected, lastRuns, NOW);

    expect(verdict.ok).toBe(true);
    expect(verdict.detail).toMatch(/1 could not be checked/);
  });

  it("reports a workflow that has never run as a failure, not as unknown", () => {
    const lastRuns = new Map([
      ["check-stages.yml", null],
      ["watchdog.yml", "2026-10-01T07:15:00.000Z"]
    ]);
    const verdict = scheduledWorkflowVerdict(expected, lastRuns, NOW);

    expect(verdict.ok).toBe(false);
    expect(verdict.detail).toMatch(/never run/);
  });
});

/**
 * A workflow that fails on purpose to ask for a person has to be named in two
 * places: once so "Workflow health" reads its red run as a request rather than
 * a fault, and once so "Listings awaiting review" knows which issue carries the
 * request. scripts/watchdog.mjs keeps them in one table for that reason.
 *
 * The Citation Link Check shipped in neither. Had this test not been written
 * with it, the first Thursday a cited source moved would have pinned workflow
 * health red for good -- the always-on light this file's own comments were
 * written about -- while the issue it opened stayed invisible in the line whose
 * whole job is to surface it.
 */
describe("review channels", () => {
  const DIR = ".github/workflows";
  const workflows = readdirSync(DIR)
    .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
    .map((name) => ({ name, text: readFileSync(path.join(DIR, name), "utf8") }));

  it("knows every workflow that opens a review issue", () => {
    const declared = new Set(REVIEW_CHANNELS.map((channel: { issue: string }) => channel.issue));
    const opened = new Set<string>();

    for (const { text } of workflows) {
      // The issue steps assign the title to TITLE before using it.
      for (const match of text.matchAll(/^\s*TITLE="([^"]+)"/gm)) opened.add(match[1]);
    }

    expect(opened.size).toBeGreaterThan(0);
    expect([...opened].filter((title) => !declared.has(title))).toEqual([]);
  });

  it("names only workflows that exist", () => {
    const names = new Set(
      workflows.map(({ text }) => text.match(/^name:\s*(.+)$/m)?.[1]?.trim()).filter(Boolean)
    );
    const named = (REVIEW_CHANNELS as { failsOnPurpose: string | null }[])
      .map((channel) => channel.failsOnPurpose)
      .filter((workflow): workflow is string => Boolean(workflow));

    expect(named.length).toBeGreaterThan(0);
    for (const workflow of named) expect(names, workflow).toContain(workflow);
  });

  it("excuses a red run only for a workflow that fails on purpose", () => {
    // The finder opens its issue and exits 0. Listing it as by-design would
    // excuse a genuine break in the one workflow that adds listings to the
    // board -- which is the failure mode that hid for three days once already.
    const channels = REVIEW_CHANNELS as { issue: string; failsOnPurpose: string | null }[];
    const finder = channels.find((channel) => channel.issue.includes("candidates waiting"));
    expect(finder?.failsOnPurpose).toBeNull();

    for (const { failsOnPurpose } of channels) {
      if (!failsOnPurpose) continue;
      const file = workflows.find(({ text }) => text.includes(`name: ${failsOnPurpose}`));
      expect(file, failsOnPurpose).toBeTruthy();
      expect(file!.text, failsOnPurpose).toMatch(/exit 1/);
    }
  });
});
