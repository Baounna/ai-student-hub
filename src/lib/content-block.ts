/**
 * One entry of a post's `content` array, classified.
 *
 * Article bodies are `string[]` rendered as <p> elements, which means the
 * measured claims in these guides -- "about 8.1 ms", "0.901 then 0.493" -- had
 * no way to ship the command that produces them. The stylesheet has carried
 * `.reading-prose pre` rules for a while with nothing able to emit a <pre>, so
 * the capability was styled but unreachable.
 *
 * Rather than change the content type across 24 posts and two locales, a code
 * block is an entry fenced the way every writer already expects:
 *
 *   ```bash
 *   python3 bench.py
 *   ```
 *
 * Everything else stays a paragraph, so existing content is untouched and the
 * FR/EN index alignment that `paragraphCitations` depends on is preserved.
 */
export type ContentBlock =
  | { kind: "text"; text: string }
  | { kind: "code"; code: string; lang: string };

const FENCE = "```";

export function parseContentBlock(entry: string): ContentBlock {
  const raw = String(entry ?? "");
  const trimmed = raw.trim();

  if (!trimmed.startsWith(FENCE)) return { kind: "text", text: raw };

  const firstBreak = trimmed.indexOf("\n");
  // A single-line "```foo" is not a block: there is no body, and treating it as
  // an empty code block would render an empty box where a sentence belonged.
  if (firstBreak === -1) return { kind: "text", text: raw };

  const lang = trimmed.slice(FENCE.length, firstBreak).trim().toLowerCase();
  let body = trimmed.slice(firstBreak + 1);
  if (body.trimEnd().endsWith(FENCE)) {
    const end = body.lastIndexOf(FENCE);
    body = body.slice(0, end);
  }

  const code = body.replace(/\s+$/, "");
  if (!code.trim()) return { kind: "text", text: raw };

  // A language tag is a class name on the rendered element, so it cannot carry
  // arbitrary text from content.
  const safeLang = /^[a-z0-9+#-]{1,20}$/.test(lang) ? lang : "";
  return { kind: "code", code, lang: safeLang };
}

/**
 * The prose entries only. Read time counts words at a prose rate, and a
 * forty-line script is not read at prose speed -- counting it inflated every
 * estimate the moment code blocks existed.
 */
export function proseOnly(content: string[]): string[] {
  return content.filter((entry) => parseContentBlock(entry).kind === "text");
}

/**
 * The text a search query should match against.
 *
 * Code belongs in the index -- someone looking for make_pipeline should find
 * the article that uses it -- but the fence line does not. Indexing the raw
 * entry means the literal "```python" is searchable, so a query for "python"
 * matches the tag rather than anything the article says.
 */
export function searchableContent(content: string[]): string[] {
  return content.map((entry) => {
    const block = parseContentBlock(entry);
    return block.kind === "code" ? block.code : block.text;
  });
}

/**
 * The index of a prose paragraph at or after `preferred`, falling back to
 * searching backwards.
 *
 * The mid-article block is positioned by a fraction of the paragraph count. Land
 * that on a code block and the callout interrupts a script someone is trying to
 * read, which is the one place in the article where breaking the flow actually
 * costs the reader something.
 */
export function nearestProseIndex(content: string[], preferred: number): number {
  const isProse = (i: number) => content[i] !== undefined && parseContentBlock(content[i]).kind === "text";
  if (isProse(preferred)) return preferred;
  for (let step = 1; step < content.length; step += 1) {
    if (isProse(preferred + step)) return preferred + step;
    if (isProse(preferred - step)) return preferred - step;
  }
  return preferred;
}
