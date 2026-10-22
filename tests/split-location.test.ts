import { describe, it, expect } from "vitest";
import {
  splitLocation
  // @ts-expect-error - plain .mjs script, no types
} from "../scripts/find-stages.mjs";

/**
 * A two-letter token is not a country just because it looks like one.
 *
 * "New York, NY; San Francisco, CA" was written to the board as Canada, because
 * the country branch ran before the state branch and CA is both California and
 * Canada. The same collision covers MA, DE, IN and IL -- and MA is the one that
 * matters most here: a Boston internship would have been filed under Morocco,
 * on the Morocco page of a site written in Morocco, under the filter students
 * use most.
 */
describe("splitLocation", () => {
  it("reads the state, not the country, when another part settles it", () => {
    expect(splitLocation("New York, NY; San Francisco, CA")).toEqual({
      city: "New York",
      country: "US"
    });
  });

  it("does not file Massachusetts under Morocco", () => {
    expect(splitLocation("Boston, MA; Austin, TX").country).not.toBe("MA");
  });

  it("leaves the country blank when nothing settles an ambiguous state code", () => {
    // Honest blank, not a guess: it goes to the review file for a person.
    expect(splitLocation("San Francisco, CA")).toEqual({ city: "San Francisco", country: "" });
    expect(splitLocation("Cambridge, MA")).toEqual({ city: "Cambridge", country: "" });
    expect(splitLocation("Wilmington, DE")).toEqual({ city: "Wilmington", country: "" });
  });

  it("still reads a spelled-out country, which is never ambiguous", () => {
    expect(splitLocation("Toronto, Canada")).toEqual({ city: "Toronto", country: "CA" });
    expect(splitLocation("Berlin, Germany")).toEqual({ city: "Berlin", country: "DE" });
    expect(splitLocation("Casablanca, Morocco")).toEqual({ city: "Casablanca", country: "MA" });
  });

  it("still reads an unambiguous state abbreviation", () => {
    expect(splitLocation("Austin, TX")).toEqual({ city: "Austin", country: "US" });
    expect(splitLocation("Santa Clara, NY")).toEqual({ city: "Santa Clara", country: "US" });
  });

  it("still reads Workday's country-first order", () => {
    expect(splitLocation("US, CA, Santa Clara")).toEqual({ city: "Santa Clara", country: "US" });
  });

  it("splits on a bullet as well as a semicolon", () => {
    expect(splitLocation("Paris, France • Lyon, France")).toEqual({
      city: "Paris",
      country: "FR"
    });
  });

  /**
   * Case is the signal, and the first fix for the CA/Canada collision threw it
   * away by uppercasing the tail before deciding.
   *
   * Greenhouse writes a US STATE in capitals -- "San Francisco, CA".
   * SmartRecruiters writes the COUNTRY in lower case -- "Casablanca, ma". For a
   * day, every lower-case one went to the review file unplaced: Moroccan,
   * German and Canadian postings, including a Moroccan cybersecurity internship,
   * which is the single most on-target listing this board can hold.
   */
  it("reads a lower-case code as the country, the way SmartRecruiters writes it", () => {
    expect(splitLocation("Casablanca, ma")).toEqual({ city: "Casablanca", country: "MA" });
    expect(splitLocation("Munich, de")).toEqual({ city: "Munich", country: "DE" });
    expect(splitLocation("Toronto, ca")).toEqual({ city: "Toronto", country: "CA" });
    expect(splitLocation("Puteaux, fr")).toEqual({ city: "Puteaux", country: "FR" });
  });

  it("keeps the city when both ends of the string resolve", () => {
    // "Luxembourg, lu" has a resolvable head, and the Workday country-first
    // branch returns the LAST part as the city -- so this was writing rows
    // whose city read "lu".
    expect(splitLocation("Luxembourg, lu")).toEqual({ city: "Luxembourg", country: "LU" });
    // Workday's real shapes still work.
    expect(splitLocation("China, Shanghai")).toEqual({ city: "Shanghai", country: "CN" });
  });

  it("settles an ambiguous code from any part, in either separator", () => {
    // The scan ran over `parts`, which stops at the first separator, so it could
    // never see the part that settles it. Order-dependent before this.
    expect(splitLocation("San Francisco, CA; New York, NY").country).toBe("US");
    expect(splitLocation("San Francisco, CA \u2022 New York, NY").country).toBe("US");
    expect(splitLocation("New York, NY; San Francisco, CA").country).toBe("US");
  });

  it("refuses a placeholder that names no place at all", () => {
    expect(splitLocation("3 locations")).toEqual({ city: "", country: "" });
    expect(splitLocation("")).toEqual({ city: "", country: "" });
  });
});
