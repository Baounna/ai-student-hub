import { describe, it, expect } from "vitest";
import {
  prunePlan,
  reviewMarkerNeeded
  // @ts-expect-error - plain .mjs script, no types
} from "../scripts/check-stages.mjs";

/**
 * Detection was automatic from the start; removal never was. Forty listings
 * came off this board across seven manual sessions in twenty days, and between
 * them it carried dead links — six days of them once, while readers were
 * arriving from a launch post.
 *
 * So the run removes what it proved is gone. These are the guards on that,
 * tested rather than trusted: the circuit breaker in particular only fires on
 * a day something has already gone badly wrong, and must not be discovered
 * broken then.
 */
describe("what a run may remove", () => {
  it("removes nothing when nothing is gone", () => {
    expect(prunePlan(0, 90)).toEqual({ remove: 0, refused: "" });
  });

  it("removes an ordinary week's worth", () => {
    expect(prunePlan(3, 90).remove).toBe(3);
    expect(prunePlan(3, 90).refused).toBe("");
  });

  it("stops at the cap and leaves the rest for the next run", () => {
    const plan = prunePlan(20, 300);
    expect(plan.remove).toBe(14);
    expect(plan.refused).toBe("");
  });

  it("refuses entirely when too much of the board looks gone", () => {
    // A third of the board dying on one Monday is a job board refusing us, not
    // a third of the jobs closing. Deleting on that reading empties the site.
    const plan = prunePlan(30, 90);
    expect(plan.remove).toBe(0);
    expect(plan.refused).toMatch(/33%/);
    expect(plan.refused).toMatch(/nothing was removed/);
  });

  it("holds the line exactly where it says it does", () => {
    // 15% of 100 is 15: at the line it still removes, past it it refuses.
    expect(prunePlan(15, 100).remove).toBe(14);
    expect(prunePlan(16, 100).remove).toBe(0);
    expect(prunePlan(16, 100).refused).not.toBe("");
  });

  it("does not divide by zero on an empty board", () => {
    expect(prunePlan(1, 0).remove).toBe(0);
    expect(prunePlan(1, 0).refused).not.toBe("");
  });
});

/**
 * The marker that raises the review issue has to describe what is LEFT.
 *
 * Before --prune, "found gone" and "needs a person" were the same number. They
 * are not any more: a run that found three dead listings and removed all three
 * printed the marker on the pre-prune count, so the workflow opened an issue
 * telling a person to delete three entries it had already deleted — and
 * because the marker was raised, the step that closes a finished request was
 * suppressed, so the spurious one lingered. Only the exit code had been
 * updated for pruning; the marker had not.
 */
describe("reviewMarkerNeeded", () => {
  it("stays quiet when pruning cleared everything and nothing needs judging", () => {
    expect(reviewMarkerNeeded(0, 0)).toBe(false);
  });

  it("fires for a listing that needs a person even with nothing gone", () => {
    // A 429 from LinkedIn is not proof either way, and it still needs judging.
    expect(reviewMarkerNeeded(2, 0)).toBe(true);
  });

  it("fires for gone listings the prune could not take", () => {
    expect(reviewMarkerNeeded(0, 1)).toBe(true);
  });

  it("fires for both at once", () => {
    expect(reviewMarkerNeeded(2, 3)).toBe(true);
  });
});
