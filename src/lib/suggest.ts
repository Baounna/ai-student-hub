import { matchesAllTerms, searchTerms } from "@/lib/search";

/**
 * Typeahead suggestions for the header search box.
 *
 * Google and YouTube suggest from query logs -- what other people searched for.
 * This site has no query logs and will not be growing any, so suggesting from
 * them is not an option and inventing plausible-looking phrases would be worse
 * than nothing. What it does have is a finite, known catalogue: two dozen
 * guides, the open internships, the tools it compares. So a suggestion here is
 * a real destination on the site rather than a guess at a phrase, which for a
 * catalogue this size is the more useful of the two anyway -- the reader gets
 * the article, not another search results page.
 *
 * Everything runs in the browser against a small index. No request per
 * keystroke, nothing sent to a third party, and it works with the network off.
 */
export type SuggestKind = "guide" | "compare" | "tool" | "internship";

/** Short keys: this ships to every reader, so the JSON stays small. */
export type Suggestion = {
  /** label */
  t: string;
  /** href */
  h: string;
  /** kind */
  k: SuggestKind;
  /** optional sub-label: a company and city, a tool's category */
  s?: string;
  /** optional hidden match text: tags and keywords, searched but never shown */
  m?: string;
};

/**
 * A tiebreaker between entries that match equally well -- not an override.
 *
 * The earlier comment here claimed internships "rank last ... without this they
 * would crowd out every guide", which overstated what these numbers do: the
 * prefix bonus below is +100 and the word-boundary bonus +50, so a kind weight
 * of 0-6 can only order entries inside the same match class. An internship
 * whose title STARTS with the query still outranks a guide that merely contains
 * it, and that is correct for a typeahead -- a reader typing "ai" wants the
 * thing called "AI…" first, whatever it is. Within one class, though, the guide
 * should win, and 0/2/4/6 makes that unambiguous where 0/1/2/3 left it to the
 * length tiebreak.
 */
const KIND_WEIGHT: Record<SuggestKind, number> = {
  guide: 6,
  compare: 4,
  tool: 2,
  internship: 0
};

function fold(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * How well one entry answers what has been typed so far.
 *
 * A label that begins with the query outranks one that merely contains it:
 * typing "ai" should surface "AI Fundamentals…" before an internship whose
 * city happens to be Dubai. Ties break on brevity, because the shorter of two
 * equally-matching labels is almost always the more general one.
 */
function score(entry: Suggestion, query: string, terms: string[]) {
  const label = fold(entry.t);
  const q = fold(query).trim();
  let s = KIND_WEIGHT[entry.k];
  if (label.startsWith(q)) s += 100;
  else if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(label)) s += 50;
  else if (terms.every((term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(label))) s += 25;
  return s;
}

export function rankSuggestions(query: string, entries: Suggestion[], limit = 8): Suggestion[] {
  const terms = searchTerms(query);
  if (!terms.length) return [];
  const ranked = entries
    .filter((entry) => matchesAllTerms(terms, [entry.t, entry.s, entry.m]))
    .map((entry) => ({ entry, s: score(entry, query, terms) }))
    .sort((a, b) => b.s - a.s || a.entry.t.length - b.entry.t.length || a.entry.t.localeCompare(b.entry.t));

  /**
   * One row per destination-and-label, keeping the best-ranked.
   *
   * The catalogue genuinely repeats: Capgemini lists "Analyste SOC - Stage" in
   * three cities and "Ingenieur Cybersecurite GRC - Stage" in four, and every
   * internship row links to the same /stages page. Without this the reader
   * gets four rows that look identical and go to the same place. The duplicates
   * stay in the index so that typing a city or a company still finds the role
   * -- they are only collapsed on the way out.
   *
   * It also removes a React key collision. The rendered key was built from
   * kind, href and label, which those rows shared, and a list shrinking from
   * eight matches to two left a stale row behind: typing "cve" showed "Coursera"
   * above the CVE guide, carrying the id of the position it used to occupy.
   */
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const row of ranked) {
    const key = `${row.entry.k}|${row.entry.h}|${row.entry.t}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row.entry);
    if (out.length === limit) break;
  }
  return out;
}

/**
 * The parts of a label that matched, so the UI can embolden them.
 * Returns alternating [plain, match, plain, match, ...] starting with plain.
 */
export function highlightParts(label: string, query: string): string[] {
  const terms = searchTerms(query);
  if (!terms.length) return [label];
  const folded = fold(label);
  const hits: Array<[number, number]> = [];
  for (const term of terms) {
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(folded))) hits.push([m.index, m.index + term.length]);
  }
  if (!hits.length) return [label];
  hits.sort((a, b) => a[0] - b[0]);
  // Merge overlaps so two terms hitting the same word do not split a character.
  const merged: Array<[number, number]> = [];
  for (const [a, b] of hits) {
    const last = merged[merged.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  const out: string[] = [];
  let cursor = 0;
  for (const [a, b] of merged) {
    out.push(label.slice(cursor, a));
    out.push(label.slice(a, b));
    cursor = b;
  }
  out.push(label.slice(cursor));
  return out;
}
