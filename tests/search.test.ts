import { describe, it, expect } from "vitest";
import { matchesAllTerms, searchTerms } from "@/lib/search";

const post = [
  "Prompt injection is not a bug you can patch",
  "Why LLM guardrails fail and what to do instead",
  "Security & Performance",
  "llm",
  "We tested this against Claude and other assistants in a storage-backed demo."
];

describe("search", () => {
  // Each of these is a query that failed on the live site.
  it("finds a word that appears only in the article body", () => {
    expect(matchesAllTerms(searchTerms("claude"), post)).toBe(true);
  });

  it("matches two words that are not adjacent", () => {
    // The old filter joined everything and asked for one contiguous substring,
    // so any two words with anything between them found nothing.
    expect(matchesAllTerms(searchTerms("prompt patch"), post)).toBe(true);
    expect(matchesAllTerms(searchTerms("injection guardrails"), post)).toBe(true);
  });

  it("does not match a word fragment inside another word", () => {
    // "rag" used to match "storage" and returned ten irrelevant posts.
    expect(matchesAllTerms(searchTerms("rag"), post)).toBe(false);
  });

  it("still matches a prefix of a real word", () => {
    expect(matchesAllTerms(searchTerms("secur"), post)).toBe(true);
  });

  it("requires every term, not any", () => {
    expect(matchesAllTerms(searchTerms("prompt kubernetes"), post)).toBe(false);
  });

  it("ignores accents in either direction", () => {
    const french = ["La cybersécurité pour les étudiants", "Guide pratique"];
    expect(matchesAllTerms(searchTerms("cybersecurite"), french)).toBe(true);
    expect(matchesAllTerms(searchTerms("cybersécurité"), french)).toBe(true);
    expect(matchesAllTerms(searchTerms("etudiants"), french)).toBe(true);
  });

  it("treats an empty query as matching everything", () => {
    expect(searchTerms("   ")).toEqual([]);
    expect(matchesAllTerms([], post)).toBe(true);
  });

  it("does not let a query break the regex", () => {
    expect(() => matchesAllTerms(searchTerms("c++ (test) [a]"), post)).not.toThrow();
    expect(matchesAllTerms(searchTerms("*"), post)).toBe(false);
  });

  it("collapses whitespace between terms", () => {
    expect(searchTerms("  prompt    injection ")).toEqual(["prompt", "injection"]);
  });
});


import { sanitizeSearchInputLive, sanitizeSearchQuery } from "@/lib/input";

// The reported bug: typing "claude ai and openai" into the header search box
// produced "claudeaiandopenai". sanitizeSearchQuery ends in .trim(), it ran on
// every keystroke, and a space is trailing whitespace at the instant you type
// it, so every space was deleted before it reached the input.
describe("typing a space in the search box", () => {
  it("keeps a space the moment it is typed", () => {
    expect(sanitizeSearchInputLive("claude ")).toBe("claude ");
  });

  it("survives typing a whole phrase one character at a time", () => {
    const target = "claude ai and openai";
    let value = "";
    for (const ch of target) value = sanitizeSearchInputLive(value + ch);
    expect(value).toBe(target);
  });

  it("is exactly what the old sanitiser got wrong", () => {
    expect(sanitizeSearchQuery("claude ")).toBe("claude");
    let value = "";
    for (const ch of "claude ai") value = sanitizeSearchQuery(value + ch);
    expect(value).toBe("claudeai");
  });

  it("still collapses an accidental double space", () => {
    expect(sanitizeSearchInputLive("claude  ai")).toBe("claude ai");
  });

  it("still strips control characters and caps the length", () => {
    expect(sanitizeSearchInputLive("a" + String.fromCharCode(0) + "b")).toBe("a b");
    expect(sanitizeSearchInputLive("x".repeat(200)).length).toBe(120);
  });

  it("still trims once the query is finished", () => {
    expect(sanitizeSearchQuery(" claude ai ")).toBe("claude ai");
  });
});
