import type { Locale } from "@/i18n/config";

export type BriefReference = {
  label: string;
  href: string;
  /** The role shown beside the entry: its publisher, or "Further reading". */
  source: string;
};

export type BriefReferenceInput = {
  source: { name: string; href?: string; direct?: boolean };
  topic: string;
};

/**
 * The reference list under a news brief, and which sentence may cite it.
 *
 * This was inline in the page and got three things wrong at once, all verified
 * on a production server before being moved here:
 *
 * 1. The markers [1] and [2] were printed unconditionally against a list that is
 *    one or two entries long. The one brief with no source link is the
 *    publication's own analysis, so its numbering slid down: [1] landed on a US
 *    Department of Labor fact sheet about whether interns must be paid, under a
 *    sentence about what recruiters look for, and [2] pointed at #reference-2 --
 *    one href, zero matching ids, a marker that goes nowhere. The same page told
 *    the reader "Own analysis, no external source" three lines above.
 * 2. [2] always pinned the per-topic link to studentImpact, which is this
 *    publication's own reading of the news. The list itself says that link is
 *    "useful background, not a check on the brief"; the marker claimed it was
 *    the opposite, on every brief.
 * 3. On four of the ten briefs the topic link IS the brief's own source again
 *    (ml-ops.org, owasp.org/API-Security, opentelemetry.io/docs,
 *    developer.nvidia.com/embedded-computing), so one source was presented as
 *    two numbered references with two different labels and two different roles.
 */
export function briefReferences(
  brief: BriefReferenceInput,
  topicReference: BriefReference,
  locale: Locale
): { references: BriefReference[]; summaryCitation: number | null } {
  const furtherReading = locale === "fr" ? "Pour aller plus loin" : "Further reading";
  // direct === false means the link is a newsroom, blog index or product landing
  // page: worth reading, but not the document the brief's claims come from. It
  // is listed as background and cites no sentence.
  const isDirect = brief.source.direct !== false;
  const sources: BriefReference[] = brief.source.href && isDirect
    ? [{ label: brief.source.name, href: brief.source.href, source: "Source" }]
    : [];
  const background: BriefReference[] = brief.source.href && !isDirect
    ? [{ label: brief.source.name, href: brief.source.href, source: furtherReading }]
    : [];

  const listed = [...sources, ...background];
  const duplicate = listed.some((entry) => sameTarget(entry.href, topicReference.href));
  const references = [
    ...listed,
    ...(duplicate ? [] : [{ ...topicReference, source: furtherReading }])
  ];

  return {
    references,
    // The summary is cited only when the brief has a source of its own. Nothing
    // cites studentImpact: the only remaining entry on such a brief is
    // background by its own label.
    summaryCitation: sources.length > 0 ? 1 : null
  };
}

/** Same page, ignoring "www." and a trailing slash. */
function sameTarget(a: string, b: string) {
  try {
    const left = new URL(a);
    const right = new URL(b);
    return (
      left.host.replace(/^www\./, "") === right.host.replace(/^www\./, "") &&
      left.pathname.replace(/\/+$/, "") === right.pathname.replace(/\/+$/, "")
    );
  } catch {
    return a === b;
  }
}
