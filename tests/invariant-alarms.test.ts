import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
// @ts-expect-error - plain .mjs script, no types
import { alarmsThatCannotFail } from "../scripts/invariants.mjs";

/**
 * Invariant 10 — every alarm can go red.
 *
 * This repository has fixed "a check that passes without checking" three times
 * under three names; the git log carries one called exactly that. The
 * invariant guarding against a fourth was itself recorded as hand-checked,
 * with the evidence "older checks unaudited".
 *
 * The fixtures below are the shapes the real watchdog uses, including the one
 * that broke the first version of this measurement: a check whose name never
 * appears beside a literal, because it is passed into a helper that records
 * under its own parameter.
 */
describe("alarmsThatCannotFail", () => {
  it("names a check that is hardcoded green", () => {
    const fixture = `
      function checkThing() {
        record("Always green", true, "nothing to see");
      }
    `;
    const result = alarmsThatCannotFail(fixture);
    expect(result.total).toBe(1);
    expect(result.stuck).toEqual(["Always green"]);
  });

  it("accepts a check with any path to red", () => {
    const fixture = `
      function checkThing() {
        if (bad) record("Real check", false, "broken");
        record("Real check", true, "fine");
      }
    `;
    expect(alarmsThatCannotFail(fixture).stuck).toEqual([]);
  });

  it("accepts an expression, which may be either", () => {
    const fixture = `function c() { record("Computed", bad.length === 0, "x"); }`;
    expect(alarmsThatCannotFail(fixture).stuck).toEqual([]);
  });

  it("sees through a helper that records under its parameter", () => {
    /*
     * The case that broke the first version. checkVerifyScript(label, script)
     * records `label, false` on failure, so every check routed through it can
     * go red -- but none of their names ever sits beside a literal, and a
     * matcher that only reads literals called "Affiliate links" unfailable.
     */
    const fixture = `
      async function checkVerifyScript(label, script) {
        try { record(label, true, "passed"); }
        catch { record(label, false, "failed"); }
      }
      async function main() {
        await checkVerifyScript("Affiliate links", "verify:affiliates");
        record("Affiliate links", true, "not configured here — skipped");
      }
    `;
    const result = alarmsThatCannotFail(fixture);
    expect(result.stuck).toEqual([]);
    expect(result.total).toBe(1);
  });

  it("still catches a helper that is itself always green", () => {
    // Resolving through helpers must not become a way to launder a green one.
    const fixture = `
      function checkAlways(label) { record(label, true, "fine"); }
      function main() { checkAlways("Laundered"); }
    `;
    expect(alarmsThatCannotFail(fixture).stuck).toEqual(["Laundered"]);
  });

  it("says nothing rather than guessing when there is nothing to read", () => {
    expect(alarmsThatCannotFail("const x = 1;")).toEqual({ total: 0, stuck: [] });
  });

  it("finds the real watchdog's checks, so the result is not vacuous", () => {
    const result = alarmsThatCannotFail(readFileSync("scripts/watchdog.mjs", "utf8"));
    expect(result.total).toBeGreaterThanOrEqual(13);
    expect(result.stuck).toEqual([]);
  });

  it("is wired into the measurement and no longer declared by hand", () => {
    const script = readFileSync("scripts/invariants.mjs", "utf8");
    expect(script).toMatch(/await invariant10\(\);/);
    expect(script).not.toMatch(/record\(10, "hand-checked", "every check added/);
  });
});
