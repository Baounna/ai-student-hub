import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const SCRIPT = path.join(process.cwd(), "scripts/draft-issue.mjs");

/**
 * The issue drafter is the only thing that knows what subscribers have already
 * been sent, and it keeps that in drafts/.last-issue.json. Anything that can
 * lose that record re-sends listings people already have, which is the failure
 * the whole file is built around — so it is exercised end to end rather than
 * through a helper, because the bug lived in the order of the reads and writes
 * and not in any one function.
 */
const workspaces: string[] = [];

function makeWorkspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "draft-issue-"));
  workspaces.push(dir);
  fs.mkdirSync(path.join(dir, "src/content"), { recursive: true });
  fs.mkdirSync(path.join(dir, "drafts"), { recursive: true });

  const items = Array.from({ length: 40 }, (_, index) => ({
    id: `company-${index}-role-city-rolling`,
    role: `Role ${index}`,
    company: `Company ${index}`,
    city: "Casablanca",
    country: index % 2 === 0 ? "MA" : "FR",
    kind: "stage",
    checkedAt: "2026-09-20",
    postedAt: index < 20 ? "2026-09-01" : "2026-09-20",
    href: `https://example.com/jobs/${index}`
  }));

  fs.writeFileSync(
    path.join(dir, "src/content/stages.json"),
    JSON.stringify({ version: 1, updatedAt: "2026-09-21T12:00:00.000Z", items }, null, 2)
  );

  // The issue also carries guides, which the script reads out of the content
  // source because it cannot resolve the "@/" alias those modules import
  // through. Synthetic stand-ins keep this workspace hermetic; that the parser
  // agrees with the real modules is tests/posts-index.test.ts's job, not this
  // file's. A comparison page is included deliberately: it has a slug at the
  // same indentation and no publishedAt, and must never be sent as a guide.
  const guide = (n: number) => `  {
    slug: "guide-${n}",
    title: "Guide ${n}",
    publishedAt: "2026-09-${String(10 + n).padStart(2, "0")}",
  },`;
  fs.writeFileSync(
    path.join(dir, "src/content/posts.ts"),
    `export const basePosts = [\n${guide(1)}\n${guide(2)}\n  {\n    slug: "a-comparison-page",\n    title: "Not A Guide",\n  },\n];\n`
  );
  fs.writeFileSync(
    path.join(dir, "src/content/posts-cs.ts"),
    `export const csExpansionPosts = [\n${guide(3)}\n];\n`
  );
  return dir;
}

async function draft(dir: string, args: string[] = []) {
  return execFileAsync(process.execPath, [SCRIPT, ...args], { cwd: dir });
}

function covered(dir: string): string[] {
  const state = JSON.parse(fs.readFileSync(path.join(dir, "drafts/.last-issue.json"), "utf8"));
  return state.coveredIds;
}

afterAll(() => {
  for (const dir of workspaces) fs.rmSync(dir, { recursive: true, force: true });
});

function issueText(dir: string): string {
  const file = fs.readdirSync(path.join(dir, "drafts")).find((f) => f.endsWith(".txt"));
  return fs.readFileSync(path.join(dir, "drafts", file!), "utf8");
}

function coveredSlugs(dir: string): string[] {
  const state = JSON.parse(fs.readFileSync(path.join(dir, "drafts/.last-issue.json"), "utf8"));
  return state.coveredSlugs || [];
}

/**
 * Every listing in this email is Morocco or France. The guides are the half a
 * subscriber in any other country can use, which is the entire reason they are
 * in here — so "the guides section exists and is not a repeat" is a promise to
 * those readers, not a formatting detail.
 */
describe("the guides half of the issue", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeWorkspace();
  });

  it("carries guides alongside the regional listings", async () => {
    await draft(dir);
    const txt = issueText(dir);
    expect(txt).toContain("GUIDES");
    expect(txt).toContain("Guide 3");
    expect(txt).toContain("Not region-specific");
  });

  it("never sends a comparison page as a guide", async () => {
    await draft(dir);
    expect(issueText(dir)).not.toContain("Not A Guide");
    expect(coveredSlugs(dir)).not.toContain("a-comparison-page");
  });

  it("does not repeat a guide it has already sent", async () => {
    await draft(dir);
    const first = coveredSlugs(dir);
    expect(first.length).toBeGreaterThan(0);

    await draft(dir);
    const second = issueText(dir);
    for (const slug of first) {
      const n = Number(slug.replace("guide-", ""));
      expect(second, `re-sent Guide ${n}`).not.toContain(`Guide ${n}\n`);
    }
  });

  // Before the guides existed, no unsent listings meant no issue at all. A
  // week with a new guide and no new listing is still worth an email, and a
  // reader outside the two countries would rather have that one than nothing.
  it("still writes an issue when only a guide is new", async () => {
    fs.writeFileSync(
      path.join(dir, "drafts/.last-issue.json"),
      JSON.stringify({
        sentAt: "2026-09-20",
        coveredIds: JSON.parse(fs.readFileSync(path.join(dir, "src/content/stages.json"), "utf8")).items.map(
          (i: { id: string }) => i.id
        ),
        coveredSlugs: ["guide-3", "guide-2"]
      })
    );

    const { stdout } = await draft(dir);
    const txt = issueText(dir);
    expect(txt).toContain("New guides -");
    expect(txt).toContain("Guide 1");
    expect(txt).toContain("No new openings since the last issue");
    // Nothing was re-checked, so the issue must not claim a check date.
    expect(txt).not.toContain("opened and checked on");
    expect(stdout).toContain("1 guides");
  });

  it("exits without an issue when neither half has anything new", async () => {
    fs.writeFileSync(
      path.join(dir, "drafts/.last-issue.json"),
      JSON.stringify({
        sentAt: "2026-09-20",
        coveredIds: JSON.parse(fs.readFileSync(path.join(dir, "src/content/stages.json"), "utf8")).items.map(
          (i: { id: string }) => i.id
        ),
        coveredSlugs: ["guide-1", "guide-2", "guide-3"]
      })
    );

    const { stdout } = await draft(dir);
    expect(stdout).toContain("Nothing new since the last issue");
    expect(fs.readdirSync(path.join(dir, "drafts")).some((f) => f.endsWith(".txt"))).toBe(false);
  });
});

describe("the record of what has already been sent", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeWorkspace();
  });

  it("grows across ordinary runs", async () => {
    await draft(dir);
    expect(covered(dir)).toHaveLength(12);
    await draft(dir);
    expect(covered(dir)).toHaveLength(24);
  });

  // --all means "put every open listing in this issue". It does not mean
  // "forget every issue ever sent". Reading the state only when --all was
  // absent left alreadySent empty, and the write at the end rebuilt the file
  // from that empty set — so one --all run threw away 24 ids and the next
  // ordinary run re-sent listings subscribers already had.
  it("survives an --all run", async () => {
    await draft(dir);
    await draft(dir);
    const before = covered(dir);
    expect(before).toHaveLength(24);

    await draft(dir, ["--all"]);
    const after = covered(dir);

    for (const id of before) {
      expect(after, `--all dropped ${id} from the sent record`).toContain(id);
    }
  });

  it("does not re-send an already-sent listing after an --all run", async () => {
    await draft(dir);
    await draft(dir);
    const before = new Set(covered(dir));

    await draft(dir, ["--all"]);
    await draft(dir);

    // Ids do not appear in the email, so look for the links themselves.
    const issue = fs.readFileSync(path.join(dir, `drafts/issue-${new Date().toISOString().slice(0, 10)}.txt`), "utf8");
    const stages = JSON.parse(fs.readFileSync(path.join(dir, "src/content/stages.json"), "utf8")) as {
      items: Array<{ id: string; href: string }>;
    };
    // The trailing newline matters: .../jobs/1 is a prefix of .../jobs/10.
    const resent = stages.items.filter((s) => before.has(s.id) && issue.includes(`${s.href}\n`));
    expect(resent.map((s) => s.id)).toEqual([]);
  });
});

describe("--since", () => {
  // The flag is documented in the script's own usage block, but the variable it
  // parsed into was assigned and then never read, so it silently did nothing.
  it("keeps only entries found on or after the given day", async () => {
    const dir = makeWorkspace();
    const { stdout } = await draft(dir, ["--since", "2026-09-10", "--full"]);
    expect(stdout).toMatch(/20 listings/);
    expect(covered(dir)).toHaveLength(20);
  });

  it("covers everything when it is not passed", async () => {
    const dir = makeWorkspace();
    const { stdout } = await draft(dir, ["--full"]);
    expect(stdout).toMatch(/40 listings/);
  });

  it("refuses a value that is not a date rather than silently matching nothing", async () => {
    const dir = makeWorkspace();
    await expect(draft(dir, ["--since", "last-week"])).rejects.toThrow();
  });
});

describe("--limit", () => {
  // A bare --limit made arg() return "true", parseInt gave NaN, and
  // slice(0, NaN) is empty — so the run printed "everything has already been
  // sent" and wrote no issue at all.
  it("falls back to the default when no value follows it", async () => {
    const dir = makeWorkspace();
    const { stdout } = await draft(dir, ["--limit"]);
    expect(stdout).toMatch(/12 listings/);
  });
});
