import { describe, it, expect } from "vitest";
import payload from "../src/content/stages.json";

/**
 * The same employer, in the same city, in two different countries.
 *
 * Two Figma roles in San Francisco sat on the board as Canada while two others
 * in San Francisco sat there as the United States, because the finder read the
 * "CA" in "San Francisco, CA" as Canada rather than California. They were on
 * the live site for eleven days, reachable from the country filter -- which is
 * the control students actually use, so the listing was not merely mislabelled,
 * it was in the wrong place for anyone looking.
 *
 * splitLocation now refuses to resolve a colliding code without a second
 * signal. This is the check on the result: whatever the parser decides, one
 * employer in one city cannot be in two countries.
 */
describe("stages country consistency", () => {
  it("never places one employer's city in two different countries", () => {
    const seen = new Map<string, Set<string>>();
    for (const item of payload.items) {
      if (!item.city) continue;
      const key = `${item.company}|${item.city}`.toLowerCase();
      if (!seen.has(key)) seen.set(key, new Set());
      seen.get(key)!.add(item.country);
    }
    const contradictions = [...seen.entries()]
      .filter(([, countries]) => countries.size > 1)
      .map(([key, countries]) => `${key} -> ${[...countries].join(" and ")}`);
    expect(contradictions).toEqual([]);
  });

  it("leaves no city field carrying a separator, which means two places in one row", () => {
    const smushed = payload.items
      .filter((item) => /[;•]/.test(item.city ?? ""))
      .map((item) => `${item.company}: ${item.city}`);
    expect(smushed).toEqual([]);
  });
});

/**
 * The same role in ten cities is not ten duplicates.
 *
 * Capgemini currently lists "Ingénieur Cybersécurité GRC - Stage" in Lille,
 * Mérignac, Nantes and Toulouse, with a distinct posting URL for each — which
 * is why the generated id carries the city, and why a bare company+role check
 * would delete nine real openings. What must never repeat is the exact
 * posting: one employer, one role, one city.
 */
describe("stages are distinct without being over-merged", () => {
  it("never lists the same role twice in the same city", () => {
    const seen = new Map<string, number>();
    for (const item of payload.items) {
      const key = `${item.company}|${item.role}|${item.city ?? ""}`.toLowerCase();
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    expect([...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k)).toEqual([]);
  });

  it("never lists the same posting URL twice", () => {
    const bare = payload.items.map((i) => i.href.split(/[?#]/)[0]);
    const dupes = bare.filter((h, n) => bare.indexOf(h) !== n);
    expect([...new Set(dupes)]).toEqual([]);
  });

  it("does not say a city twice in one field", () => {
    const repeated = payload.items
      .filter((item) => {
        const parts = (item.city ?? "").split(",").map((p) => p.trim().toLowerCase()).filter(Boolean);
        return new Set(parts).size !== parts.length;
      })
      .map((item) => `${item.company}: ${item.city}`);
    expect(repeated).toEqual([]);
  });
});
