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
