import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
// @ts-expect-error - plain .mjs script, no types
import { elisionProblems, frenchStrings } from "../scripts/invariants.mjs";

/**
 * The half of "French is French" that was read by eye.
 *
 * tests/french-typography.test.ts has held the U+00A0 before `:` `;` `!` `?`
 * for a while, and learned to decode \uXXXX escapes and read the French half
 * of a ternary by position after missing twelve colons that way. Articles and
 * elision had no such check, which is how both of these reached a rendered
 * page in this project:
 *
 *     "un service de Université Ibn Tofaïl"
 *     "Pour les étudiants de Agadir"
 *
 * Both were caught by looking at the page. That is not a method.
 */
describe("elisionProblems", () => {
  it("catches the two sentences that actually shipped", () => {
    expect(elisionProblems("Ce n'est pas un service de Université Ibn Tofaïl.")).toHaveLength(1);
    expect(elisionProblems("Pour les étudiants de Agadir")[0]).toEqual({
      found: "de A",
      expected: "d'A"
    });
  });

  it("accepts the corrected forms", () => {
    expect(elisionProblems("Ce n'est pas un service de l'Université Ibn Tofaïl.")).toEqual([]);
    expect(elisionProblems("Pour les étudiants d'Agadir")).toEqual([]);
    expect(elisionProblems("Pour les étudiants de Rabat")).toEqual([]);
  });

  it("catches que before a vowel too", () => {
    expect(elisionProblems("les outils que on recommande")).toHaveLength(1);
    expect(elisionProblems("les outils qu'on recommande")).toEqual([]);
  });

  it("leaves le and la alone, deliberately", () => {
    /*
     * "la une", "le onze" and every h-aspiré are real exceptions. After
     * invariant 2 had to be demoted for crying wolf, a rule that flags correct
     * French is a rule somebody switches off — and the switching off is what
     * this whole script exists to prevent.
     */
    expect(elisionProblems("la une du journal")).toEqual([]);
    expect(elisionProblems("le onze de l'équipe")).toEqual([]);
  });

  it("does not fire on accented vowels being handled correctly", () => {
    expect(elisionProblems("de École")).toHaveLength(1);
    expect(elisionProblems("de l'École")).toEqual([]);
  });
});

describe("frenchStrings", () => {
  it("reads the French half of a ternary, not the English one", () => {
    const source = 'const x = locale === "fr" ? "de Agadir" : "from Agadir";';
    expect(frenchStrings(source)).toEqual(["de Agadir"]);
  });

  it("reads fr: values, which a ternary scan misses", () => {
    // dictionaries.ts and posts.ts carry most of the French this way.
    expect(frenchStrings('  fr: "de Oujda"')).toEqual(["de Oujda"]);
  });

  it("decodes escaped accents, which hid a whole page of French once", () => {
    // The privacy page writes French as \uXXXX, which a naive scan reads as
    // ASCII and skips.
    expect(frenchStrings(String.raw`fr: "visite : de École"`)[0]).toContain("de École");
  });
});

describe("invariant 9 is wired in and can fail", () => {
  it("is called, and no longer declares itself by hand", () => {
    const script = readFileSync("scripts/invariants.mjs", "utf8");
    expect(script).toMatch(/await invariant9\(\);/);
    expect(script).not.toMatch(/record\(9, "hand-checked", "tests\/french-typography/);
  });

  it("would go red on a real file containing the bug", () => {
    // The check is only worth having if the path from a source file to a
    // failure actually exists.
    const bad = 'const x = locale === "fr" ? "un service de Université" : "a service of Université";';
    const found = frenchStrings(bad).flatMap((s: string) => elisionProblems(s));
    expect(found).toHaveLength(1);
    expect(found[0].expected).toBe("d'U");
  });
});
