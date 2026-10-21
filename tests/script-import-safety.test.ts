import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, rmSync } from "node:fs";

/**
 * Importing a script must not run it.
 *
 * Tests import these three for their pure helpers. Two of them used to execute
 * top to bottom on import, and each cost something real:
 *
 * - find-stages.mjs fired thirty requests at four employers' APIs and rewrote
 *   docs/agent/stage-candidates.md as a side effect of a unit test.
 * - watchdog.mjs took twenty-seven seconds, made a dozen gh calls, hit
 *   production five times and ran `npm ci` — concurrently with the test suite
 *   that imported it. Rewriting node_modules underneath a running test runner
 *   has already broken this repository once.
 *
 * check-stages.mjs had the guard from the start, with a comment explaining it,
 * and the other two were written later without it. That is the shape of this
 * class of bug: one file gets it right and nothing makes the next one match.
 */
const GUARDED = [
  "scripts/check-stages.mjs",
  "scripts/find-stages.mjs",
  "scripts/watchdog.mjs"
];

describe("script import safety", () => {
  it.each(GUARDED)("%s gates its work on being invoked directly", (file) => {
    const source = readFileSync(file, "utf8");
    expect(source).toMatch(
      /const invokedDirectly = process\.argv\[1\] && import\.meta\.url === pathToFileURL\(process\.argv\[1\]\)\.href;/
    );
    expect(source).toMatch(/import \{ pathToFileURL \} from "node:url";/);
    // The guard has to actually wrap something.
    expect(source).toMatch(/if \(invokedDirectly\) \{/);
  });

  it.each(GUARDED)("%s imports without doing any work", async (file) => {
    const started = Date.now();
    const loaded = await import(`../${file}`);
    const elapsed = Date.now() - started;
    // Generous: an unguarded watchdog took 27 seconds, an unguarded finder 36.
    expect(elapsed).toBeLessThan(5_000);
    expect(Object.keys(loaded).length).toBeGreaterThan(0);
  });

  it("importing the watchdog writes no report", async () => {
    rmSync("watchdog-report.md", { force: true });
    // @ts-expect-error - plain .mjs script, no types
    await import("../scripts/watchdog.mjs");
    expect(existsSync("watchdog-report.md")).toBe(false);
  });
});
