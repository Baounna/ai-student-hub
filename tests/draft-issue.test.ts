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
