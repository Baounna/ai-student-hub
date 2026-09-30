import { describe, it, expect } from "vitest";
import { getStages, getOpenStages } from "@/content/stages";

/**
 * Only four of the eighty-two listings carry a deadline, so the other
 * seventy-eight fell through every rule to the alphabetical tiebreak and came
 * out grouped by employer -- four consecutive Armée de l'Air rows inside the
 * first six, Capgemini's ten together further down. A reader scanning for a
 * city saw one company repeated instead of the range the list covers.
 */
describe("internship ordering", () => {
  const stages = getStages();

  it("keeps every listing", () => {
    expect(stages).toHaveLength(getOpenStages().length + stages.filter((s) => !getOpenStages().includes(s)).length);
    expect(new Set(stages.map((s) => s.id)).size).toBe(stages.length);
  });

  it("puts dated listings first, in deadline order", () => {
    const dated = stages.filter((s) => s.deadline);
    const firstUndated = stages.findIndex((s) => !s.deadline);
    const lastDated = stages.map((s) => Boolean(s.deadline)).lastIndexOf(true);

    if (dated.length && firstUndated !== -1) expect(lastDated).toBeLessThan(stages.length);
    const deadlines = dated.map((s) => s.deadline as string);
    expect(deadlines).toEqual([...deadlines].sort());
  });

  it("does not let one employer own the opening rows", () => {
    const companies = stages.slice(0, 12).map((s) => s.company);
    const worst = Math.max(...[...new Set(companies)].map((c) => companies.filter((x) => x === c).length));

    // Not "all twelve distinct": the largest employer holds 10 of the 81
    // listings, so appearing twice in twelve rows is its share and demanding
    // fewer would be demanding it appear less often than it exists. What the
    // failure actually looked like was one name repeated back to back.
    expect(worst).toBeLessThanOrEqual(2);
    expect(new Set(companies).size).toBeGreaterThanOrEqual(9);
  });

  it("never puts the same employer in two consecutive rows", () => {
    // Round-robin fixed the opening rows and stranded the tail: Capgemini has
    // 10 of the 81 listings and the next deepest employer has 6, so once the
    // others ran out its remainder landed consecutively -- the last four rows
    // were the same employer. Spreading each employer across the full length
    // instead removes it everywhere, not just at the top.
    const companies = stages.map((s) => s.company);
    const repeats = companies.filter((c, i) => i > 0 && c === companies[i - 1]);

    expect(repeats).toEqual([]);
  });

  it("shows a range of cities early, not one employer's offices", () => {
    const cities = new Set(stages.slice(0, 20).map((s) => s.city));

    expect(cities.size).toBeGreaterThanOrEqual(10);
  });

  it("is deterministic, so the page does not reshuffle between builds", () => {
    expect(getStages().map((s) => s.id)).toEqual(getStages().map((s) => s.id));
  });

  it("surfaces the Morocco listings rather than burying them by initial", () => {
    // Nine of eighty-two. They should not all sit past the halfway mark.
    const positions = stages.map((s, i) => (s.country === "MA" ? i : -1)).filter((i) => i >= 0);

    expect(positions.length).toBeGreaterThan(0);
    expect(Math.min(...positions)).toBeLessThan(stages.length / 4);
  });
});
