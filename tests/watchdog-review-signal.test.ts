import { describe, it, expect } from "vitest";
import {
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

  it("does not render an em dash as an escape sequence", () => {
    // The detail strings are read by a person in a GitHub issue.
    for (const waiting of [true, false, null]) {
      expect(reviewVerdict(waiting, by).detail).not.toContain("\\u");
    }
  });
});
