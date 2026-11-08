import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The report for coming back, not for being alerted.
 *
 * The watchdog files a GitHub issue daily, which is the right shape for a
 * problem appearing while somebody is watching and the wrong shape for
 * returning after three weeks: by then the answer is spread over issue
 * comments, ninety commits and a run history, and the first question is not
 * "what broke" but "is this alive and did it do its job".
 *
 * What these pin is the part that would rot silently: that the report reuses
 * the watchdog's judgements instead of growing its own, that it writes nothing,
 * and that an unreachable host reads as unknown rather than as bad news.
 */
const SCRIPT = readFileSync("scripts/health.mjs", "utf8");
const PACKAGE = JSON.parse(readFileSync("package.json", "utf8"));

describe("npm run health", () => {
  it("is registered, or it does not exist", () => {
    expect(PACKAGE.scripts.health).toBe("node scripts/health.mjs");
  });

  it("shares the watchdog's judgements rather than growing its own", () => {
    // Two copies of "is this stale" drift, and the pair that drifts is the
    // alarm the owner gets and the page he reads when he comes back.
    expect(SCRIPT).toMatch(
      /import \{ editorialAgeVerdict, newsletterCadenceVerdict, quietNewsSources \} from "\.\/watchdog\.mjs"/
    );
  });

  it("writes nothing, sends nothing, files nothing", () => {
    // It is run by a person catching up. It must be safe to run twice.
    expect(SCRIPT).not.toMatch(/fs\.writeFile|fs\.appendFile|fs\.rm|fs\.unlink/);
    expect(SCRIPT).not.toMatch(/gh["',\s]+.*issue|issue["'\s]*,\s*["']create/);
    expect(SCRIPT).not.toMatch(/-X\s*POST|method:\s*["']POST/);
  });

  it("treats an unreachable host as unknown, never as broken", () => {
    // github.com is unreachable from the owner's machine. A report that turns
    // that into bad news is one he stops reading.
    expect(SCRIPT).toMatch(/unchecked\.push/);
    expect(SCRIPT).toMatch(/could not check/);
    expect(SCRIPT).toMatch(/unknown, not down|unknown, not broken/);
  });

  it("keeps the watchdog's exit contract", () => {
    expect(SCRIPT).toMatch(/process\.exit\(0\)/);
    expect(SCRIPT).toMatch(/process\.exit\(1\)/);
  });

  it("lets only checkable rows set the board's clock", () => {
    // Two links nobody can verify keep an old checkedAt forever. Letting them
    // drag the figure down reports the board stale every day for the rest of
    // its life -- it printed 38 days against the site's own 5 before this.
    expect(SCRIPT).toMatch(/items\.filter\(\(i\) => !i\.unverifiable\)/);
  });

  it("does not claim to know who made a commit", () => {
    // Every commit carries the same author, because the workflows commit as
    // the owner. The subject is the only honest signal and the report says so.
    expect(SCRIPT).toMatch(/look automated/);
    expect(SCRIPT).toMatch(/the author is the same for both/);
  });
});
