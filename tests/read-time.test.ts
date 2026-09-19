import { describe, it, expect } from "vitest";
import { formatReadTime, readMinutes } from "@/lib/read-time";

describe("formatReadTime", () => {
  // Reading time is measured once from the English body, so the stored value
  // is an English string. Rendering it raw put "Lecture en 7 min read." on
  // every French post — a French sentence wrapped around an English fragment.
  it("reads as French on the French pages", () => {
    expect(formatReadTime("7 min read", "fr")).toBe("7 min de lecture");
    expect(formatReadTime("7 min read", "en")).toBe("7 min read");
  });

  it("never leaks the English unit into French", () => {
    expect(formatReadTime("12 min read", "fr")).not.toContain("read");
  });

  it("returns nothing rather than a broken label when the value is unusable", () => {
    for (const bad of ["", "soon", "0 min read", "-3 min read"]) {
      expect(formatReadTime(bad, "en")).toBe("");
      expect(formatReadTime(bad, "fr")).toBe("");
    }
  });
});

describe("readMinutes", () => {
  it("extracts the number for sentences that need it bare", () => {
    // "2. ${post.readTime} reading time." rendered "7 min read reading time."
    expect(readMinutes("7 min read")).toBe(7);
    expect(readMinutes("12 min read")).toBe(12);
  });

  it("is 0 for anything it cannot parse", () => {
    expect(readMinutes("")).toBe(0);
    expect(readMinutes("about ten")).toBe(0);
  });
});
