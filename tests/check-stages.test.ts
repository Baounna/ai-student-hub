import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs script, no types
import { expiredValidThrough, gonePhrase, redirectedAway, requisitionInSearchResults } from "../scripts/check-stages.mjs";

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

  // Five live-looking hellowork postings sat in stages.json for weeks with a
  // fresh checkedAt stamp. The list carried the English "no longer available"
  // but not its plain French translation, which is the exact wording the board
  // uses. Every one of them answered HTTP 200, so nothing else could catch it.
  it("catches the French wording hellowork actually ships", () => {
    expect(gonePhrase("L'offre de Swile n'est plus disponible")).toBeTruthy();
  });

  it("catches an apostrophe that is still HTML-encoded", () => {
    // The fetcher strips tags but never decodes entities, so this is the exact
    // string the matcher receives from a page written with &#039;.
    expect(gonePhrase("L&#039;offre de Ipsos n&#039;est plus disponible")).toBeTruthy();
  });

  it("survives a non-breaking space between the words", () => {
    expect(gonePhrase("Cette offre n&nbsp;est plus en ligne")).toBe("");
    expect(gonePhrase("Cette offre&nbsp;n'est plus en ligne")).toBeTruthy();
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

/**
 * Airbus answered 403 on three requisitions and 200 on a fourth, to the same
 * client, in the same second. A blocked client is blocked for everything, so
 * that 403 was a fact about the job, not about us -- but the checker could not
 * tell the two apart and parked all three at "a human should look", where they
 * sat for days. The tenant's own search settles it, and "the search failed"
 * must stay distinct from "the search says no".
 */
describe("Workday requisition still listed by its tenant", () => {
  const results = (paths: string[]) =>
    JSON.stringify({ total: paths.length, jobPostings: paths.map((externalPath) => ({ externalPath })) });

  it("finds a requisition that is still listed", () => {
    expect(
      requisitionInSearchResults(results(["/job/Toulouse-Area/Something_JR10440087"]), "JR10440087")
    ).toBe(true);
  });

  it("reports a requisition the tenant no longer lists", () => {
    expect(requisitionInSearchResults(results(["/job/Toulouse-Area/Other_JR99999999"]), "JR10440087")).toBe(false);
  });

  it("treats an empty result set as not listed", () => {
    expect(requisitionInSearchResults(results([]), "JR10440087")).toBe(false);
  });

  // null means "no usable answer", which the caller must keep reporting as
  // CHECK. Returning false here would delete live listings whenever Workday
  // changed its response shape or answered with an error page.
  it("returns null when the response is not usable, rather than guessing", () => {
    expect(requisitionInSearchResults("<html>Access Denied</html>", "JR1")).toBeNull();
    expect(requisitionInSearchResults("{}", "JR1")).toBeNull();
    expect(requisitionInSearchResults(JSON.stringify({ jobPostings: "nope" }), "JR1")).toBeNull();
  });
});
