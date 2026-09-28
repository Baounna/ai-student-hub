import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs script, no types
import { scheduledWorkflowProblems } from "../scripts/watchdog.mjs";

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
