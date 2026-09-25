import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs script, no types
import { AUTOPILOT_COMMIT_PATHS, partitionByCommitPaths } from "../scripts/lib/autopilot-paths.mjs";

/**
 * The autopilot commits and pushes to main unattended. It used to stage with
 * `git add -A`, which commits what is in the tree rather than what the pipeline
 * produced -- the same thing only on a clean checkout.
 */
describe("what the autopilot is allowed to commit", () => {
  it("covers the pipeline's own outputs", () => {
    const { covered, skipped } = partitionByCommitPaths([
      "src/content/auto-news.json",
      "src/content/auto-tools.json",
      "docs/agent/latest-report.md",
      "docs/agent/drafts/a-draft.md"
    ]);
    expect(covered).toHaveLength(4);
    expect(skipped).toEqual([]);
  });

  // The failure this exists to prevent: an unattended commit picking up a file
  // nobody meant to publish.
  it("refuses source, config and secrets that happen to be dirty", () => {
    const { covered, skipped } = partitionByCommitPaths([
      "src/app/[lang]/page.tsx",
      ".env.local",
      "package.json",
      "drafts/linkedin-post.md"
    ]);
    expect(covered).toEqual([]);
    expect(skipped).toEqual(["src/app/[lang]/page.tsx", ".env.local", "package.json", "drafts/linkedin-post.md"]);
  });

  // "docs/agent" must not swallow a sibling that merely starts with the string.
  it("treats the prefix as a directory, not a substring", () => {
    const { covered, skipped } = partitionByCommitPaths(["docs/agentx/evil.md", "docs/agent-notes.md", "docs/agent/ok.md"]);
    expect(covered).toEqual(["docs/agent/ok.md"]);
    expect(skipped).toEqual(["docs/agentx/evil.md", "docs/agent-notes.md"]);
  });

  // The caller hands over bare paths, already stripped of the status prefix.
  // Re-stripping one would eat the start of any filename containing a space.
  it("keeps a path containing a space intact", () => {
    expect(partitionByCommitPaths(["my notes/a.md"]).skipped).toEqual(["my notes/a.md"]);
  });

  it("ignores blank entries instead of counting them as files", () => {
    const { covered, skipped } = partitionByCommitPaths(["", "   ", "docs/agent/ok.md"]);
    expect(covered).toEqual(["docs/agent/ok.md"]);
    expect(skipped).toEqual([]);
  });

  // agents-master.yml declares the paths for this same pipeline. If the two
  // disagree, one of them is committing something the other does not expect.
  it("agrees with the workflow that runs the same pipeline", async () => {
    const fs = await import("node:fs/promises");
    const yml = await fs.readFile(".github/workflows/agents-master.yml", "utf8");
    for (const p of AUTOPILOT_COMMIT_PATHS as string[]) {
      if (p === "docs/agent") continue; // the workflow lists its files individually
      expect(yml, `agents-master.yml never mentions ${p}`).toContain(p);
    }
  });
});
