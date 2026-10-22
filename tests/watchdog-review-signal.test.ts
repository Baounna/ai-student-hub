import { describe, it, expect } from "vitest";
import {
  crashReport,
  reviewVerdict
  // @ts-expect-error - plain .mjs script, no types
} from "../scripts/watchdog.mjs";

/**
 * "Something is waiting for you" has to be a fact about today.
 *
 * The watchdog read it from the link check's last run conclusion, which is a
 * fact about last Monday. A request a person resolved on the Tuesday left the
 * line red until the next Monday, and the health issue it opens could not
 * close — so the site reported unhealthy for a week over work already done.
 * That is the always-on light, one level above the one it replaced.
 *
 * It reads the review issue's own state now. The case worth pinning is the
 * third one: GitHub declining to answer is not the same as nothing waiting,
 * and reporting an unknown as healthy is how a real request goes unseen.
 */
describe("reviewVerdict", () => {
  const by = ["Internship Link Check"];

  it("is healthy only when the request is definitely closed", () => {
    const verdict = reviewVerdict(false, by);
    expect(verdict.ok).toBe(true);
    expect(verdict.detail).toContain("already closed");
  });

  it("is unhealthy while the request is open", () => {
    const verdict = reviewVerdict(true, by);
    expect(verdict.ok).toBe(false);
    expect(verdict.detail).toContain("still open");
  });

  it("never reports an unknown as healthy", () => {
    const verdict = reviewVerdict(null, by);
    expect(verdict.ok).toBe(false);
    expect(verdict.detail).toContain("would not say");
  });

  it("names the workflow that asked, in every case", () => {
    for (const waiting of [true, false, null]) {
      expect(reviewVerdict(waiting, by).detail).toContain("Internship Link Check");
    }
  });

  /**
   * After pruning, a green link-check run is the normal case, so there is
   * usually no failing workflow to name — and every test here passed a name,
   * so the no-name path was uncovered. It claimed "The weekly link check asked
   * for review on its last run, and that request is already closed" on every
   * green run: a yesterday it invented. This line exists to be a fact about
   * today, so it does not get to do that.
   */
  describe("when no workflow asked for review", () => {
    it("does not claim a request was made", () => {
      for (const waiting of [true, false, null]) {
        expect(reviewVerdict(waiting, []).detail).not.toMatch(/asked for review/);
      }
    });

    it("still reports an open request, and still refuses to call an unknown healthy", () => {
      expect(reviewVerdict(true, []).ok).toBe(false);
      expect(reviewVerdict(null, []).ok).toBe(false);
      expect(reviewVerdict(false, []).ok).toBe(true);
      expect(reviewVerdict(false, []).detail).toBe("no listing is waiting for a person");
    });

    it("defaults the argument, so a caller may omit it entirely", () => {
      expect(reviewVerdict(false).ok).toBe(true);
    });
  });

  it("does not render an em dash as an escape sequence", () => {
    // The detail strings are read by a person in a GitHub issue.
    for (const waiting of [true, false, null]) {
      expect(reviewVerdict(waiting, by).detail).not.toContain("\\u");
    }
  });
});

/**
 * The watchdog has to be able to report its own failure.
 *
 * The reporting step runs `set -euo pipefail` and then
 * `BODY=$(cat watchdog-report.md)`. That file was written at the very end of
 * the run, after every check — so a throw outside a per-check try left no
 * file, `cat` failed, the step failed, and no issue was opened or updated at
 * all. The one workflow that exists because "the failures went to GitHub
 * notifications, which had long since become noise" fell silent precisely when
 * it had broken worst.
 *
 * The one rule the wording must keep: a run that checked nothing may not imply
 * the site is fine.
 */
describe("crashReport", () => {
  const at = new Date("2026-10-22T21:15:00Z");

  it("says the health is unknown, and never that it passed", () => {
    const report = crashReport(new Error("boom"), at);
    expect(report).toContain("did not finish");
    expect(report).toContain("health is unknown");
    expect(report).not.toMatch(/passed|healthy|all checks/i);
  });

  it("separates a broken watchdog from a broken site", () => {
    expect(crashReport(new Error("boom"), at)).toContain("not a verdict on the site");
  });

  it("includes the error so it can be acted on", () => {
    expect(crashReport(new Error("npm ci exploded"), at)).toContain("npm ci exploded");
  });

  it("survives being handed something that is not an Error", () => {
    for (const thrown of [undefined, null, "a string", 42, { nope: true }]) {
      expect(() => crashReport(thrown, at)).not.toThrow();
      expect(crashReport(thrown, at)).toContain("did not finish");
    }
  });

  it("caps a runaway stack so the issue body stays postable", () => {
    const huge = new Error("x");
    huge.stack = "y".repeat(10_000);
    expect(crashReport(huge, at).length).toBeLessThan(2_600);
  });
});
