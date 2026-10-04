/**
 * The blog search was `[title, excerpt, category, ...tags].join(" ").includes(query)`.
 * Three things were wrong with that and all three were reachable by typing.
 *
 * It never looked at the article body, so "claude" found nothing although three
 * posts discuss it. It matched one contiguous substring, so "ai security" found
 * nothing against a post titled "AI and Cybersecurity" — any two words with
 * anything between them failed. And a bare substring match put "rag" inside
 * "storage" and "leverage", so a real query returned ten irrelevant posts.
 *
 * So: every term must match, each at the start of a word, across everything the
 * post actually contains. Accents are folded because this site is bilingual and
 * nobody types "cybersécurité" into a search box with the accent.
 */
function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function searchTerms(query: string) {
  return (
    fold(query)
      .split(/\s+/)
      /*
       * A term with no letter or digit cannot anchor at a word boundary.
       *
       * "-" escapes to /\b-/, which matches the hyphen in every hyphenated
       * title on the page, so ?q=- handed back 21 of the 104 internships as
       * though they were search results -- a subset with nothing in common,
       * presented as an answer. "***" and "..." do the same thing.
       *
       * Dropping those leaves an empty term list, which every caller already
       * treats as "no query", so the reader gets the full list back instead of
       * a random-looking slice of it.
       */
      .filter((term) => /[\p{L}\p{N}]/u.test(term))
  );
}

/**
 * Prefix-at-word-boundary rather than exact word: someone typing "secur"
 * should find "security", while "rag" should not find "storage".
 */
export function matchesAllTerms(terms: string[], haystack: Array<string | undefined | null>) {
  if (!terms.length) return true;
  const hay = fold(haystack.filter(Boolean).join(" "));
  return terms.every((term) => new RegExp(`\\b${escapeRegExp(term)}`).test(hay));
}
