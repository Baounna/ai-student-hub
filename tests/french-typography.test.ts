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
/**
 * The punctuation may be the last character of the string.
 *
 * This required whitespace AFTER the colon, so a label that ends in one --
 * "Récemment en vedette:" on the home page, rendered inside its own <span> --
 * was invisible to this scan from the day it was written.
 */
const BARE_PUNCT = /\S[:;!?](\s|$)/;

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

/**
 * A colon that is JSX text rather than part of a string.
 *
 * `{locale === "fr" ? "Dernière synchronisation" : "Last sync"}: {date}` puts
 * the punctuation outside every literal, so no scan of literals could reach it.
 * Nine labels were written that way, across the home page, /blog, /news,
 * /news/live, /compare, /compare/[slug], /stages and the error page, and the
 * French half of all of them read "Dernière synchronisation: 4 nov. 2026".
 * src/i18n/typography.ts exists so the colon is inside a function again.
 *
 * A TypeScript type annotation is also `}:` -- `({ locale }: { locale: Locale })`
 * -- hence the second clause. An aria-label is deliberately not covered: the
 * space is a typographic convention for text a reader sees, and a screen
 * reader announces nothing differently for it.
 */
const JSX_TEXT_PUNCT = /\}:/;
/**
 * `}:` in TypeScript is almost always a type annotation, so the scan has to be
 * able to tell them apart or it reports every destructured component prop:
 *
 *   ({ locale }: { locale: Locale })      a type -- an object type with keys
 *   ({ items, locale = "en" }: Props)     a type -- a named one
 *   {copy.updated}: {copy.daysAgo(days)}  JSX text -- the bug
 *
 * The distinguishing mark is what follows: an object TYPE has `key:` inside its
 * braces, where a JSX expression container has an expression.
 */
const TYPE_ANNOTATION = /\}:\s*(\{\s*\w+\??[:;]|\{\s*\}|[A-Z]|\()/;
/**
 * A colon rendered after an expression is only this bug when the expression
 * is a label the French side also sees. Narrowing to that keeps each finding
 * specific enough to act on.
 */
const LABELLED_EXPRESSION = /\{[^{}]*(locale|\bfr\b|dict\.|copy\.|[Ll]abel)[^{}]*\}:/;

const offenders: string[] = [];
for (const file of ROOTS.flatMap(sourceFiles)) {
  if (PENDING.has(file)) continue;
  const text = readFileSync(file, "utf8");
  text.split("\n").forEach((line, index) => {
    // A comment is not rendered, and the ones in this repository quote the bug
    // they describe -- including, now, the example in src/i18n/typography.ts.
    const trimmed = line.trim();
    if (trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.startsWith("/*")) return;

    // Quoted strings and template literals alike. A template literal's
    // interpolations become a placeholder first, so `${count} résultats` is
    // still judged as prose rather than discarded as code.
    const literals = [
      ...[...line.matchAll(/"((?:[^"\\]|\\.){10,400})"/g)].map((m) => m[1]),
      ...[...line.matchAll(/`([^`]{10,400})`/g)].map((m) => m[1].replace(/\$\{[^}]*\}/g, "X"))
    ];

    for (const str of literals) {
      if (!LOOKS_FRENCH.test(str)) continue;
      if (LOOKS_LIKE_CODE.test(str)) continue;
      if (!BARE_PUNCT.test(str)) continue;
      if (CODE_KEY_BEFORE_PUNCT.test(str)) continue;
      const hit = str.match(/.{0,24}\S[:;!?](\s|$).{0,10}/)?.[0] ?? str.slice(0, 40);
      offenders.push(`${file}:${index + 1} …${hit}…`);
    }

    if (!JSX_TEXT_PUNCT.test(line)) return;
    if (TYPE_ANNOTATION.test(line)) return;
    if (line.includes("aria-label")) return;
    // A colon rendered after an expression is only this bug when the
    // expression is a label the French side also sees. Narrowing to that keeps
    // the finding specific enough to act on.
    if (!LABELLED_EXPRESSION.test(line)) return;
    offenders.push(`${file}:${index + 1} (colon outside the string) ${line.trim().slice(0, 60)}`);
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

  /**
   * An empty offender list means either a clean codebase or a scan that can no
   * longer see anything, and the second is what this test did for a year while
   * nine labels shipped with a bare colon. These are the three shapes it used
   * to miss, each held against the real detector.
   */
  describe("can still see the shapes it used to miss", () => {
    const literalOffends = (str: string) =>
      LOOKS_FRENCH.test(str) &&
      !LOOKS_LIKE_CODE.test(str) &&
      BARE_PUNCT.test(str) &&
      !CODE_KEY_BEFORE_PUNCT.test(str);

    const jsxOffends = (line: string) =>
      JSX_TEXT_PUNCT.test(line) &&
      !TYPE_ANNOTATION.test(line) &&
      !line.includes("aria-label") &&
      LABELLED_EXPRESSION.test(line);

    it("catches a colon that ends the string", () => {
      expect(literalOffends("Récemment en vedette:")).toBe(true);
      expect(literalOffends("Récemment en vedette\u00a0:")).toBe(false);
    });

    it("catches a template literal", () => {
      expect(literalOffends("1. Thème: X")).toBe(true);
      expect(literalOffends("Opérateur: X. Contact: ")).toBe(true);
    });

    it("catches a colon rendered outside the string", () => {
      expect(jsxOffends('{locale === "fr" ? "Dernière synchro" : "Last sync"}: {date}')).toBe(true);
      expect(jsxOffends("{copy.updated}: {copy.daysAgo(ageDays)}")).toBe(true);
      expect(jsxOffends("{dict.news.impact}:</span>")).toBe(true);
    });

    it("leaves a type annotation alone", () => {
      expect(jsxOffends("function UpdateStream({ updates, locale }: { updates: Item[]; locale: Locale }) {")).toBe(false);
      expect(jsxOffends('export function BackToTop({ locale = "en" }: { locale?: Locale }) {')).toBe(false);
    });

    it("leaves English prose and quoted config keys alone", () => {
      expect(literalOffends('I got 0.94 — one question: can you show me?')).toBe(false);
      expect(literalOffends("Mettez fail-fast: false dans la config")).toBe(false);
    });
  });
});
