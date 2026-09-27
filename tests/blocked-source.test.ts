import { describe, it, expect } from "vitest";
import { isBlockedSource as fromApp } from "@/lib/blocked-source";
// @ts-expect-error - plain .mjs script helper, no types
import { isBlockedSource as fromScripts } from "../scripts/lib/blocked-source.mjs";

/**
 * One table, both copies.
 *
 * There were four versions of this predicate in the repo and they disagreed:
 * the health verifier certified items the ingest gate was written to drop. App
 * code cannot import the .mjs helper (allowJs is off), so the two copies stay
 * honest by being tested together -- a divergence fails here rather than in
 * production.
 */
const CASES: Array<[string, Record<string, string>, boolean]> = [
  ["a plain arXiv abstract", { href: "https://arxiv.org/abs/2401.00001" }, true],
  ["an arXiv subdomain", { href: "https://export.arxiv.org/api/query" }, true],
  ["uppercase in the host", { href: "https://ARXIV.ORG/abs/1" }, true],
  // A hostname is legally written with a trailing dot; an exact-match host
  // check stopped recognising this one.
  ["a fully qualified host", { href: "https://arxiv.org./abs/2401.00001" }, true],
  ["a host with a trailing dot on a subdomain", { href: "https://export.arxiv.org./api" }, true],
  // new URL() refuses both of these, so a host-only check saw nothing at all.
  ["no scheme", { href: "arxiv.org/abs/1" }, true],
  ["protocol-relative", { href: "//arxiv.org/abs/1" }, true],
  ["a reader proxy carrying the real URL", { href: "https://r.jina.ai/https://arxiv.org/abs/1" }, true],
  ["a source named for it", { href: "https://example.com/x", source: "arXiv cs.LG" }, true],
  ["a feed named for it", { href: "https://example.com/x", sourceFeed: "arXiv listing" }, true],
  // Deliberate over-blocking: this is a denylist, so a lookalike host costs one
  // operator review, while missing a real one publishes what policy forbids.
  ["a lookalike host", { href: "https://arxiv.org.example.com/x" }, true],

  ["an unrelated vendor blog", { href: "https://openai.com/index/gpt", source: "OpenAI" }, false],
  ["a word that merely contains it", { href: "https://example.com/quasiarxivism" }, false],
  ["nothing at all", {}, false]
];

describe.each([
  ["src/lib/blocked-source.ts", fromApp],
  ["scripts/lib/blocked-source.mjs", fromScripts]
])("isBlockedSource (%s)", (_label, isBlockedSource) => {
  it.each(CASES)("%s", (_case, item, expected) => {
    expect(isBlockedSource(item)).toBe(expected);
  });
});
