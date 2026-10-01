import { describe, it, expect } from "vitest";
import { briefReferences, type BriefReference } from "@/lib/news-references";
import { newsBriefs } from "@/content/news";

const FURTHER: BriefReference = {
  label: "MLOps Community",
  href: "https://ml-ops.org/",
  source: "MLOps Community"
};

describe("briefReferences", () => {
  it("cites the summary when the brief has a source of its own", () => {
    const { references, summaryCitation } = briefReferences(
      { source: { name: "OWASP API Security documentation", href: "https://owasp.org/API-Security/" }, topic: "MLOps" },
      FURTHER,
      "en"
    );

    expect(summaryCitation).toBe(1);
    expect(references).toHaveLength(2);
    expect(references[0].href).toBe("https://owasp.org/API-Security/");
    expect(references[1].source).toBe("Further reading");
  });

  it("cites nothing when the brief is the publication's own analysis", () => {
    // This is the case that shipped a [1] pointing at a US Department of Labor
    // fact sheet on intern pay, under a sentence about what recruiters look for.
    const { references, summaryCitation } = briefReferences(
      { source: { name: "AI Student Hub editorial analysis" }, topic: "Career" },
      { label: "Internship programs (U.S. DOL)", href: "https://www.dol.gov/agencies/whd/fact-sheets/71-flsa-internships", source: "U.S. Department of Labor" },
      "en"
    );

    expect(summaryCitation).toBeNull();
    // The background link stays in the list, labelled as background. What it
    // must not do is sit behind a marker on a sentence it does not support.
    expect(references).toHaveLength(1);
    expect(references[0].source).toBe("Further reading");
  });

  it("never points a marker past the end of the list", () => {
    // The original bug in one line: two markers, a list of one.
    for (const href of [undefined, "https://example.com/post"]) {
      const { references, summaryCitation } = briefReferences(
        { source: { name: "Some source", href }, topic: "MLOps" },
        FURTHER,
        "en"
      );
      if (summaryCitation !== null) expect(summaryCitation).toBeLessThanOrEqual(references.length);
    }
  });

  it("does not list one source twice as Source and Further reading", () => {
    const { references } = briefReferences(
      { source: { name: "DevOps and MLOps community reports", href: "https://ml-ops.org" }, topic: "MLOps" },
      FURTHER,
      "en"
    );

    expect(references).toHaveLength(1);
    expect(references[0].source).toBe("Source");
  });

  it("treats www. and a trailing slash as the same page", () => {
    const { references } = briefReferences(
      { source: { name: "OWASP", href: "https://www.owasp.org/API-Security" }, topic: "Security & Performance" },
      { label: "OWASP API Security Top 10", href: "https://owasp.org/API-Security/", source: "OWASP" },
      "en"
    );

    expect(references).toHaveLength(1);
  });

  it("keeps a genuinely different page from the same host", () => {
    const { references } = briefReferences(
      { source: { name: "Anthropic engineering post", href: "https://www.anthropic.com/news/some-post" }, topic: "AI Systems" },
      { label: "NIST AI RMF", href: "https://www.nist.gov/itl/ai-risk-management-framework", source: "NIST" },
      "en"
    );

    expect(references).toHaveLength(2);
  });

  it("labels further reading in French on the French page", () => {
    const { references } = briefReferences(
      { source: { name: "Source", href: "https://example.com/post" }, topic: "MLOps" },
      FURTHER,
      "fr"
    );

    expect(references[1].source).toBe("Pour aller plus loin");
  });
});

describe("the briefs actually in the repository", () => {
  const briefs = newsBriefs;

  it("marks every newsroom, index and landing page as background, not a source", () => {
    // A link kept as "Source" has to reach a document, not a directory. Seven of
    // these ten pointed at a newsroom, a blog index, a GitHub topic listing or a
    // product landing page while naming a report that was not there.
    const bareIndexes = briefs
      .filter((brief) => brief.source.href && brief.source.direct !== false)
      .filter((brief) => {
        const path = new URL(brief.source.href as string).pathname.replace(/\/+$/, "");
        return path === "" || /^\/(news|blog|discover\/blog|topics)$/.test(path);
      })
      .map((brief) => `${brief.slug}: ${brief.source.href}`);

    expect(bareIndexes).toEqual([]);
  });

  it("gives no brief a source name that is a category rather than a destination", () => {
    // "DevOps and MLOps community reports" over a link to the ml-ops.org
    // homepage names a document that does not exist at the other end.
    const vague = briefs
      .filter((brief) => brief.source.href)
      .filter((brief) => /\b(reports|updates|docs|notes|blogs)\b/i.test(brief.source.name))
      .filter((brief) => brief.source.direct !== false)
      .map((brief) => `${brief.slug}: ${brief.source.name}`);

    // The two remaining direct sources are named "OWASP API Security
    // documentation" and "OpenTelemetry documentation and ecosystem guides",
    // and each links that documentation's canonical root -- a name that
    // describes what is at the other end.
    expect(vague).toEqual([]);
  });

  it("never numbers a marker past the end of a real brief's reference list", () => {
    for (const brief of briefs) {
      const { references, summaryCitation } = briefReferences(
        brief,
        { label: "x", href: "https://example.invalid/background", source: "x" },
        "en"
      );
      if (summaryCitation !== null) {
        expect(summaryCitation, `${brief.slug} cites past its list`).toBeLessThanOrEqual(references.length);
      }
    }
  });
});
