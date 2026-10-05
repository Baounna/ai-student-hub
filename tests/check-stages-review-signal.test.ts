import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

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
