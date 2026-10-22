import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  CYBER_TITLE_MIN_SHARE,
  SECURITY_ROLE_PATTERN,
  countriesWithPages,
  countryPageBlurb,
  countryPageTitle,
  countrySecurityCount,
  listingsByCountry
} from "@/content/stage-countries";
import { locales } from "@/i18n/config";

/**
 * What a country page promises, held to what that country actually lists.
 *
 * Every country page was titled "AI and cybersecurity internships in X" and opened with "N internships, apprenticeships and final-year
 * projects in AI and cybersecurity". Counted against the board: Canada had 0
 * cyber roles of 4, the United States 1 of 12, Morocco 1 of 8; the United
 * States and Canada list internships only, so two of the three categories
 * named to the reader -- and to a crawler, through the ItemList description --
 * were empty. Both sentences are derived now, and these are the checks that
 * keep them derived rather than drifting back into prose.
 */
const CYBER = { en: /cybersecurity/i, fr: /cybersécurité/i };

const KINDS = {
  stage: { en: "internships", fr: "stages" },
  alternance: { en: "apprenticeships", fr: "alternances" },
  pfe: { en: "final-year projects", fr: "PFE" }
} as const;

describe("what a country page claims", () => {
  it("names cybersecurity only where the country has cyber work in it", () => {
    const byCountry = listingsByCountry();
    for (const code of countriesWithPages()) {
      const listings = byCountry.get(code) ?? [];
      const share = countrySecurityCount(code) / listings.length;
      for (const locale of locales) {
        const title = countryPageTitle(code, locale);
        const blurb = countryPageBlurb(code, locale);
        const promises = CYBER[locale].test(title);
        expect(promises, `${locale}/stages/${code}: "${title}" over ${countrySecurityCount(code)}/${listings.length} cyber roles`).toBe(
          share >= CYBER_TITLE_MIN_SHARE
        );
        // The heading and the sentence under it answer the same question, so
        // they cannot differ: the first version of this fix changed only the
        // title and left the paragraph promising cyber on /en/stages/ca.
        expect(CYBER[locale].test(blurb)).toBe(promises);
      }
    }
  });

  it("never promises cyber to a country that has none at all", () => {
    const zero = countriesWithPages().filter((code) => countrySecurityCount(code) === 0);
    // Canada today. If the data ever has cyber everywhere this is vacuous, not
    // wrong -- the check above is the one with teeth.
    for (const code of zero) {
      for (const locale of locales) {
        expect(CYBER[locale].test(countryPageTitle(code, locale))).toBe(false);
        expect(CYBER[locale].test(countryPageBlurb(code, locale))).toBe(false);
      }
    }
  });

  it("names only the kinds of listing that country actually has", () => {
    const byCountry = listingsByCountry();
    for (const code of countriesWithPages()) {
      const listings = byCountry.get(code) ?? [];
      for (const locale of locales) {
        const blurb = countryPageBlurb(code, locale);
        for (const kind of ["stage", "alternance", "pfe"] as const) {
          const present = listings.some((stage) => stage.kind === kind);
          const named = blurb.includes(KINDS[kind][locale]);
          expect(named, `${locale}/stages/${code}: "${blurb}" ${present ? "omits" : "promises"} ${kind}`).toBe(present);
        }
        // The count is the one the page then renders, not a number typed in.
        expect(blurb.startsWith(`${listings.length} `)).toBe(true);
        expect(blurb).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it("writes a sentence a native speaker would write", () => {
    for (const code of countriesWithPages()) {
      const fr = countryPageBlurb(code, "fr");
      // "ouverts" for a list that includes stages or PFE, "ouvertes" for
      // alternances alone. A doubled space or a dangling "et" is the other
      // thing a derived sentence gets wrong.
      expect(fr).toMatch(/ ouvert(s|es) aux étudiants/);
      for (const locale of locales) {
        const blurb = countryPageBlurb(code, locale);
        expect(blurb).not.toMatch(/ {2}|,\s*\.|\set\s*$|\sand\s*$/);
      }
    }
  });

  /**
   * One pattern, one answer.
   *
   * The board page counted security roles with its own inline copy of this
   * regex while the country pages decided from it whether a title may say
   * "cybersecurity" at all. Two copies meant two answers to one question were
   * a typo apart, and the copy that drifted would have been the one deciding
   * whether a page promises a reader something it does not have.
   */
  it("is the only security pattern in the codebase", () => {
    const board = readFileSync("src/app/[lang]/stages/page.tsx", "utf8");
    expect(board).toContain("isSecurityRole");
    expect(board, "the board page grew its own security regex again").not.toMatch(/\/cyber\|s\[/);
    expect(SECURITY_ROLE_PATTERN.test("Stage Cybersécurité")).toBe(true);
    expect(SECURITY_ROLE_PATTERN.test("Data Engineer Intern")).toBe(false);
  });
});
