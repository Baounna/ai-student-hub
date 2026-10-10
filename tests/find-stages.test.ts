import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import sources from "@/content/stage-sources.json";

/**
 * All 88 listings were added by a person typing `npm run add:stage`, which is
 * why the board grew slowly while postings died fast — fourteen closed in four
 * days and nothing replaced them. This agent finds candidates.
 *
 * What it must never do is add one. The site tells a student that every link
 * was opened and its page read by a person; an agent writing to stages.json
 * makes that false the first time it runs.
 */
const AGENT = readFileSync("scripts/find-stages.mjs", "utf8");

describe("the internship finder", () => {
  /**
   * This asserted that the agent never writes to stages.json. It does now —
   * the owner asked for the adding to be automatic too, and that is his call
   * to make about his own board.
   *
   * What replaced the guarantee is the thing that keeps the site honest: it
   * writes ONLY behind --write, everything it writes is stamped addedBy
   * "feed", and /stages says on each such row and in its method note that the
   * listing came from the employer's job API rather than from a person reading
   * the page. The claim moved to match the behaviour instead of the behaviour
   * quietly breaking the claim.
   */
  it("writes to the board only behind an explicit flag", () => {
    expect(AGENT).toMatch(/const WRITE = argv\.includes\("--write"\)/);
    const writeBlock = AGENT.slice(AGENT.indexOf("if (WRITE) {"), AGENT.indexOf("await fs.mkdir"));
    expect(writeBlock).toContain("fs.writeFile(STAGES");
    // No path outside that block may touch the board.
    const outside = AGENT.replace(writeBlock, "");
    expect(outside).not.toContain("writeFile(STAGES");
  });

  it("stamps everything it adds, so the page can say where it came from", () => {
    expect(AGENT).toMatch(/addedBy: "feed"/);
    const shared = readFileSync("src/app/[lang]/stages/shared.tsx", "utf8");
    expect(shared).toContain('stage.addedBy === "feed"');
    expect(shared).toContain("fromFeed");
  });

  it("caps a run, so a bad keyword costs a few rows and not forty", () => {
    // The first --write run added three Robinhood finance roles because
    // "crypto" was in the relevance list for cryptography. The cap is why it
    // was three and not every match on the board.
    expect(AGENT).toMatch(/const WRITE_CAP = \d+/);
    const cap = Number(AGENT.match(/const WRITE_CAP = (\d+)/)?.[1]);
    expect(cap).toBeGreaterThan(0);
    expect(cap).toBeLessThanOrEqual(25);
  });

  it("refuses to publish a listing whose country it could not work out", () => {
    // Country is the filter students actually use; a guess puts a French role
    // under Morocco. Those stay in the review file for a person to place.
    expect(AGENT).toMatch(/picked\.filter\(\(c\) => c\.country\)/);
  });

  it("keeps finance and operations roles off an AI and security board", () => {
    expect(AGENT).toContain("WRONG_FUNCTION");
    expect(AGENT).toMatch(/if \(WRONG_FUNCTION\.test\(role\)\) return;/);
    // The exact word that caused it: cryptography, not cryptocurrency.
    expect(AGENT).not.toMatch(/cryptograph\|crypto\|/);
  });

  it("scrapes nothing — every source is a documented JSON API", () => {
    const hosts = [...AGENT.matchAll(/https:\/\/\$?\{?[a-z.$={}]*([a-z0-9-]+\.(?:com|io|fr))/gi)].map((m) => m[1]);
    expect(hosts.length).toBeGreaterThan(0);
    // LinkedIn has no public postings API and scraping it breaks their terms.
    expect(AGENT.toLowerCase()).not.toContain("linkedin.com/jobs/view");
  });

  it("requires a posting to be an internship AND about AI or security", () => {
    // Either gate alone is useless: "intern" returns accountants, "security"
    // returns a bank's full-time SOC lead.
    expect(AGENT).toContain("IS_INTERNSHIP");
    expect(AGENT).toContain("IS_RELEVANT");
    expect(AGENT).toMatch(/if \(!IS_INTERNSHIP\.test\(role\)\) return;/);
    expect(AGENT).toMatch(/if \(!IS_RELEVANT\.test\(role\)\) return;/);
  });

  it("sends Content-Type to Workday, which answers 500 without it", () => {
    // Not 400, not a message naming the header — a plain 500, which read as
    // "board is down" and silently returned nothing from all four tenants.
    const workday = AGENT.slice(AGENT.indexOf("async function fromWorkday"));
    expect(workday).toContain('"Content-Type": "application/json"');
  });

  it("has a real company name for every board it polls", () => {
    // A board slug is not a company name. Without this the agent proposed
    // "togetherai" and "BoschGroup", which is how a board looks machine-filled.
    const names = sources.displayNames as Record<string, string>;
    const boards = [
      ...sources.greenhouse,
      ...sources.ashby,
      ...sources.smartrecruiters,
      ...sources.workday.map((w) => w.tenant)
    ];
    for (const board of boards) {
      expect(names[board], `${board} has no display name`).toBeTruthy();
      expect(names[board]).not.toBe(board.toLowerCase());
    }
  });

  it("leaves the country blank rather than guessing it wrong", () => {
    // A wrong country puts a French listing under Morocco on a board whose
    // country filter is the thing students actually use.
    expect(AGENT).toContain("COUNTRY_CODES");
    expect(AGENT).toMatch(/return \{ city: parts\.join\(", "\), country: "" \};/);
  });
});
