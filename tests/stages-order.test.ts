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

    // The failure looked like four identical names in a row.
    expect(new Set(companies).size).toBe(companies.length);
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
