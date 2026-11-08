import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/**
 * A claim about sending must agree with the record of sending.
 *
 * Four source comments asserted that no issue had ever gone out — "Zero have
 * ever been sent", "no issue has ever gone out", "nothing sends one". Each was
 * true when written. By 8 November 2026 none of them was: Kit's broadcast list
 * showed one issue sent on 21 September and one that morning, and
 * drafts/.last-issue.json had a sentAt.
 *
 * Nobody noticed because comments are not checked against anything. This is
 * the same defect class the site itself is held to — a sentence that has
 * outlived its evidence — applied to the only place in the repository where it
 * was still allowed.
 *
 * Narrow on purpose: only absolute claims that nothing has EVER been sent are
 * caught. A comment describing a branch ("no ledger is the same fact as never
 * sent") is describing code, not asserting history, and stays.
 */
const ledger = JSON.parse(readFileSync("drafts/.last-issue.json", "utf8"));

/** Absolute claims. Deliberately not matching branch descriptions. */
const NEVER_SENT = [
  /\bZero have ever been sent\b/i,
  /\bno issue has ever (been sent|gone out)\b/i,
  /\bnothing sends one\b/i,
  /\bthe sending does not\b/i
];

describe("claims about sending", () => {
  it("has a ledger that says an issue went out", () => {
    // If this ever goes back to null the assertions below stop meaning
    // anything, so it is checked rather than assumed.
    expect(ledger.sentAt).toBeTruthy();
    expect(ledger.covered).toBeGreaterThan(0);
  });

  it("does not claim nothing has ever been sent, anywhere in the repository", () => {
    const tracked = execFileSync("git", ["ls-files", "src", "scripts", "docs"], { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter((f) => /\.(ts|tsx|mjs|md)$/.test(f))
      // The epoch records are history: they describe what was true that day
      // and must not be rewritten to match today.
      .filter((f) => !/docs\/agent\/epoch-\d+\.md$/.test(f));

    /*
     * Comments only. A first version of this scanned whole files and caught
     * watchdog.mjs returning the string "no issue has ever been sent" as the
     * detail for its no-ledger branch — which is correct code, not a claim
     * about history. The defect was always in prose that asserts a fact,
     * never in a message a branch produces when the fact is true.
     */
    const commentsOf = (source: string) =>
      source
        .split("\n")
        .filter((line) => /^\s*(\/\/|\*|\/\*)/.test(line))
        .join("\n");

    const offenders: string[] = [];
    for (const file of tracked) {
      const prose = file.endsWith(".md") ? readFileSync(file, "utf8") : commentsOf(readFileSync(file, "utf8"));
      for (const pattern of NEVER_SENT) {
        if (pattern.test(prose)) offenders.push(`${file}: ${pattern}`);
      }
    }

    expect(offenders, `the ledger says an issue was sent on ${ledger.sentAt}`).toEqual([]);
  });

  it("still allows a comment to describe the never-sent branch", () => {
    // watchdog.mjs and health.mjs both have a path for "no ledger yet", and
    // explaining that path is not a claim about history.
    const watchdog = readFileSync("scripts/watchdog.mjs", "utf8");
    expect(watchdog).toMatch(/No ledger yet/);
    expect(NEVER_SENT.some((p) => p.test("// No ledger yet. Reported below as never sent."))).toBe(false);
  });
});
