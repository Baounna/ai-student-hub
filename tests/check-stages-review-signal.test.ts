import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  reviewVerdict
  // @ts-expect-error - plain .mjs script, no types
} from "../scripts/watchdog.mjs";

/**
 * The workflow and the script have to agree on one word.
 *
 * .github/workflows/check-stages.yml grepped the script's log for the prose
 * "needs a human". The script prints "need a human", singular. One character,
 * and the review issue could never be raised for a listing the checker flagged
 * for a person. The only other branch in that grep, "^  Probably gone", fires
 * only when something is GONE -- which is also when the script exits 1, which
 * under `bash -e` aborted the step before any output was written. So the issue
 * was unreachable in both directions, and two suspect listings (Coinbase and
 * Helsing) were already stamped "link checked 1 October 2026" with nobody told.
 *
 * Neither file can see the other, so nothing caught it. This can.
 */
const SCRIPT = readFileSync("scripts/check-stages.mjs", "utf8");
const WORKFLOW = readFileSync(".github/workflows/check-stages.yml", "utf8");

describe("the weekly check's review signal", () => {
  it("prints a marker the workflow greps for", () => {
    const marker = SCRIPT.match(/const REVIEW_MARKER = "([^"]+)"/)?.[1];

    expect(marker, "scripts/check-stages.mjs must define REVIEW_MARKER").toBeTruthy();
    expect(WORKFLOW, `check-stages.yml must grep for ${marker}`).toContain(marker as string);
  });

  it("raises that marker for listings needing a human, not only for gone ones", () => {
    // The whole point: a 403 or an ambiguous page is the case a person has to
    // judge, and it used to produce no signal at all.
    expect(SCRIPT).toMatch(/if \(results\.CHECK\.length \|\| results\.GONE\.length\)/);
  });

  it("does not let the script's exit code abort the reporting", () => {
    // `status=0 … || status=$?` keeps the step alive long enough to write its
    // outputs; a later step re-raises it.
    expect(WORKFLOW).toMatch(/\|\| status=\$\?/);
    expect(WORKFLOW).toContain("check_status=$status");
  });

  it("opens the review issue even when the check step reported a failure", () => {
    expect(WORKFLOW).toMatch(/if: always\(\) && steps\.check\.outputs\.needs_review == 'true'/);
  });

  /**
   * A count is not a task.
   *
   * The issue body is a tail of the script's log, so only what prints near the
   * end reaches it. "Probably gone" had a block down there and arrived; the
   * suspect listings had only their inline line among a hundred others and were
   * cut, so run 37309467443 told a reader "2 need a human" and named neither.
   * Both blocks must exist, and the tail must be long enough to hold them.
   */
  it("names the listings that need a human, not just how many", () => {
    expect(SCRIPT).toContain("Needs a human");
    // Each entry carries the three things needed to judge it.
    const block = SCRIPT.slice(SCRIPT.indexOf("Needs a human"));
    expect(block).toMatch(/results\.CHECK\b/);
    expect(block).toMatch(/\$\{stage\.id\}[\s\S]{0,80}\$\{detail\}[\s\S]{0,80}\$\{stage\.href\}/);
  });

  it("keeps the log tail long enough for both blocks to survive", () => {
    const tail = Number(WORKFLOW.match(/tail -n (\d+) "\$RUNNER_TEMP\/stages\.log"/)?.[1]);
    // Three lines per entry, two blocks, plus the summary, marker and footer.
    expect(tail).toBeGreaterThanOrEqual(60);
  });

  it("still fails the job when a listing looks gone", () => {
    // Reporting more must not mean signalling less.
    expect(WORKFLOW).toMatch(/steps\.check\.outputs\.check_status != '0'/);
    expect(WORKFLOW).toMatch(/exit 1/);
  });
});

describe("a check that fails on purpose must not look like one that broke", () => {
  /**
   * The link check exits non-zero when a listing looks gone, and listings look
   * gone most weeks — every run since 1 October found at least one. So the
   * watchdog's workflow-health line was red every week for a workflow doing
   * precisely its job, and the health issue it opens sat open from 11 October
   * unable to close.
   *
   * That is worse than noise. The internship finder broke on its first
   * scheduled run and stayed broken for three days inside the same red line,
   * indistinguishable from the red that was expected. A light that is always
   * on cannot report anything, including the thing it was there for.
   */
  const WATCHDOG = readFileSync("scripts/watchdog.mjs", "utf8");

  it("does not count the review request as a workflow failure", () => {
    expect(WATCHDOG).toMatch(/const BY_DESIGN = new Set\(\["Internship Link Check"\]\)/);
    expect(WATCHDOG).toMatch(/const unexpected = failing\.filter\(\(name\) => !BY_DESIGN\.has\(name\)\)/);
    // Workflow health is judged on the unexpected failures only.
    expect(WATCHDOG).toMatch(/"Workflow health",\s*\n\s*unexpected\.length === 0/);
  });

  it("still reports it, on a line of its own", () => {
    // Separating it must not mean hiding it: "nothing to do" and "something is
    // waiting for you" have to stay distinguishable.
    //
    // This used to grep the next 200 characters of the source for the literal
    // `false`, which broke the moment the decision moved into a function --
    // while the behaviour it cared about was intact and better. The behaviour
    // is what it asserts now; tests/watchdog-review-signal.test.ts covers the
    // three-way reading in full.
    expect(WATCHDOG).toContain('"Listings awaiting review"');
    expect(reviewVerdict(true, ["Internship Link Check"]).ok).toBe(false);
    expect(reviewVerdict(false, ["Internship Link Check"]).ok).toBe(true);
  });

  it("leaves every other workflow failing the health check", () => {
    // The finder breaking is a real failure and must still be reported there.
    const names = [...WATCHDOG.matchAll(/BY_DESIGN = new Set\(\[([^\]]*)\]\)/g)][0]?.[1] ?? "";
    expect(names).not.toMatch(/Finder|Watchdog|CI|CodeQL|Agent/);
  });
});
