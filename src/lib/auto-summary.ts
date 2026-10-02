import type { Locale } from "@/i18n/config";

/**
 * Whether a machine-written summary is worth showing a reader.
 *
 * src/content/auto-tools.json and auto-news.json are written twice a day by
 * scripts/auto-tools-agent.mjs and pushed straight to main with no typecheck,
 * no test and no content gate. The agent builds a "summary" by taking the
 * markup around the link and deleting the title from it, so what lands in the
 * file is whatever happened to be nearby. The existing guard replaced an EMPTY
 * summary, which let everything else through.
 *
 * What is in those files today, counted rather than estimated:
 *
 *   auto-tools.json  5 summaries that are the literal word "Title", 3 carrying
 *                    raw markup ('.jpg"/> Matan Kushner, Tom Dale, and 1
 *                    other'), 19 identical to their own title, 14 under forty
 *                    characters, 7 that are only a date or a version number
 *                    ("3.7", "· Changelog"), 2 empty.
 *   auto-news.json   2 carrying markup, 45 identical to their title, 5 very
 *                    short, 1 empty.
 *
 * One of them -- the card reading "Title" -- was the fourth card on /compare.
 *
 * The rule has to stay conservative: this rejects a summary, it never edits
 * one. A real summary that trips a check costs the reader a sentence naming the
 * source instead; letting junk through costs the site its credibility on the
 * page where it claims to check things.
 *
 * The JSON is machine-owned and must not be hand-edited -- the next agent run
 * would overwrite it. So the gate lives here, where every render passes.
 */
const PLACEHOLDERS = new Set([
  "title",
  "category title",
  "description",
  "summary",
  "read more",
  "learn more",
  "untitled",
  "n/a"
]);

/** Markup, entities, or an image filename that survived the scrape. */
const MARKUP = /[<>]|&[a-z]+;|&#\d+;|\.(?:jpg|png|gif|webp|svg)"/i;

/** Only a date, a version number, or a changelog crumb. */
const NOT_A_SENTENCE = /^[\s\d.·|\-–—]*$/;
const DATE_ONLY = /^(?:·\s*)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{1,2}(?:,?\s*\d{4})?\s*$/i;

/** Shorter than this is a fragment, not a summary. */
const MIN_LENGTH = 40;

export function isUsableSummary(summary: string, title: string): boolean {
  const text = (summary || "").trim();
  if (!text) return false;
  if (PLACEHOLDERS.has(text.toLowerCase().replace(/[.:]+$/, ""))) return false;
  if (MARKUP.test(text)) return false;
  if (NOT_A_SENTENCE.test(text)) return false;
  if (DATE_ONLY.test(text)) return false;
  // Repeating the headline underneath the headline tells the reader nothing.
  if (text.toLowerCase() === (title || "").trim().toLowerCase()) return false;
  if (text.length < MIN_LENGTH) return false;
  return true;
}

/**
 * The summary, or an honest sentence saying where the item came from.
 *
 * Naming the source is something this site can always stand behind, and it is
 * what the previous empty-only fallback already did.
 */
export function usableSummary(summary: string, title: string, source: string, locale: Locale): string {
  if (isUsableSummary(summary, title)) return summary.trim();
  return locale === "fr" ? `${title} — via ${source}.` : `${title} — reported by ${source}.`;
}

/**
 * Titles are scraped too, and three run past 240 characters because the whole
 * page header came with them, byline included ("… Matan Kushner, Tom Dale, and
 * 1 other"). Trimmed at a word boundary so a card cannot swallow its row.
 */
const MAX_TITLE = 140;

export function usableTitle(title: string): string {
  const text = (title || "").trim().replace(/\s+/g, " ");
  // A trailing contributor byline is page furniture, not part of the headline.
  const withoutByline = text.replace(/,?\s*and \d+ others?\s*$/i, "").trim();
  if (withoutByline.length <= MAX_TITLE) return withoutByline;
  const cut = withoutByline.slice(0, MAX_TITLE);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
