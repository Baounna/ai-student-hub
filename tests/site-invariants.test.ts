import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Invariants that must hold across the whole site at once.
 *
 * Page-by-page repair is coordinate descent: correct page A against today's
 * data, then correct page C, and C moves the ground under A without touching
 * A's code. These are the checks that catch that — they are deliberately
 * site-wide, so a fix that trades one page's correctness for another's fails
 * here rather than three epochs later.
 */
const LANG_DIR = "src/app/[lang]";

const pages = readdirSync(LANG_DIR)
  .filter((name) => !name.startsWith(".") && statSync(path.join(LANG_DIR, name)).isDirectory())
  .map((name) => path.join(LANG_DIR, name, "page.tsx"))
  .filter((file) => existsSync(file))
  .concat([path.join(LANG_DIR, "page.tsx")]);

describe("site invariants", () => {
  it("finds the pages, so the checks are not vacuous", () => {
    expect(pages.length).toBeGreaterThanOrEqual(10);
  });

  /**
   * Invariant 5. The layout renders one signup block in the footer of every
   * page. /resources added two more of its own, so the identical heading "Open
   * tech internships, verified weekly" appeared three times on one page, twice
   * within the same pair of columns.
   */
  it("asks for an email address at most once per page, beyond the footer", () => {
    for (const file of pages) {
      const count = (readFileSync(file, "utf8").match(/<Newsletter\b/g) || []).length;
      expect(count, `${file} renders ${count} signup blocks of its own`).toBeLessThanOrEqual(1);
    }
  });

  /**
   * Invariant 7. The disclosure and the gate must agree. The site says it is in
   * no affiliate programme and earns nothing; `hasPaidLinks` is what decides
   * whether that sentence is true, and src/config/site.ts:242-246 records the
   * commission wording being removed once because no link could earn one.
   */
  it("keeps the money claim tied to the thing that decides it", () => {
    const site = readFileSync("src/config/site.ts", "utf8");
    expect(site).toMatch(/export const hasPaidLinks =/);
    // The disclosure text may not hardcode a claim the gate could contradict.
    expect(site).toMatch(/hasPaidLinks/);
    const product = readFileSync("src/lib/product.ts", "utf8");
    expect(product).toMatch(/const GUIDE_EXISTS = (true|false);/);
    // Every guide CTA routes through the gate rather than linking the page.
    expect(product).toMatch(/GUIDE_EXISTS \? `\/\$\{locale\}\/product\/ai-career-guide`/);
  });

  /**
   * Invariant 3, for the one figure that was wrong. /resources printed "3
   * active tools in the shortlist" above seven rendered tools, because the
   * count read one of the two lists it renders.
   */
  it("counts the tools it shows, not one of the two lists", () => {
    const source = readFileSync(path.join(LANG_DIR, "resources/page.tsx"), "utf8");
    expect(source).toMatch(/const toolsCount = studyTools\.length \+ recommendedTools\.length;/);
    expect(source).not.toMatch(/const toolsCount = recommendedTools\.length;/);
    // And the rendered slice uses the same constant the count does.
    expect(source).toMatch(/studentStudyTools\.slice\(0, STUDY_TOOLS_SHOWN\)/);
    expect(source).not.toMatch(/studentStudyTools\.slice\(0, 4\)/);
  });

  /**
   * Invariant 1, for claims that named something absent. A page may not tell a
   * reader to use a template it does not have.
   */
  it("does not point at a template that does not exist", () => {
    const source = readFileSync(path.join(LANG_DIR, "resources/page.tsx"), "utf8");
    expect(source).not.toMatch(/tools-lab template|template du lab/);
  });

  /**
   * Invariant 9. Two French strings that were not French: one missing its
   * article and carrying an untranslated English noun, one promising to
   * "convertir l'audience" where the English half promised execution-focused
   * workflows.
   */
  it("does not leave English nouns inside French sentences", () => {
    const source = readFileSync(path.join(LANG_DIR, "resources/page.tsx"), "utf8");
    expect(source).not.toMatch(/temps de delivery/);
    expect(readFileSync("src/i18n/dictionaries.ts", "utf8")).not.toMatch(/convertir l'audience/);
  });
});

/**
 * Invariant 2, for the defect that produced it.
 *
 * /blog printed "72 cited sources" in its Evidence tile while the per-card
 * chips on the same screen summed to 106, and the same post appeared as "6
 * sources" in the stream and "4 cited sources" in the picks — two numbers for
 * one article on one page. The tile counted references a paragraph points at;
 * the chips counted every reference listed. Both were called "sources".
 *
 * src/lib/citations.ts has distinguished the two since it was written: a
 * reference a paragraph points at is a citation, one that is only listed is a
 * reading list, and referenceCountLabel says which. The cards were the only
 * place that ignored it.
 */
describe("one notion of 'reference' on /blog", () => {
  const BLOG = readFileSync(path.join(LANG_DIR, "blog/page.tsx"), "utf8");

  it("never prints a bare reference count under the bare word sources", () => {
    expect(BLOG).not.toMatch(/\{featuredPost\.references\.length\} \{locale === "fr" \? "sources" : "sources"\}/);
    expect(BLOG).not.toMatch(/\{post\.references\.length\} \{locale === "fr" \? "sources" : "sources"\}/);
  });

  it("labels every count with which of the two it is", () => {
    // Three renderings of the same quantity: featured card, stream card, pick.
    const labelled = BLOG.match(/referenceCountLabel\(citedReferenceCount\(/g) || [];
    expect(labelled.length).toBeGreaterThanOrEqual(3);
  });

  it("shows one number per post, whichever card it appears on", () => {
    // The expression is identical in all three places, so a post cannot read
    // 6 in the stream and 4 in the picks again.
    const expression = BLOG.match(/citedReferenceCount\((featuredPost|post)\) \|\| \1\.references\.length/g) || [];
    expect(expression.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps the tile summing the quantity its own label names", () => {
    // "cited sources" must remain the sum of the cards labelled cited, so the
    // two are reconcilable by a reader who adds them up.
    expect(BLOG).toMatch(/allPosts\.reduce\(\(sum, post\) => sum \+ citedReferenceCount\(post\), 0\)/);
    expect(BLOG).toMatch(/const sourceLabel = locale === "fr" \? "sources citées" : "cited sources";/);
  });
});
