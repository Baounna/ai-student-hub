import { describe, it, expect } from "vitest";
import { getAllCategories, slugify } from "@/content/posts";
import { categoryName } from "@/lib/categories";
import { buildSuggestIndex } from "@/lib/suggest-index";

/**
 * The French category names lived in src/lib/suggest-index.ts, where only the
 * typeahead used them: a French reader was offered "Carrière/Entretiens" in the
 * dropdown and landed on a page whose heading said "Career/Interviews". One map
 * now serves both, so the two cannot disagree again.
 */
describe("categoryName", () => {
  it("leaves English alone", () => {
    for (const category of getAllCategories()) {
      expect(categoryName(category, "en")).toBe(category);
    }
  });

  it("translates every category the content uses", () => {
    const untranslated = getAllCategories().filter(
      (category) => categoryName(category, "fr") === category && !/^Cloud\/DevOps$/.test(category)
    );

    // Cloud/DevOps is the same word in both, so it is the one legitimate
    // pass-through. Anything else means a category was added without a French
    // name and French readers are seeing English.
    expect(untranslated).toEqual([]);
  });

  it("spells the French names with their accents", () => {
    expect(categoryName("Career/Interviews", "fr")).toBe("Carrière/Entretiens");
    expect(categoryName("ML Engineering", "fr")).toBe("Ingénierie ML");
    expect(categoryName("Security & Performance", "fr")).toBe("Sécurité & Performance");
  });

  it("does not change the slug, so the two locales stay a translation pair", () => {
    for (const category of getAllCategories()) {
      expect(slugify(categoryName(category, "fr"))).not.toBe("");
      // The URL is built from the English category either way.
      expect(slugify(category)).toBe(slugify(category));
    }
  });
});

describe("the typeahead and the category pages agree", () => {
  it("labels every French guide with the shared French category name", () => {
    const french = new Set(getAllCategories().map((category) => categoryName(category, "fr")));
    const labels = buildSuggestIndex("fr")
      .filter((entry) => entry.k === "guide")
      .map((entry) => entry.s)
      .filter((label): label is string => Boolean(label));

    expect(labels.length).toBeGreaterThan(0);
    expect(labels.filter((label) => !french.has(label))).toEqual([]);
  });
});
