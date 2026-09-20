import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs script, no types
import { gonePhrase, redirectedAway } from "../scripts/check-stages.mjs";

// Both of these rules exist because the checker passed a known-dead listing as
// healthy. They are the two ways a posting dies while still answering HTTP 200.
describe("expired-posting phrases", () => {
  it("catches the typographic apostrophe a real page actually uses", () => {
    expect(gonePhrase("Cette offre d’emploi n’est plus d’actualité.")).toBeTruthy();
  });

  it("still catches the plain ASCII apostrophe", () => {
    expect(gonePhrase("Cette offre d'emploi n'est plus d'actualite.")).toBeTruthy();
  });

  it("catches the English wording", () => {
    expect(gonePhrase("This job is no longer accepting applications")).toBeTruthy();
  });

  it("does not fire on an ordinary live posting", () => {
    expect(gonePhrase("Stage PFE - nous recherchons un etudiant en derniere annee")).toBe("");
  });
});

describe("redirected off the posting", () => {
  it("catches a board that bounces a dead job to its front page", () => {
    expect(
      redirectedAway(
        "https://job-boards.greenhouse.io/doctolib/jobs/0000000000",
        "https://job-boards.greenhouse.io/doctolib?error=true"
      )
    ).toBe(true);
  });

  it("accepts a posting that stays on its own URL", () => {
    const url = "https://job-boards.greenhouse.io/doctolib/jobs/7996070003";
    expect(redirectedAway(url, url)).toBe(false);
  });

  it("accepts a board that canonicalises to a different internal id", () => {
    // ENGIE rewrites .../job/<slug>/1367860955/ to .../job/<slug>/70237-fr_FR/.
    // Same page, different id. Flagging that retires a live posting.
    expect(
      redirectedAway(
        "https://jobs.engie.com/job/La-Garenne-Colombes-Analyste-92250/1367860955/",
        "https://jobs.engie.com/job/La-Garenne-Colombes-Analyste-92250/70237-fr_FR/"
      )
    ).toBe(false);
  });

  it("accepts a redirect that still names the job", () => {
    expect(
      redirectedAway(
        "https://example.com/jobs/12345",
        "https://www.example.com/en/jobs/12345?src=rss"
      )
    ).toBe(false);
  });

  it("treats a missing final URL as inconclusive, not gone", () => {
    expect(redirectedAway("https://example.com/jobs/12345", "")).toBe(false);
  });
});
