import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

/**
 * The operator agent's backlog was nine P1s, and not one of them was real.
 *
 * It read process.env inside GitHub Actions, where no deployment configuration
 * exists, so it reported the newsletter as unconnected while /api/subscribe was
 * answering 200 in production, and the lead magnet as missing while its CTA
 * rendered on the home page. It filed five P1s for one affiliate decision the
 * owner had declined. It grepped the index pages for a heading string that had
 * been reworded, and so reported the AI/CS track filters missing while
 * /en/blog?track=cs had been serving readers all along. And it demanded a
 * source href from the one brief that is the site's own analysis, where
 * attaching a link would mean citing something that does not support the claim.
 *
 * A backlog that is mostly wrong is one its owner stops opening -- the same
 * failure as the review issue that cried wolf, and as the eighty-day outage
 * nobody saw. These tests hold the agent to what it can actually observe.
 */
const AGENT = readFileSync("scripts/blog-operator-agent.mjs", "utf8");
const BLOG_INDEX = readFileSync("src/app/[lang]/blog/page.tsx", "utf8");
const NEWS_INDEX = readFileSync("src/app/[lang]/news/page.tsx", "utf8");
const NEWS = readFileSync("src/content/news.ts", "utf8");

describe("the operator agent only reports what it can see", () => {
  it("does not treat an unreadable environment as a broken one", () => {
    expect(AGENT).toContain("deployConfigVisible");
    // The monetization findings sit behind that flag, so a run with no
    // deployment config says what it skipped instead of filing defects.
    const queue = AGENT.slice(AGENT.indexOf("function buildActionQueue"));
    expect(queue).toMatch(/if \(!deployConfigVisible\)/);
    expect(queue).toContain("Not checked from CI");
  });

  it("reports the affiliate decision once, not five times", () => {
    // Was: one P1 for "fewer than three links" plus one P1 per uncovered
    // surface. Joining a programme is a business choice, not a defect.
    expect(AGENT).not.toContain("Cover missing affiliate placement:");
    expect(AGENT).toMatch(/Affiliate revenue is not set up/);
  });

  it("detects the track filters by their mechanism, not by a heading", () => {
    // The strings it used to require are gone from both pages; the filters are
    // not. If anybody renames trackFilter, this fails here rather than
    // resurfacing as a false P1 in a weekly report.
    expect(AGENT).not.toMatch(/AI \\\+ CS split/);
    for (const source of [BLOG_INDEX, NEWS_INDEX]) {
      expect(source).toMatch(/searchParams\?\.track/);
      expect(source).toContain("trackFilter");
      expect(source).toContain('"ai"');
      expect(source).toContain('"cs"');
    }
  });

  it("counts the site's own analysis as sourced, and says so to the reader", () => {
    // One brief has no href because nobody else published it. The page renders
    // "Source context: AI Student Hub editorial analysis" under it.
    expect(AGENT).toContain("OWN_ANALYSIS");
    const ownAnalysis = NEWS.match(/source:\s*\{\s*name:\s*"[^"]*editorial analysis[^}]*\}/i);
    expect(ownAnalysis, "news.ts should still carry the self-attributed brief").toBeTruthy();
    expect(ownAnalysis?.[0]).not.toMatch(/href:/);
  });

  it("still flags a claim credited to a third party with no link", () => {
    expect(AGENT).toContain("countUnverifiableAttributions");
    expect(AGENT).toMatch(/attribute a claim to someone else with no link/);
  });

  it("leaves no brief attributing a claim to a third party unlinked", () => {
    // name: "..." so the Stage/NewsBrief TYPE declaration (name: string) is not
    // mistaken for a brief. My first version of this matched that declaration
    // and reported it as an unlinked attribution.
    const sources = NEWS.match(/source:\s*\{\s*name:\s*"[\s\S]*?\}/g) ?? [];
    expect(sources.length).toBeGreaterThan(0);
    const unverifiable = sources.filter(
      (s) => !/href:\s*"https?:\/\/[^"]+"/.test(s) && !/AI Student Hub|editorial analysis/i.test(s)
    );
    expect(unverifiable, `unlinked third-party attribution: ${unverifiable.join(" | ")}`).toHaveLength(0);
  });
});
