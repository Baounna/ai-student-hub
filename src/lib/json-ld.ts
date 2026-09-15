/**
 * Serialize structured data for embedding in a <script> tag.
 *
 * JSON.stringify is not safe to drop into HTML on its own. It leaves "<"
 * untouched, so any string containing "</script" closes the block early and
 * everything after it is parsed as markup instead of data.
 *
 * That is reachable here, not theoretical: article schemas carry `description`
 * straight from the auto-ingested news and tools feeds, and those summaries
 * demonstrably still contain raw HTML fragments from the pages they were
 * scraped from. A feed we do not control decides what ends up in that string.
 *
 * The page's CSP uses a nonce, so injected script would not execute today, but
 * CSP is the last line of defence, not the only one - and it does nothing about
 * markup injected into the document.
 *
 * Escaping keeps the JSON semantically identical: a parser reads the same
 * characters back, while the HTML tokenizer never sees a tag.
 */

// Written as escapes on purpose. These two are legal inside a JSON string but
// count as line terminators in JavaScript source, so pasting the raw characters
// into this file would break the module itself.
const LINE_SEPARATOR = "\u2028";
const PARAGRAPH_SEPARATOR = "\u2029";

const HTML_SENSITIVE = new RegExp(`[<>&${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}]`, "g");

const REPLACEMENTS: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [LINE_SEPARATOR]: "\\u2028",
  [PARAGRAPH_SEPARATOR]: "\\u2029"
};

export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(HTML_SENSITIVE, (char) => REPLACEMENTS[char]);
}
