import { describe, it, expect } from "vitest";
import { countriesWithPages, countryPageBlurb, countryPageTitle, listingsByCountry } from "@/content/stage-countries";
import { countryLabel } from "@/content/stages";
import { locales } from "@/i18n/config";

/**
 * Two things a reader sees before anything else on a country board: the title
 * in the search result, and the sentence under the heading.
 *
 * The sentence used to end with the country name appended as its own sentence
 * -- "8 internships and final-year projects in AI and tech, re-checked every
 * week. Morocco." -- in both languages. A keyword dropped into prose, in the
 * meta description and the lead paragraph, which are the two places a reader
 * decides whether a person wrote the page or a script did. Every other number
 * on these pages is counted from the listings for exactly that reason, and one
 * stray word undid it. The country was already in the H1 and the title, so it
 * bought no mention either.
 *
 * The French title was "Stages IA et informatique au Maroc" over a set that
 * contains PFE rows. In Morocco and Tunisia "stage PFE" is a dominant search
 * phrase and the high-intent half of it; KIND_PLURALS already held the word
 * and the blurb already printed it. The title was the one place it had to
 * appear for that search to land, and the one place it was missing.
 */
const SUFFIX = " | AICyber";
const BUDGET = 60;

const KINDS = {
  stage: { en: "internships", fr: "stages" },
  alternance: { en: "apprenticeships", fr: "alternances" },
  pfe: { en: "final-year projects", fr: "PFE" }
} as const;

describe("a country page's title and lead sentence", () => {
  it("works the country into the sentence instead of appending it", () => {
    const byCountry = listingsByCountry();
    for (const code of countriesWithPages()) {
      expect((byCountry.get(code) ?? []).length).toBeGreaterThan(0);
      for (const locale of locales) {
        const name = countryLabel(code, locale);
        const blurb = countryPageBlurb(code, locale);

        expect(blurb, `${locale}/stages/${code}: "${blurb}"`).not.toMatch(
          new RegExp(`\\.\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.?\\s*$`)
        );
        // Named once, inside the sentence, with its article and preposition.
        expect(blurb).toContain(name);
        expect(blurb.split(name).length - 1).toBe(1);
        expect(blurb.trimEnd().endsWith(".")).toBe(true);
        // One sentence. Two meant the second one was a keyword on its own.
        expect(blurb.split(". ").length).toBe(1);
      }
    }
  });

  it("gets the preposition and the article right where the country now sits", () => {
    const fr = countriesWithPages().map((code) => countryPageBlurb(code, "fr"));
    const en = countriesWithPages().map((code) => countryPageBlurb(code, "en"));

    expect(fr.join(" ")).not.toMatch(/en (Maroc|Canada|États-Unis|Pays-Bas)\b/);
    expect(en.join(" ")).not.toMatch(/in (United States|United Kingdom|Netherlands)\b/);
  });

  it("names PFE in French where there are PFE to name", () => {
    const byCountry = listingsByCountry();
    const withPfe = countriesWithPages().filter((code) =>
      (byCountry.get(code) ?? []).some((stage) => stage.kind === "pfe")
    );

    // If this empties the data changed, not the rule -- the check below is the
    // one with teeth.
    expect(withPfe.length).toBeGreaterThan(0);
    for (const code of withPfe) {
      const title = countryPageTitle(code, "fr");
      expect(title, `${title}: a PFE set whose title does not say PFE`).toContain("PFE");
    }
  });

  it("names in the French title only kinds that country actually lists", () => {
    // The title may name fewer kinds than the blurb -- it has fifty characters
    // and the blurb has a paragraph -- but never one that is not there.
    const byCountry = listingsByCountry();
    for (const code of countriesWithPages()) {
      const listings = byCountry.get(code) ?? [];
      const title = countryPageTitle(code, "fr");
      for (const kind of ["stage", "alternance", "pfe"] as const) {
        if (title.includes(KINDS[kind].fr)) {
          expect(
            listings.some((stage) => stage.kind === kind),
            `${title} promises ${kind} that /fr/stages/${code.toLowerCase()} does not have`
          ).toBe(true);
        }
      }
    }
  });

  it("keeps the English title alone, because nobody searches for it in English", () => {
    // "final-year project" is not an English search term; spending the same
    // fifty characters on it would cost the words that are.
    for (const code of countriesWithPages()) {
      expect(countryPageTitle(code, "en")).toMatch(/^AI and (cybersecurity|tech) internships in /);
    }
  });

  it("fits a search result, suffix included", () => {
    for (const code of countriesWithPages()) {
      for (const locale of locales) {
        const title = countryPageTitle(code, locale);
        // Truncation cuts from the right, and the right-hand end of these is
        // the country -- the one word the reader typed.
        expect(title.length + SUFFIX.length, `${title}${SUFFIX}`).toBeLessThanOrEqual(BUDGET);
        expect(title).not.toMatch(/ {2}|^\s|\s$/);
      }
    }
  });
});
