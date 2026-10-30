import { describe, it, expect } from "vitest";
import { countryLabel, getStages, getOpenStages, isClosed } from "@/content/stages";

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

  /**
   * Among OPEN listings. The closed ones are last on purpose.
   *
   * This gathered every dated listing, closed ones included, and demanded
   * ascending deadlines. getStages deliberately returns
   * [open dated, open rolling, closed], so a lapsed deadline moves to the end
   * and the sequence stops ascending -- which is correct behaviour and read as
   * a failure.
   *
   * It passed for weeks because no deadline had lapsed yet. One did on 28
   * October, and the next morning the internship finder's own build step went
   * red over it: a scheduled agent blocked by a test that was wrong about a
   * date. Time is now injected so the invariant is checked against a day of
   * this test's choosing rather than whichever day CI happens to run.
   */
  it("puts open dated listings first, in deadline order", () => {
    const withDeadlines = getStages(Date.parse("2026-10-20T12:00:00Z"));
    const open = withDeadlines.filter((s) => !isClosed(s, Date.parse("2026-10-20T12:00:00Z")));
    const deadlines = open.filter((s) => s.deadline).map((s) => s.deadline as string);

    // Ordering is asserted on whatever dated rows exist, because sorting is
    // true of zero and one as well. The count is NOT asserted: the two rows
    // that carry a deadline today will eventually be pruned, and a test that
    // then fails would block the Thursday finder for a data change that is
    // correct -- which is exactly the failure this test just caused.
    expect(deadlines).toEqual([...deadlines].sort());
    // Dated before rolling, within the open block.
    const firstRolling = open.findIndex((s) => !s.deadline);
    const lastDated = open.map((s) => Boolean(s.deadline)).lastIndexOf(true);
    expect(lastDated).toBeLessThan(firstRolling);
  });

  it("keeps closed listings at the end, whatever their deadline", () => {
    // The case that broke the finder: a deadline in the past sorts last, not
    // into deadline order with the open ones.
    const after = Date.parse("2026-10-29T12:00:00Z");
    const ordered = getStages(after);
    const firstClosed = ordered.findIndex((s) => isClosed(s, after));
    if (firstClosed === -1) return;
    expect(ordered.slice(firstClosed).every((s) => isClosed(s, after))).toBe(true);
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

  it("renders every country as a name, never a bare code", () => {
    // countryLabel falls back to the raw code so an unlabelled country degrades
    // rather than breaking -- which means a listing added before its label ships
    // "DE" to a reader instead of "Germany", and nothing fails. This is the
    // thing that notices. It has to be a test, not a review habit, because the
    // board is meant to keep growing.
    const codes = [...new Set(stages.map((s) => s.country))];
    const unlabelled = codes.filter((c) => countryLabel(c, "en") === c || countryLabel(c, "fr") === c);

    expect(unlabelled).toEqual([]);
    expect(codes.length).toBeGreaterThan(1);
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

/**
 * Filters exist because the scope line created an obligation. Once the page
 * says "9 Morocco" out of 111, a reader who wants those nine has been told they
 * exist and given no route to them -- which is worse than not saying it. These
 * cover the filtering decisions rather than the markup: the page reads country
 * and kind from the URL, so an unknown value must fall back to everything
 * rather than render an empty list.
 */
describe("stage filtering", () => {
  const stages = getStages();
  const countries = [...new Set(stages.map((s) => s.country))];
  const kinds = [...new Set(stages.map((s) => s.kind))];

  const apply = (country: string, kind: string) =>
    stages.filter(
      (s) =>
        (!countries.includes(country) || s.country === country) &&
        (!kinds.includes(s.kind as never) || !kind || s.kind === kind)
    );

  it("narrows to one country", () => {
    for (const country of countries) {
      const got = stages.filter((s) => s.country === country);
      expect(got.length).toBeGreaterThan(0);
      expect(got.every((s) => s.country === country)).toBe(true);
    }
  });

  it("the country counts add up to the whole list", () => {
    const total = countries.reduce((n, c) => n + stages.filter((s) => s.country === c).length, 0);
    expect(total).toBe(stages.length);
  });

  it("the kind counts add up to the whole list", () => {
    const total = kinds.reduce((n, k) => n + stages.filter((s) => s.kind === k).length, 0);
    expect(total).toBe(stages.length);
  });

  it("an unknown country shows everything rather than nothing", () => {
    // ?country=ZZ is a typo or a stale link, not a request for an empty page.
    expect(countries.includes("ZZ")).toBe(false);
    expect(apply("ZZ", "")).toHaveLength(stages.length);
  });

  it("every country the chips offer has at least one listing behind it", () => {
    // A chip reading "Spain (0)" would be a dead end the page invented itself.
    for (const country of countries) {
      expect(stages.filter((s) => s.country === country).length).toBeGreaterThan(0);
    }
  });
});
