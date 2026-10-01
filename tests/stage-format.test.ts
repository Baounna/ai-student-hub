import { describe, it, expect } from "vitest";
import { getStages } from "@/content/stages";
import { formatDuration, formatLevel } from "@/lib/stage-format";

/**
 * 52 of 109 rows on the ENGLISH internship page read "3 MOIS MINIMUM" and
 * "12 SEMAINES", beside a fully translated "INTERNSHIP · HYBRID · UNITED
 * KINGDOM" — and two rows on the French page read "3-6 MONTHS". The fields are
 * copied from employers who write in their own language, so the fix has to be
 * formatting rather than a one-off translation pass: a listing added next week
 * must come out right without anyone remembering.
 */
describe("formatDuration", () => {
  it.each([
    ["6 mois", "6 months", "6 mois"],
    ["3 mois", "3 months", "3 mois"],
    ["6 months", "6 months", "6 mois"],
    ["12 weeks", "12 weeks", "12 semaines"],
    ["6 semaines", "6 weeks", "6 semaines"],
    ["1 an", "1 year", "1 an"],
    ["3-6 months", "3-6 months", "3-6 mois"],
    ["4-6 months", "4-6 months", "4-6 mois"],
    ["12-14 weeks", "12-14 weeks", "12-14 semaines"],
    ["16 weeks", "16 weeks", "16 semaines"],
    ["6 mois minimum", "6 months minimum", "6 mois minimum"],
    ["9 mois ou plus", "9 months or longer", "9 mois ou plus"]
  ])("%s", (raw, en, fr) => {
    expect(formatDuration(raw, "en")).toBe(en);
    expect(formatDuration(raw, "fr")).toBe(fr);
  });

  it("keeps a trailing detail the employer wrote, in the reader's language", () => {
    // The hours matter to whoever is deciding whether they can fit the role
    // around classes, so the detail is kept. It just does not stay in French
    // on the English page.
    expect(formatDuration("12 mois, 15h/semaine", "en")).toBe("12 months 15h/week");
    expect(formatDuration("12 mois, 15h/semaine", "fr")).toBe("12 mois 15h/semaine");
  });

  it("passes through anything it cannot parse rather than dropping it", () => {
    // Showing the employer's own words beats showing nothing.
    expect(formatDuration("variable", "en")).toBe("variable");
    expect(formatDuration("", "en")).toBe("");
    expect(formatDuration(undefined, "fr")).toBe("");
  });
});

describe("formatLevel", () => {
  it("keeps the French scale for French readers", () => {
    expect(formatLevel("Bac+5", "fr")).toBe("Bac+5");
    expect(formatLevel("Bac+3/Bac+5", "fr")).toBe("Bac+3/Bac+5");
  });

  it("gives English readers a scale that exists where they live", () => {
    // "Bac+5" was rendering on UK, US, Canadian, German, Dutch and Portuguese
    // rows, where it means nothing.
    expect(formatLevel("Bac+5", "en")).toBe("Master's");
    expect(formatLevel("Bac+3", "en")).toBe("Bachelor's");
    expect(formatLevel("Doctorat", "en")).toBe("PhD");
    expect(formatLevel("PhD", "fr")).toBe("Doctorat");
  });

  it("passes through an unmapped level unchanged", () => {
    expect(formatLevel("Something else", "en")).toBe("Something else");
  });
});

describe("every value in the data formats in both languages", () => {
  const stages = getStages();

  it("leaves no French duration on the English page", () => {
    const leaked = stages
      .map((s) => formatDuration(s.duration, "en"))
      .filter((d) => /\b(mois|semaines?|an|ans|ou plus)\b/i.test(d));

    expect(leaked).toEqual([]);
  });

  it("leaves no English duration on the French page", () => {
    const leaked = stages
      .map((s) => formatDuration(s.duration, "fr"))
      .filter((d) => /\b(month|months|week|weeks|year|years|or longer)\b/i.test(d));

    expect(leaked).toEqual([]);
  });

  it("leaves no Bac+ scale on the English page", () => {
    const leaked = stages.map((s) => formatLevel(s.level, "en")).filter((l) => /bac\+/i.test(l));

    expect(leaked).toEqual([]);
  });

  it("leaves no English level wording on the French page", () => {
    const leaked = stages
      .map((s) => formatLevel(s.level, "fr"))
      .filter((l) => /\b(bachelor|master|phd|year of study|final-year)\b/i.test(l));

    expect(leaked).toEqual([]);
  });

  it("recognises every level and duration the board actually contains", () => {
    // Pass-through is the right failure for one odd value, but it is also how a
    // French string reaches the English page unnoticed. If a listing arrives
    // with a shape the map does not know, this fails here rather than on the
    // page: both locales rendering the raw value identically means neither was
    // translated.
    const unmapped = stages
      .filter((s) => s.level && formatLevel(s.level, "en") === formatLevel(s.level, "fr"))
      .map((s) => `${s.id}: ${s.level}`);

    expect(unmapped).toEqual([]);
  });
});
