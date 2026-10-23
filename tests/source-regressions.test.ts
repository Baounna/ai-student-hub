import { describe, it, expect } from "vitest";
import {
  sourceRegressions
  // @ts-expect-error - plain .mjs script, no types
} from "../scripts/find-stages.mjs";

/**
 * A board going blind must not look like an employer with no openings.
 *
 * The finder polls 44 employer boards. One that breaks prints "unreachable"
 * into a log nobody reads, the run exits 0, and the board stops growing while
 * everything reports success — the same silent degradation that hid a missing
 * env block for a week and a broken finder for three days.
 *
 * The case this exists for is the quiet one: an API that renames a field still
 * passes `Array.isArray(data.jobs)`, the array is simply empty, and a company
 * that listed 678 jobs last week now contributes nothing with no error at all.
 */
describe("sourceRegressions", () => {
  const working = [
    { board: "anthropic", scanned: 678, found: 0 },
    { board: "celonis", scanned: 216, found: 5 }
  ];

  it("says nothing when every board still answers", () => {
    expect(sourceRegressions(working, working)).toEqual([]);
  });

  it("catches a board that answers cleanly with nothing", () => {
    const now = [{ board: "anthropic", scanned: 0, found: 0 }, working[1]];
    expect(sourceRegressions(working, now)).toEqual([
      { board: "anthropic", was: 678, reason: "answered with an empty board" }
    ]);
  });

  it("catches a board that started erroring", () => {
    const now = [{ board: "anthropic", error: "HTTP 404", found: 0 }, working[1]];
    const out = sourceRegressions(working, now);
    expect(out).toHaveLength(1);
    expect(out[0].board).toBe("anthropic");
    expect(out[0].reason).toContain("HTTP 404");
  });

  it("stays quiet about a board that never worked", () => {
    // A bad entry in the source list is not a regression, and raising it every
    // Thursday is how a warning becomes one you delete unread.
    const before = [{ board: "typo-co", error: "HTTP 404", found: 0 }];
    const now = [{ board: "typo-co", error: "HTTP 404", found: 0 }];
    expect(sourceRegressions(before, now)).toEqual([]);
    expect(sourceRegressions([{ board: "typo-co", scanned: 0, found: 0 }], now)).toEqual([]);
  });

  it("does not flag a board that merely shrank", () => {
    // Hiring really does slow down. A threshold would make this a guess; zero
    // is the one number that cannot be explained away.
    const now = [{ board: "anthropic", scanned: 3, found: 0 }, working[1]];
    expect(sourceRegressions(working, now)).toEqual([]);
  });

  it("ignores a board that is new this run", () => {
    const now = [...working, { board: "brand-new", error: "HTTP 404", found: 0 }];
    expect(sourceRegressions(working, now)).toEqual([]);
  });

  it("survives a missing, empty or malformed previous report", () => {
    // First run, or a file somebody truncated.
    for (const prev of [undefined, [], null, "not an array", {}]) {
      expect(() => sourceRegressions(prev as never, working)).not.toThrow();
      expect(sourceRegressions(prev as never, working)).toEqual([]);
    }
    expect(sourceRegressions(working, undefined as never)).toEqual([]);
  });

  it("reports every degraded board, not just the first", () => {
    const now = [
      { board: "anthropic", scanned: 0, found: 0 },
      { board: "celonis", error: "HTTP 500", found: 0 }
    ];
    expect(sourceRegressions(working, now)).toHaveLength(2);
  });
});
