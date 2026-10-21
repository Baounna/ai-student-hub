import { describe, it, expect } from "vitest";
import {
  prunePlan
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
