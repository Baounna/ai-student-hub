import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { stagesCopy } from "../src/app/[lang]/stages/shared";
import { getStages } from "@/content/stages";
import { locales } from "@/i18n/config";

/**
 * "What checked means here", held to what the weekly script does.
 *
 * The note made two claims the run cannot support. It said the weekly check
 * "re-confirms them against that same API", when only the Workday rows are
 * asked of an employer API every run -- three of the twenty-three feed
 * listings; Greenhouse is consulted only when the site refuses us, and
 * check-stages.mjs has no SmartRecruiters path at all, which is eleven
 * Wavestone and Bosch rows judged on the words on their page. And it said
 * "either way the link is fetched and the page read every week", when the run
 * answers from the employer's board and returns before fetching the page for
 * twelve rows: eight Workday and four Ashby, whose public pages are a
 * JavaScript shell with nothing in them to read.
 *
 * A reader comparing two rows was told both carried the stronger evidence.
 * These checks fail if the copy drifts back, and -- more usefully -- if the
 * script changes so that the corrected copy understates it.
 */
const SCRIPT = readFileSync("scripts/check-stages.mjs", "utf8");

const OVERSTATED = [
  /re-confirms them against that same API/i,
  /reconfirme aupr[èe]s de cette m[êe]me API/i,
  /[Ee]ither way the link is fetched/,
  /[Dd]ans les deux cas le lien est ouvert/
];

describe("the method note on /stages", () => {
  it("no longer promises every row the evidence a dozen of them get", () => {
    for (const locale of locales) {
      const note = stagesCopy[locale].methodBody;
      for (const claim of OVERSTATED) expect(note, locale).not.toMatch(claim);
    }
  });

  it("names the rows that are checked against a board, in both languages", () => {
    for (const locale of locales) {
      const note = stagesCopy[locale].methodBody;
      // Named rather than hidden: the exception is the interesting half of the
      // sentence, because asking the employer's own board is better evidence
      // than reading a page.
      expect(note).toMatch(/Workday/);
      expect(note).toMatch(/Ashby/);
      expect(note).toMatch(/Greenhouse/);
    }
  });

  it("is earned by the board: those listings exist", () => {
    const stages = getStages();
    const workday = stages.filter((stage) => /\.myworkdayjobs\.com\//i.test(stage.href));
    const ashby = stages.filter((stage) => /^https:\/\/jobs\.ashbyhq\.com\//i.test(stage.href));
    // Eight and four today. The note's middle sentence describes these rows,
    // so if they ever leave the board it has to be reworded, not left
    // describing nothing.
    expect(workday.length).toBeGreaterThan(0);
    expect(ashby.length).toBeGreaterThan(0);
  });

  it("matches the order the script checks in: the board first, the page second", () => {
    const body = SCRIPT.slice(SCRIPT.indexOf("async function checkOne"));
    const page = body.indexOf("await fetchText(stage.href)");
    expect(page).toBeGreaterThan(0);
    // Both of these return before the line above runs, which is exactly why
    // "the link is fetched either way" was untrue. If a rewrite ever puts the
    // page fetch first, the note may say so again -- and this test says to.
    expect(body.indexOf("workdayApi(stage.href)")).toBeLessThan(page);
    expect(body.indexOf("jobs.ashbyhq.com")).toBeLessThan(page);
  });

  it("claims no SmartRecruiters re-confirmation, because the script makes none", () => {
    // Eleven feed rows sit on SmartRecruiters. The day a SmartRecruiters path
    // is added here, this fails and the note can be strengthened to match.
    expect(SCRIPT).not.toContain("api.smartrecruiters.com");
    for (const locale of locales) {
      expect(stagesCopy[locale].methodBody).not.toMatch(/SmartRecruiters[^.]*(weekly|hebdomadaire)/i);
    }
  });
});
