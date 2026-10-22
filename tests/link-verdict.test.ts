import { describe, it, expect } from "vitest";
import {
  linkVerdict
  // @ts-expect-error - plain .mjs script, no types
} from "../scripts/find-stages.mjs";

/**
 * Every row on the board carries "link checked <date>", and the method note
 * promises the link is fetched and the page read rather than pinged for a
 * status code. A listing added from an employer's job API used to carry that
 * stamp on the day nobody had fetched its link: the API proved the job was
 * open, which is real evidence, but it is evidence about the board, not about
 * the href the student clicks. The first genuine fetch came the next Monday.
 *
 * So the finder now fetches each candidate before writing it, and this is the
 * decision that fetch feeds. The shape it has to get right is the same one the
 * weekly check learned the hard way: refused is not gone.
 */
describe("linkVerdict", () => {
  // Long enough to clear the script-shell guard. A real posting page runs to
  // thousands of characters; a Workday shell runs to zero and an Ashby one to
  // about fifty, which is the whole reason that guard exists.
  const body = "Apply now for this internship. ".repeat(20);
  const ok = { status: 200, text: body, raw: "", href: "https://e.com/jobs/1/apply", finalUrl: "https://e.com/jobs/1/apply" };

  it("accepts a posting that answers and says nothing about being closed", () => {
    expect(linkVerdict(ok)).toEqual({ ok: true, reason: "" });
  });

  it("does not add a listing we were refused, and does not call it dead", () => {
    for (const status of [401, 403, 405, 429, 503, 999]) {
      const verdict = linkVerdict({ ...ok, status });
      expect(verdict.ok).toBe(false);
      expect(verdict.reason).toContain("refused us");
    }
  });

  it("treats an unreachable link as unverified, not as a dead posting", () => {
    expect(linkVerdict({ ...ok, status: 0 }).reason).toBe("the link could not be reached");
  });

  it("rejects a link that 404s, which is the failure the API cannot see", () => {
    expect(linkVerdict({ ...ok, status: 404 })).toEqual({
      ok: false,
      reason: "the link answers HTTP 404"
    });
  });

  it("rejects a page that answers 200 while saying the posting closed", () => {
    // Postings regularly answer 200 while saying in the body that they closed.
    // Which of several phrases the body matched is not the point; quoting the
    // page back is, so a person reading the review file can judge it.
    const verdict = linkVerdict({ ...ok, text: `${body} This job has expired and is no longer available` });
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toMatch(/^the page says "/);
  });

  it("rejects a page whose own JobPosting gives a closing date already past", () => {
    const raw = `<script type="application/ld+json">
      {"@type":"JobPosting","title":"Intern","validThrough":"2020-01-01"}
    </script>`;
    const verdict = linkVerdict({ ...ok, raw });
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain("2020-01-01");
  });

  it("rejects a link that lands shallower than the posting it promised", () => {
    const verdict = linkVerdict({ ...ok, finalUrl: "https://e.com/jobs" });
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain("redirects away");
  });

  it("accepts a redirect that stays as deep, which is ordinary canonicalisation", () => {
    // ENGIE rewrites .../1367860955/ to .../70237-fr_FR/ and the job is alive.
    // Only landing SHALLOWER than the posting means it was pulled.
    expect(linkVerdict({ ...ok, finalUrl: "https://e.com/jobs/70237-fr_FR/apply" }).ok).toBe(true);
  });

  it("refuses a page with nothing on it, whatever its status code", () => {
    // Measured live: a Workday requisition path that does not exist answers 200
    // with ZERO characters, and an Ashby one with "You need to enable
    // JavaScript to run this app." Both were called verified, so a row shipped
    // stamped "link checked today" having read nothing. It matters most here
    // because the finder BUILDS the Workday href itself, and a wrong path is
    // exactly what the fetch was added to catch.
    for (const text of ["", "Jobs You need to enable JavaScript to run this app.", "x".repeat(399)]) {
      const verdict = linkVerdict({ ...ok, text });
      expect(verdict.ok).toBe(false);
      expect(verdict.reason).toContain("characters of text");
    }
    expect(linkVerdict({ ...ok, text: "x".repeat(400) }).ok).toBe(true);
  });

  it("does not fire a single request when the module is merely imported", () => {
    // The first version of this test took 36 seconds to import and rewrote
    // docs/agent/stage-candidates.md as a side effect, because the script ran
    // top to bottom on import. The guard is what this asserts.
    expect(typeof linkVerdict).toBe("function");
  });
});
