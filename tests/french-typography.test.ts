import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * French puts a space before : ; ! and ?
 *
 * Twenty reader-facing strings were missing it — "Impact CS:", "Prochaine
 * étape:", "Roadmap stage IA:", "Résultats pour:" — while the September posts
 * and the comparison pages get it right throughout. It is the kind of error a
 * French reader notices immediately and an English author never sees, which is
 * exactly why it needs a test rather than care.
 *
 * The space is U+00A0, matching what the existing content already uses, so the
 * punctuation cannot wrap to the next line on its own.
 *
 * Two things this must NOT flag, both of which appear in the real content:
 * English prose (`"I got 0.94" invites one question: can you show me?`) and
 * literal code or config names quoted inside French prose (`Mettez fail-fast:
 * false`, `l'option cache:`). So a candidate must look like French and must not
 * look like code.
 */
const ROOTS = ["src/app", "src/content", "src/components", "src/i18n", "src/lib"];
/**
 * No exemptions. Two files were held by concurrent work when this test was
 * written -- compare/[slug] and news/live -- and both are fixed, so the list
 * that named them is gone rather than left as a quietly narrower scan.
 */
const PENDING = new Set<string>();

/** An accented letter is the cheapest reliable signal that a string is French. */
const LOOKS_FRENCH = /[éèêëàâîïôöûùüçœ]/;
/** Anything that smells of code, a path, a URL, a time or a version. */
const LOOKS_LIKE_CODE = /https?:|\bnpm\b|--|[{}()[\]=<>|]|\$\{|\\n|@\/|::|\d\s*:\s*\d/;
/**
 * A hyphenated or dotted identifier right before the colon is a config key
 * being quoted inside French prose, not French punctuation. "Mettez fail-fast:
 * false" must keep its bare colon, because that is how the option is spelled.
 */
const CODE_KEY_BEFORE_PUNCT = /[\w.]+[-_.][\w.]+\s*[:;]/;
const BARE_PUNCT = /\S[:;!?]\s/;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const offenders: string[] = [];
for (const file of ROOTS.flatMap(sourceFiles)) {
  if (PENDING.has(file)) continue;
  const text = readFileSync(file, "utf8");
  text.split("\n").forEach((line, index) => {
    for (const match of line.matchAll(/"((?:[^"\\]|\\.){15,400})"/g)) {
      const str = match[1];
      if (!LOOKS_FRENCH.test(str)) continue;
      if (LOOKS_LIKE_CODE.test(str)) continue;
      if (!BARE_PUNCT.test(str)) continue;
      if (CODE_KEY_BEFORE_PUNCT.test(str)) continue;
      const hit = str.match(/.{0,24}\S[:;!?]\s.{0,10}/)?.[0] ?? str.slice(0, 40);
      offenders.push(`${file}:${index + 1} …${hit}…`);
    }
  });
}

describe("French typography", () => {
  it("scans enough French to be meaningful", () => {
    // Guard against the scan silently matching nothing.
    const frenchStrings = ROOTS.flatMap(sourceFiles)
      .map((f) => readFileSync(f, "utf8"))
      .join("\n")
      .split("\n")
      .filter((line) => LOOKS_FRENCH.test(line)).length;
    expect(frenchStrings).toBeGreaterThan(400);
  });

  it("puts a space before a colon, semicolon, exclamation or question mark", () => {
    expect(offenders).toEqual([]);
  });
});
