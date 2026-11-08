import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { frenchDe } from "@/i18n/typography";
import { getInstitutionBySlug, institutionWithArticleFr, INSTITUTIONS } from "@/lib/campus";

/**
 * The page a faculty is asked to link to.
 *
 * Two things have to hold for that request to be honest, and both are easy to
 * lose in a later edit:
 *
 * 1. The page carries an institution's name in its title and its URL, so it
 *    must deny the affiliation in that same name. A reader who finds
 *    "Université X" in the page title can reasonably assume Université X
 *    publishes it.
 *
 * 2. The letter sent to a faculty states that the page offered to their
 *    students carries no advertising and no affiliate link. The site has
 *    affiliate links elsewhere and keeps them; what cannot happen is one
 *    arriving on this route and turning that sentence into a false claim.
 */
const PAGE = readFileSync("src/app/[lang]/campus/[etablissement]/page.tsx", "utf8");
const INDEX = readFileSync("src/app/[lang]/campus/page.tsx", "utf8");
const LIMITS = readFileSync("src/components/campus-limits.tsx", "utf8");
const SITEMAP = readFileSync("src/app/sitemap.ts", "utf8");

/** Comments explain the rejected designs, so they are not what is under test. */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("campus institution pages", () => {
  it("has a page for every named institution, in every locale", () => {
    // Pins the fan-out, so adding an institution cannot silently add a page
    // that only exists in one language.
    expect(code(PAGE)).toMatch(/locales\.flatMap/);
    expect(code(PAGE)).toMatch(/INSTITUTIONS\.map/);
    expect(INSTITUTIONS.length).toBeGreaterThanOrEqual(18);
  });

  it("resolves a real slug and refuses an invented one", () => {
    expect(getInstitutionBySlug("uit")?.name).toBe("Université Ibn Tofaïl");
    expect(getInstitutionBySlug("harvard")).toBeNull();
    expect(getInstitutionBySlug("")).toBeNull();
  });

  it("404s an unknown establishment rather than naming one it does not know", () => {
    expect(code(PAGE)).toMatch(/if \(!institution\) notFound\(\);/);
  });

  it("denies the affiliation using the institution's own name", () => {
    // The generic "not a faculty service" is not enough on a page titled after
    // the establishment, so the name has to reach the disclaimer.
    expect(code(PAGE)).toMatch(/institution=\{institution\}/);
    expect(code(LIMITS)).toMatch(/Ce n'est pas un service \$\{frenchDe\(institutionWithArticleFr\(institution\)\)\}/);
    expect(code(LIMITS)).toMatch(/This is not a service of \$\{institution\.name\}/);
  });

  it("writes the institution into a French sentence as French requires", () => {
    // "un service de Université Ibn Tofaïl" is what concatenation produces, and
    // it is the first thing a French reader notices on a page about their own
    // faculty. Every institution is checked, so a new entry cannot be added
    // without an article decision.
    expect(frenchDe(institutionWithArticleFr(getInstitutionBySlug("uit")!))).toBe("de l'Université Ibn Tofaïl");
    expect(frenchDe(institutionWithArticleFr(getInstitutionBySlug("emi")!))).toBe("de l'École Mohammadia d'Ingénieurs");
    // The one name that takes no article: all four of these begin with a vowel,
    // so the first letter cannot decide it.
    expect(frenchDe(institutionWithArticleFr(getInstitutionBySlug("aui")!))).toBe("d'Al Akhawayn University");

    for (const institution of INSTITUTIONS) {
      const sentence = frenchDe(institutionWithArticleFr(institution));
      expect(sentence, institution.slug).toMatch(/^(de l'|de |d')/);
      expect(sentence, `${institution.slug} must not read "de Université"`).not.toMatch(/^de [AEIOUÉÈÀ]/);
    }
  });

  it("elides before a vowel and leaves a consonant alone", () => {
    expect(frenchDe("Rabat")).toBe("de Rabat");
    expect(frenchDe("Agadir")).toBe("d'Agadir");
    expect(frenchDe("Oujda")).toBe("d'Oujda");
    expect(frenchDe("El Jadida")).toBe("d'El Jadida");
    expect(frenchDe("Casablanca")).toBe("de Casablanca");
    // h is left unelided on purpose: the data cannot tell muet from aspiré.
    expect(frenchDe("Hassan")).toBe("de Hassan");
  });

  it("says who is behind the page without waiting for the small print", () => {
    expect(code(PAGE)).toMatch(/Projet d'étudiant indépendant/);
    expect(code(PAGE)).toMatch(/ni éditée ni validée par/);
  });

  it("keeps both campus routes free of commercial calls to action", () => {
    // The affiliate links and the donation stay on the rest of the site. This
    // route is what a faculty is asked to publish, and the written request says
    // it carries neither.
    for (const [name, source] of [["establishment page", PAGE], ["campus index", INDEX]] as const) {
      const body = code(source);
      expect(body, `${name} must not link an affiliate URL`).not.toMatch(/toolHref|tool_click|AffiliateDisclosure/);
      expect(body, `${name} must not push the paid guide`).not.toMatch(/getGuideCtaHref|getGuideCtaLabel/);
      expect(body, `${name} must not solicit a donation`).not.toMatch(/\/donate|paypal/i);
    }
  });

  it("lists every institution page in the sitemap", () => {
    expect(code(SITEMAP)).toMatch(/route: `\/campus\/\$\{institution\.slug\}`/);
  });

  it("offers the same service to a student whose institution is not named", () => {
    // A page addressed to one faculty must not read as a gate the others fail.
    expect(code(PAGE)).toMatch(/Toute adresse universitaire en \.ac\.ma est acceptée/);
  });
});
