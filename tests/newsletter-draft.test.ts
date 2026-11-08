import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { getStages } from "@/content/stages";

/**
 * The first issue had never been sent, and two faults would have shaped it.
 *
 * The body only ever rendered two hardcoded sections, Morocco and France, from
 * a board that now spans ten countries — so the week its picks came from
 * Germany and the United States it printed no listings at all, under an opening
 * line promising twelve, beneath a subject naming two countries it did not
 * mention. And it wrote the sent-ledger on every run, directly under the words
 * "Nothing was sent", so three September drafts that were never sent had
 * retired 48 of 102 listings.
 */
const DRAFT = readFileSync("scripts/draft-issue.mjs", "utf8");
// Comments quote the code they replaced, so they have to come out before
// asking whether that code is still there. Without this, the comment
// explaining why `${s.city}` was removed fails the test that enforces it.
const DRAFT_CODE = DRAFT.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const SENT = readFileSync("scripts/mark-issue-sent.mjs", "utf8");

describe("the weekly issue", () => {
  it("builds its sections from the listings, not a hardcoded pair", () => {
    expect(DRAFT).not.toMatch(/\[\["Morocco", byCountry\("MA"\)\], \["France", byCountry\("FR"\)\]\]/);
    expect(DRAFT).toMatch(/new Set\(picked\.map\(\(s\) => s\.country\)\)/);
  });

  it("names in the subject only countries the issue contains", () => {
    expect(DRAFT).not.toMatch(/internships? - Morocco and France/);
    expect(DRAFT).toContain("subjectWhere");
  });

  it("knows a name for every country on the board", () => {
    // A missing entry would print a bare "MA" as a section heading.
    const names = DRAFT.slice(DRAFT.indexOf("const COUNTRY_NAMES"));
    for (const code of new Set(getStages().map((s) => s.country))) {
      expect(names, `COUNTRY_NAMES is missing ${code}`).toMatch(new RegExp(`\\b${code}:`));
    }
  });

  it("does not record a send when it has only written a draft", () => {
    // The ledger write moved out of this file entirely.
    expect(DRAFT).not.toMatch(/writeFile\(\s*STATE/);
    expect(DRAFT).toContain("pending.json");
    expect(SENT).toMatch(/writeFile\(\s*STATE/);
  });

  it("clears the pending file once a send is recorded", () => {
    // Otherwise marking twice would retire a later draft's listings too.
    expect(SENT).toMatch(/fs\.rm\(path\.join\(OUT, newest\)\)/);
  });

  it("never prints the word undefined where a city is missing", () => {
    // Cohere publishes no city for its Canadian roles, and `${s.city}` put the
    // literal string "undefined" in front of a reader deciding where to apply.
    expect(DRAFT_CODE).not.toMatch(/`\$\{s\.city\}`/);
    expect(DRAFT_CODE).toMatch(/s\.city \|\| countryName\(s\.country\)/);
    const noCity = getStages().filter((s) => !s.city);
    expect(noCity.length, "the board should still have a listing with no city").toBeGreaterThan(0);
  });

  it("counts what is on the site separately from what has been emailed", () => {
    // "80 more are on the site" was the unsent count, printed about a page
    // showing 102.
    expect(DRAFT).toContain("onSiteOther");
    expect(DRAFT).toMatch(/open\.length - picked\.length/);
  });
});

/**
 * Which draft was sent is a fact only the sender has.
 *
 * mark-issue-sent.mjs took the last pending file by name, which is a guess, and
 * on 8 November there were two: a draft from 6 October that had sat unsent long
 * enough for five of its twelve listings to close, and a fresh one written that
 * day. Pasting the October HTML into Kit and running the script would have
 * retired the November listings and left the five dead ones marked unsent --
 * silently, in both directions.
 *
 * Run as a process rather than read as text, because what matters is the exit
 * code and whether the ledger was touched, neither of which a source match can
 * show.
 */
describe("recording which issue was sent", () => {
  const SCRIPT = path.resolve("scripts/mark-issue-sent.mjs");

  function workspace(dates: string[]) {
    const dir = mkdtempSync(path.join(tmpdir(), "issue-sent-"));
    mkdirSync(path.join(dir, "drafts"));
    for (const date of dates) {
      writeFileSync(
        path.join(dir, "drafts", `issue-${date}.pending.json`),
        JSON.stringify({ draftedAt: date, ids: [`listing-${date}`], slugs: [`guide-${date}`] })
      );
    }
    return dir;
  }

  function run(dir: string, args: string[] = []) {
    const result = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: dir, encoding: "utf8" });
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  }

  const ledger = (dir: string) => path.join(dir, "drafts", ".last-issue.json");

  it("refuses to guess when two drafts are waiting", () => {
    const dir = workspace(["2026-10-06", "2026-11-08"]);
    const { status, output } = run(dir);

    expect(status).toBe(1);
    expect(output).toContain("2026-10-06");
    expect(output).toContain("2026-11-08");
    // Neither draft may be retired, and no send may be recorded.
    expect(existsSync(ledger(dir))).toBe(false);
    expect(existsSync(path.join(dir, "drafts", "issue-2026-10-06.pending.json"))).toBe(true);
    expect(existsSync(path.join(dir, "drafts", "issue-2026-11-08.pending.json"))).toBe(true);
  });

  it("records the issue the sender names, and only that one", () => {
    const dir = workspace(["2026-10-06", "2026-11-08"]);
    const { status } = run(dir, ["--issue", "2026-11-08"]);

    expect(status).toBe(0);
    const state = JSON.parse(readFileSync(ledger(dir), "utf8"));
    expect(state.coveredIds).toEqual(["listing-2026-11-08"]);
    expect(state.coveredIds).not.toContain("listing-2026-10-06");
    expect(existsSync(path.join(dir, "drafts", "issue-2026-11-08.pending.json"))).toBe(false);
    // The draft that was not sent is still waiting, not quietly consumed.
    expect(existsSync(path.join(dir, "drafts", "issue-2026-10-06.pending.json"))).toBe(true);
  });

  it("still needs no flag when there is only one draft", () => {
    const dir = workspace(["2026-11-08"]);
    const { status } = run(dir);

    expect(status).toBe(0);
    expect(JSON.parse(readFileSync(ledger(dir), "utf8")).coveredIds).toEqual(["listing-2026-11-08"]);
  });

  it("says so when the named issue is not waiting", () => {
    const dir = workspace(["2026-11-08"]);
    const { status, output } = run(dir, ["--issue", "2026-10-06"]);

    expect(status).toBe(1);
    expect(output).toContain("2026-11-08");
    expect(existsSync(ledger(dir))).toBe(false);
  });
});
