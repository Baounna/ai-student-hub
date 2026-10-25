import { describe, it, expect } from "vitest";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { proseOnly } from "@/lib/content-block";
import { readMinutes } from "@/lib/read-time";
import { comparisons, getLocalizedPosts, posts } from "@/content/posts";

/**
 * The callout under an article is the one piece of a post that asks the reader
 * to do something, which is the one piece that cannot be approximate.
 *
 * Eighteen of twenty-four posts shared a February 2026 template that offered
 * "productivity templates", a "student productivity workspace", a "weekly
 * roadmap", "comparison templates" and "product templates". None of the five
 * existed, and the audit that found them had to read eighteen hand-written
 * blocks to be sure. These tests are so the next copy-paste fails here instead.
 */

const LOCALES = ["en", "fr"] as const;

/**
 * Nouns this site does not have. Each one was published in a callout.
 *
 * "stack" is matched only in the phrases that promised a curated system --
 * "the resource stack", "la stack ressources" -- and not on its own, because a
 * post may legitimately say "your stack" about the reader's own choices.
 */
const UNSHIPPED = [
  /\btemplates?\b/i,
  /productivity workspace/i,
  /espace productivit/i,
  /weekly roadmap/i,
  /roadmap hebdomadaire/i,
  /(resources?|deployment|execution|study|learning|hosting|recommended) stack/i,
  /stack (ressources|de d[eé]ploiement|d['’]ex[eé]cution|d['’][eé]tude)/i
];

describe("article callouts promise only what exists", () => {
  it("names no artefact this repository does not contain", () => {
    const offenders: string[] = [];
    for (const post of posts) {
      for (const locale of LOCALES) {
        const text = `${post.affiliateCallout.headline[locale]} ${post.affiliateCallout.description[locale]}`;
        for (const pattern of UNSHIPPED) {
          if (pattern.test(text)) offenders.push(`${post.slug} [${locale}] matches ${pattern}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("says something in both languages", () => {
    for (const post of posts) {
      for (const locale of LOCALES) {
        const { headline, description } = post.affiliateCallout;
        expect(headline[locale].trim().length, `${post.slug} [${locale}] headline`).toBeGreaterThan(5);
        expect(description[locale].trim().length, `${post.slug} [${locale}] description`).toBeGreaterThan(40);
      }
    }
  });

  /**
   * student-ai-internship-roadmap shipped the same "Open internships" button
   * twice -- identical label, identical /stages href, differing only in a
   * `note` field the page never renders. The reader saw one button repeated,
   * and React saw two children with the same key, because the key is built
   * from href plus label.
   */
  it("never renders the same button twice in one callout", () => {
    for (const post of posts) {
      for (const locale of LOCALES) {
        const keys = post.affiliateCallout.links.map((link) => `${link.href}-${link.label[locale]}`);
        expect(new Set(keys).size, `${post.slug} [${locale}] duplicate button`).toBe(keys.length);
      }
    }
  });

  /**
   * Four buttons labelled "Compare cloud options", "Cloud platform comparison"
   * and "See full resources" all pointed at /resources, so two of them named a
   * comparison page and went to a tool list instead. A label is a promise about
   * a destination.
   */
  it("sends a button labelled as a comparison to a comparison page", () => {
    const offenders: string[] = [];
    for (const post of posts) {
      for (const link of post.affiliateCallout.links) {
        for (const locale of LOCALES) {
          const label = link.label[locale].toLowerCase();
          const promisesComparison = /compar/.test(label);
          const goesToComparison = link.href === "/compare" || link.href.startsWith("/compare/");
          if (promisesComparison && !goesToComparison) {
            offenders.push(`${post.slug}: "${link.label[locale]}" -> ${link.href}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("links only to routes that exist", () => {
    const routeDir = path.join(process.cwd(), "src/app/[lang]");
    const segments = new Set(
      readdirSync(routeDir).filter((entry) => statSync(path.join(routeDir, entry)).isDirectory())
    );
    const slugs = new Set(posts.map((post) => post.slug));
    const comparisonSlugs = new Set(comparisons.map((comparison) => comparison.slug));

    const broken: string[] = [];
    for (const post of posts) {
      for (const link of post.affiliateCallout.links) {
        const [pathname] = link.href.split("?");
        const parts = pathname.replace(/^\//, "").split("/");
        const [top, child] = parts;
        let ok = segments.has(top);
        if (ok && top === "blog" && child) ok = slugs.has(child);
        if (ok && top === "compare" && child) ok = comparisonSlugs.has(child);
        if (parts.length > 2) ok = false;
        if (!ok) broken.push(`${post.slug} -> ${link.href}`);
      }
    }
    expect(broken).toEqual([]);
  });
});

/**
 * Two posts described a runnable script in detail -- "three PASS lines and
 * exits 0", "Four PASS lines and exit 0" -- and shipped nothing, while five
 * siblings shipped theirs in a fenced block. Telling a reader to run something
 * they were never given is worse than not mentioning it.
 */
describe("a post that describes a script ships it", () => {
  const CLAIMS = [/PASS lines/, /lignes PASS/, /script at the end of th/, /script à la fin de cet article/];

  it("has a fenced block in every locale that promises one", () => {
    const missing: string[] = [];
    for (const post of posts) {
      for (const locale of LOCALES) {
        const body = post.locales[locale].content;
        const text = [...body, post.affiliateCallout.description[locale]].join("\n");
        if (!CLAIMS.some((claim) => claim.test(text))) continue;
        // proseOnly drops the fenced entries, so a shorter list means code.
        if (proseOnly(body).length === body.length) missing.push(`${post.slug} [${locale}]`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("covers the two posts this was written for", () => {
    // Guard against the claim patterns silently stopping matching.
    const withClaims = posts.filter((post) =>
      CLAIMS.some((claim) => claim.test(post.locales.en.content.join("\n")))
    );
    expect(withClaims.map((post) => post.slug).sort()).toEqual([
      // The third was already honest: it pointed at a script it shipped.
      "data-structures-and-algorithms-for-ai-engineers",
      "llm-guardrails-and-evaluation-basics",
      "security-checklist-for-student-ai-and-cs-projects"
    ]);
  });
});

/**
 * Reading time is measured, which is good, but it was measured from
 * locales.en.content whichever page it labelled. The French bodies here run
 * longer, so every French article was understated -- an English word count
 * presented in French as a fact about the French text.
 */
describe("reading time measures the body the reader is given", () => {
  const WORDS_PER_MINUTE = 220;
  const expected = (content: string[]) =>
    Math.max(
      1,
      Math.round(
        proseOnly(content).reduce((sum, p) => sum + p.split(/\s+/).filter(Boolean).length, 0) / WORDS_PER_MINUTE
      )
    );

  it("counts the words of the locale being rendered", () => {
    for (const locale of LOCALES) {
      for (const post of getLocalizedPosts(locale)) {
        const source = posts.find((p) => p.slug === post.slug)!;
        expect(readMinutes(post.readTime), `${post.slug} [${locale}]`).toBe(
          expected(source.locales[locale].content)
        );
      }
    }
  });

  it("actually diverges, so a regression to one shared count is visible", () => {
    const en = getLocalizedPosts("en");
    const fr = getLocalizedPosts("fr");
    const differing = en.filter((post, i) => post.readTime !== fr[i].readTime);
    expect(differing.length).toBeGreaterThan(0);
  });
});
