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

  it("refuses a placeholder that names no place at all", () => {
    expect(splitLocation("3 locations")).toEqual({ city: "", country: "" });
    expect(splitLocation("")).toEqual({ city: "", country: "" });
  });
});
