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
  return fold(query).split(/\s+/).filter(Boolean);
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
