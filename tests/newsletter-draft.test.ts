import { readFileSync } from "node:fs";
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
