import { describe, it, expect } from "vitest";
import {
  IS_DOCTORAL_POSITION
  // @ts-expect-error - plain .mjs script, no types
} from "../scripts/find-stages.mjs";
import { kindLabel, type StageKind } from "@/content/stages";
import { locales } from "@/i18n/config";
import { readFileSync } from "node:fs";

/**
 * A doctoral position is not a job that requires a doctorate, and it is not an
 * internship for someone already doing one.
 *
 * Both confusions are live on boards the finder polls. Measured on 25 October,
 * the entire doctoral-looking yield of 38 Greenhouse and Ashby boards was two
 * titles — "PhD Research Intern, Generative AI" and "PhD GenAI Research
 * Scientist Intern" — and neither is a doctorate. "Research Scientist (PhD)"
 * is the other direction: a staff job where the doctorate is an entry
 * requirement. Either on a row labelled "Doctorat" would be a lie about what
 * the reader is applying for.
 *
 * So a bare "phd" cannot be the signal. The marker has to be followed by a
 * word that names the position.
 */
describe("doctoral position detection", () => {
  it.each([
    "Doctoral Researcher in Machine Learning",
    "PhD Student in Cybersecurity",
    "PhD position - Federated Learning",
    "PhD Candidate, Computer Vision",
    "Doktorand (m/w/d) Maschinelles Lernen",
    "Doktorandin Informationssicherheit",
    "Doctorant en apprentissage automatique",
    "Thèse de doctorat en cybersécurité",
    "Contrat doctoral - traitement du langage",
    "DPhil in Artificial Intelligence"
  ])("recognises %s", (title) => {
    expect(IS_DOCTORAL_POSITION.test(title)).toBe(true);
  });

  it.each([
    "PhD Research Intern, Generative AI",
    "PhD GenAI Research Scientist Intern",
    "Research Scientist (PhD)",
    "Senior ML Engineer, PhD preferred",
    "Master Thesis on LLM Agents",
    "Stage PFE - Cybersécurité",
    "Werkstudent Machine Learning",
    "Data Engineer Intern"
  ])("does not mistake %s for a doctorate", (title) => {
    expect(IS_DOCTORAL_POSITION.test(title)).toBe(false);
  });
});

describe("the doctorat kind", () => {
  it("has a label in both languages", () => {
    for (const locale of locales) {
      const label = kindLabel("doctorat" as StageKind, locale);
      expect(label).toBeTruthy();
      expect(label).not.toBe("doctorat");
    }
    // French says what the offer is called; English says what you apply for.
    expect(kindLabel("doctorat" as StageKind, "fr")).toBe("Doctorat");
    expect(kindLabel("doctorat" as StageKind, "en")).toBe("PhD position");
  });

  it("is accepted by the add script, which is the only legitimate route in", () => {
    // ADUM answers Disallow: /, FindAPhD disallows its own search, and
    // EURAXESS, ABG and jobs.ac.uk publish no feed or API — so these arrive by
    // hand, exactly like the Moroccan listings.
    const addStage = readFileSync("scripts/add-stage.mjs", "utf8");
    expect(addStage).toMatch(/const KINDS = \[[^\]]*"doctorat"[^\]]*\]/);
  });

  it("is ordered last in a title, so a cut title keeps the commoner words", () => {
    const source = readFileSync("src/content/stage-countries.ts", "utf8");
    const order = source.match(/const KIND_ORDER[^=]*=\s*\[([^\]]*)\]/)?.[1] ?? "";
    const kinds = [...order.matchAll(/"([a-z]+)"/g)].map((m) => m[1]);
    expect(kinds).toContain("doctorat");
    expect(kinds[kinds.length - 1]).toBe("doctorat");
  });
});

/**
 * A doctoral candidate is never written to the board automatically.
 *
 * The first run of the widened gate returned "PhD Researcher, AI Research" at
 * Autodesk, and the title alone cannot say whether that is a funded thesis or
 * a staff research role requiring a doctorate. "Intern" in a title means the
 * thing it says; "PhD" does not — it is the position in "PhD Student" and a
 * requirement in "Research Scientist (PhD)". So these wait for somebody to
 * read the posting, the same way Workday and Ashby candidates already do.
 */
describe("doctoral candidates are not auto-added", () => {
  const agent = readFileSync("scripts/find-stages.mjs", "utf8");

  it("excludes them from the set --write draws from", () => {
    const placeable = agent.slice(agent.indexOf("const placeable = picked.filter"));
    expect(placeable.slice(0, 220)).toContain("!IS_DOCTORAL_POSITION.test(c.role)");
  });

  it("still lets them reach the review file", () => {
    // picked is what the markdown is built from, and it is filtered for
    // relevance only — so a doctoral candidate is listed for a person even
    // though it is not written.
    expect(agent).toMatch(/const picked = unique\.slice\(0, LIMIT\);/);
    expect(agent).not.toMatch(/picked\s*=\s*picked\.filter\([^)]*IS_DOCTORAL/);
  });
});
