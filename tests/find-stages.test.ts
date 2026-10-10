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
  it("never writes to the board", () => {
    // It may read stages.json to deduplicate; it may not write it.
    expect(AGENT).toMatch(/const STAGES = path\.join\(ROOT, "src\/content\/stages\.json"\)/);
    const writes = [...AGENT.matchAll(/fs\.writeFile\(\s*([A-Za-z_]+)/g)].map((m) => m[1]);
    expect(writes.length).toBeGreaterThan(0);
    expect(writes).not.toContain("STAGES");
    for (const target of writes) expect(target.startsWith("OUT_")).toBe(true);
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
