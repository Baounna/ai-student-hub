import { describe, it, expect } from "vitest";
import {
  COUNTRY_PAGE_MIN_LISTINGS,
  countriesWithPages,
  countryFromSlug,
  countryPagePath,
  countryPageTitle,
  countrySlug,
  listingsByCountry
} from "@/content/stage-countries";
import { getStages } from "@/content/stages";

/**
 * The whole board was two URLs. Its country views are query parameters that
 * /stages canonicalises back to itself, so a student searching "stage IA Maroc"
 * had nothing to land on — the one audience this board exists for.
 */
describe("the country boards", () => {
  it("gives a page only to countries with enough to show", () => {
    const byCountry = listingsByCountry();
    for (const code of countriesWithPages()) {
      expect((byCountry.get(code) ?? []).length).toBeGreaterThanOrEqual(COUNTRY_PAGE_MIN_LISTINGS);
    }
    // A page for one listing is a thin page, and ten of them to catch a search
    // term is the doorway pattern. Those countries stay reachable via filters.
    const thin = [...byCountry.entries()].filter(([, l]) => l.length < COUNTRY_PAGE_MIN_LISTINGS);
    expect(thin.length).toBeGreaterThan(0);
    for (const [code] of thin) expect(countriesWithPages()).not.toContain(code);
  });

  it("resolves only slugs that have a page, so no sitemap URL can 404", () => {
    for (const code of countriesWithPages()) {
      expect(countryFromSlug(countrySlug(code))).toBe(code);
    }
    for (const bad of ["pt", "zz", "abc", "", "../stages", "MA MA"]) {
      expect(countryFromSlug(bad)).toBeNull();
    }
  });

  it("uses the same slug in both languages, so the hreflang pair is exact", () => {
    for (const code of countriesWithPages()) {
      expect(countryPagePath(code, "en")).toBe(`/en/stages/${countrySlug(code)}`);
      expect(countryPagePath(code, "fr")).toBe(`/fr/stages/${countrySlug(code)}`);
    }
  });

  it("writes a title a native speaker would write", () => {
    // "en Maroc" or "in United States" tells a reader instantly that nobody who
    // speaks their language read the page.
    const fr = countriesWithPages().map((c) => countryPageTitle(c, "fr"));
    const en = countriesWithPages().map((c) => countryPageTitle(c, "en"));
    expect(fr).toContain("Stages IA et cybersécurité au Maroc");
    expect(fr.join(" ")).not.toMatch(/en (Maroc|Canada|États-Unis|Pays-Bas)/);
    expect(en.join(" ")).not.toMatch(/in (United States|United Kingdom|Netherlands)\b/);
    expect(en).toContain("AI and cybersecurity internships in the United States");
  });

  it("covers every listing it claims, and claims every listing it covers", () => {
    const byCountry = listingsByCountry();
    const total = [...byCountry.values()].reduce((n, l) => n + l.length, 0);
    expect(total).toBe(getStages().length);
    for (const [code, list] of byCountry) {
      for (const stage of list) expect(stage.country).toBe(code);
    }
  });
});
