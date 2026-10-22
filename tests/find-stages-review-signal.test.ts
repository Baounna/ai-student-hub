import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The finder could open its review issue and had no way to close it.
 *
 * `gh issue close` lived in watchdog.yml and check-stages.yml and nowhere else,
 * so "Internship candidates waiting for review" was created once, commented on
 * every Thursday after that, and never closed. A run that found nothing to hand
 * over did not close it either -- the step simply did not match its `if`, and
 * the issue survived carrying the previous week's comment. A reader opening it
 * could not tell a live request from one somebody had already worked, and
 * because the newest comment is always the top of the thread, a month-old
 * request looks current. That is the always-on light the watchdog's review line
 * was fixed for, in a third place.
 *
 * The number in it was wrong too, which is the half that made the issue not
 * worth opening. `--write` does not remove the rows it places from the
 * candidates array; it stamps `addedToBoard` on them. So the body announced "N
 * new posting(s) ... are not on the board yet" with N including the rows the
 * same run had just added, and the one candidate genuinely waiting for a person
 * sat buried in a list of finished work.
 *
 * Neither file can see the other, so nothing caught either half. This can.
 */
const WORKFLOW = readFileSync(".github/workflows/find-stages.yml", "utf8");
const SCRIPT = readFileSync("scripts/find-stages.mjs", "utf8");

/** The step that runs discovery, up to the first step that reacts to it. */
const FIND_STEP = WORKFLOW.slice(WORKFLOW.indexOf("id: find"), WORKFLOW.indexOf("- name: Commit"));

function conditionOf(stepName: string) {
  const step = WORKFLOW.slice(WORKFLOW.indexOf(`- name: ${stepName}`));
  return step.match(/^\s*if: (.+)$/m)?.[1] ?? "";
}

describe("the finder's review signal", () => {
  it("counts the candidates still waiting for a person, not the ones it placed", () => {
    expect(FIND_STEP).toMatch(/filter\(\(c\) => !c\.addedToBoard\)\.length/);
    // The field the count leans on has to be the one the script actually writes.
    expect(SCRIPT).toContain("c.addedToBoard = true");
  });

  it("reports that count and nothing else to the issue steps", () => {
    // The old output name is gone rather than left dangling: a step still
    // reading `count` would be reading an output nobody writes, which is the
    // empty-output failure this file's other case is about.
    expect(WORKFLOW).not.toContain("outputs.count");
    expect(conditionOf("Open or update the review issue")).toContain("steps.find.outputs.pending != '0'");
  });

  it("closes the review issue as well as opening it", () => {
    expect(WORKFLOW).toContain("gh issue create");
    expect(WORKFLOW).toContain("gh issue close");
  });

  it("closes only on positive evidence that discovery ran", () => {
    const condition = conditionOf("Close the review issue when nothing is waiting for a person");

    expect(condition).toContain("steps.find.outputs.find_ran == 'true'");
    expect(condition).toContain("steps.find.outputs.pending == '0'");
    // Every output of a step that died in `npm ci`, or in the script, is empty,
    // and empty satisfies any `!=` test. check-stages.yml's close step was that
    // shape and closed a live request on a run that verified nothing: it
    // destroyed the only human-actionable state the workflow produces, and then
    // told the human the opposite of the truth.
    expect(condition).not.toMatch(/steps\.find\.outputs\.\w+ != /);
  });

  it("writes that evidence after the count, so it cannot outlive a crash", () => {
    const count = FIND_STEP.indexOf('echo "pending=$pending"');
    const evidence = FIND_STEP.indexOf('echo "find_ran=true"');

    expect(count).toBeGreaterThan(-1);
    expect(evidence).toBeGreaterThan(count);
  });

  it("still reports on a run whose discovery failed", () => {
    // always() on both halves, for the reason check-stages carries it: a red X
    // in a tab nobody opens is not a notification channel this project has.
    expect(conditionOf("Open or update the review issue")).toContain("always()");
    expect(conditionOf("Close the review issue when nothing is waiting for a person")).toContain("always()");
  });
});
