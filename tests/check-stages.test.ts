import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs script, no types
import { expiredValidThrough, gonePhrase, redirectedAway } from "../scripts/check-stages.mjs";

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

// This rule is the reason six long-dead internships were caught, and it spent
// its whole life unable to fire: it ran against the tag-stripped text, while
// the date only ever appears inside a <script type="application/ld+json">
// block, which fetchText() deletes before anything greps it.
describe("expired schema.org validThrough", () => {
  const JSON_LD_PAGE = `<!doctype html><html><head>
<script type="application/ld+json">
{"@context":"https://schema.org/","@type":"JobPosting","title":"Stage Cyber",
"datePosted":"2025-01-10","validThrough":"2025-03-01T23:59"}
</script>
</head><body><h1>Stage Cyber</h1><p>Rejoignez notre equipe.</p></body></html>`;

  const now = Date.parse("2026-09-21T00:00:00Z");

  it("finds a past date published as JSON-LD", () => {
    expect(expiredValidThrough(JSON_LD_PAGE, "example.com", now)).toBe("2025-03-01");
  });

  it("says nothing about a date still in the future", () => {
    const live = JSON_LD_PAGE.replace("2025-03-01", "2027-03-01");
    expect(expiredValidThrough(live, "example.com", now)).toBe("");
  });

  it("says nothing when the page publishes no validThrough", () => {
    expect(expiredValidThrough("<html><body>Stage Cyber</body></html>", "example.com", now)).toBe("");
  });

  // HelloWork stamps every listing datePosted + 30 days regardless of the
  // employer's own timetable, so trusting it there retires live jobs.
  it("ignores boards whose validThrough is their own listing TTL", () => {
    expect(expiredValidThrough(JSON_LD_PAGE, "hellowork.com", now)).toBe("");
  });
});
