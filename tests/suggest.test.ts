import { describe, it, expect } from "vitest";
import { rankSuggestions, highlightParts, type Suggestion } from "@/lib/suggest";

const E = (t: string, k: Suggestion["k"], s?: string): Suggestion => ({ t, h: "/x", k, s });

const catalogue: Suggestion[] = [
  E("AI Fundamentals Every CS Student Should Know", "guide"),
  E("How to Read an AI Paper", "guide"),
  E("Your Model Is Not That Good", "guide"),
  E("Best Cloud Platform for Student AI Projects", "compare"),
  E("Claude", "tool", "Assistant"),
  E("Stage - Analyste Cybersecurite", "internship", "Sopra Steria, Paris"),
  E("Internship - AI Research", "internship", "Airbus, Toulouse")
];

describe("search suggestions", () => {
  it("suggests nothing for an empty query", () => {
    expect(rankSuggestions("", catalogue)).toEqual([]);
    expect(rankSuggestions("   ", catalogue)).toEqual([]);
  });

  it("puts a label that starts with the query above one that merely contains it", () => {
    const out = rankSuggestions("ai", catalogue).map((s) => s.t);
    expect(out[0]).toBe("AI Fundamentals Every CS Student Should Know");
    expect(out).toContain("How to Read an AI Paper");
  });

  /**
   * 85 internships against 24 guides: without a weight the largest group wins
   * every broad query and the reader never sees an article.
   */
  it("ranks a guide above an internship when both match", () => {
    const out = rankSuggestions("ai", catalogue);
    const guide = out.findIndex((s) => s.k === "guide");
    const internship = out.findIndex((s) => s.k === "internship");
    expect(guide).toBeGreaterThanOrEqual(0);
    expect(internship === -1 || guide < internship).toBe(true);
  });

  it("matches on the sub-label, so a company or city finds its listing", () => {
    expect(rankSuggestions("airbus", catalogue).map((s) => s.t)).toContain("Internship - AI Research");
    expect(rankSuggestions("toulouse", catalogue).map((s) => s.t)).toContain("Internship - AI Research");
  });

  // The behaviour the site's own search already guarantees, kept here because
  // suggestions are the first place a reader meets it.
  it("requires every term, in any order, at a word boundary", () => {
    expect(rankSuggestions("ai student", catalogue).length).toBeGreaterThan(0);
    expect(rankSuggestions("student ai", catalogue).length).toBeGreaterThan(0);
    expect(rankSuggestions("rag", catalogue)).toEqual([]); // must not match "storage"-style substrings
  });

  it("folds accents, because nobody types the accent into a search box", () => {
    expect(rankSuggestions("cybersecurite", catalogue).length).toBe(1);
    expect(rankSuggestions("cybersécurité", catalogue).length).toBe(1);
  });

  it("never returns more than the limit", () => {
    const many = Array.from({ length: 50 }, (_, i) => E(`AI thing ${i}`, "guide"));
    expect(rankSuggestions("ai", many, 8)).toHaveLength(8);
  });

  it("is deterministic for equal scores, so the list does not reshuffle", () => {
    const a = rankSuggestions("ai", catalogue).map((s) => s.t);
    const b = rankSuggestions("ai", catalogue).map((s) => s.t);
    expect(a).toEqual(b);
  });
});

describe("highlighting the matched part", () => {
  it("splits into plain and matched runs starting with plain", () => {
    expect(highlightParts("AI Paper", "pa")).toEqual(["AI ", "Pa", "per"]);
  });

  it("returns the label untouched when nothing matches", () => {
    expect(highlightParts("AI Paper", "zzz")).toEqual(["AI Paper"]);
    expect(highlightParts("AI Paper", "")).toEqual(["AI Paper"]);
  });

  it("keeps the original casing and accents of the label", () => {
    expect(highlightParts("Cybersécurité", "cyber").join("")).toBe("Cybersécurité");
  });

  // Two terms landing on the same word must not split a character between them.
  it("merges overlapping matches", () => {
    expect(highlightParts("Cloud Platform", "cloud clo").join("")).toBe("Cloud Platform");
    expect(highlightParts("Cloud Platform", "cloud clo")).toEqual(["", "Cloud", " Platform"]);
  });

  it("rejoins to exactly the original label for every query", () => {
    for (const q of ["ai", "ai paper", "p", "read an"]) {
      expect(highlightParts("How to Read an AI Paper", q).join("")).toBe("How to Read an AI Paper");
    }
  });
});

/**
 * The catalogue genuinely repeats: the same internship role appears at three
 * or four Capgemini cities, and every internship row links to /stages. Four
 * identical-looking rows to the same page is noise -- and because the rendered
 * React key was built from kind, href and label, those rows also collided,
 * which left a stale row on screen when the list shrank. Typing "cve" showed
 * "Coursera" above the CVE guide, still carrying the id of the slot it used to
 * sit in.
 */
describe("repeated entries", () => {
  const repeated: Suggestion[] = [
    { t: "Analyste SOC - Stage", h: "/en/stages", k: "internship", s: "Capgemini, Lyon" },
    { t: "Analyste SOC - Stage", h: "/en/stages", k: "internship", s: "Capgemini, Valbonne" },
    { t: "Analyste SOC - Stage", h: "/en/stages", k: "internship", s: "Capgemini, Nantes" },
    { t: "Coursera", h: "/en/resources", k: "tool", s: "Blog" },
    { t: "Coursera", h: "/en/resources", k: "tool", s: "Course Platform" }
  ];

  it("shows one row per destination and label", () => {
    expect(rankSuggestions("analyste", repeated).length).toBe(1);
    expect(rankSuggestions("coursera", repeated).length).toBe(1);
  });

  it("still matches on a sub-label that only one duplicate has", () => {
    // Collapsing happens on the way out, so the index keeps every city.
    expect(rankSuggestions("valbonne", repeated).map((s) => s.t)).toEqual(["Analyste SOC - Stage"]);
    expect(rankSuggestions("nantes", repeated).map((s) => s.t)).toEqual(["Analyste SOC - Stage"]);
  });

  it("produces a unique render key for every returned row", () => {
    const rows = rankSuggestions("a", repeated, 8);
    const keys = rows.map((r) => `${r.k}|${r.h}|${r.t}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("still fills the limit when there are enough distinct rows", () => {
    const distinct: Suggestion[] = Array.from({ length: 12 }, (_, i) => ({
      t: `AI thing ${i}`,
      h: `/en/blog/ai-${i}`,
      k: "guide"
    }));
    expect(rankSuggestions("ai", [...distinct, ...repeated], 8)).toHaveLength(8);
  });
});
