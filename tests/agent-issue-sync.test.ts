import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, mkdtempSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

/**
 * "Issue sync  PASS" meant nothing in three of the five workflows that run it.
 *
 * scripts/sync-operator-issues.mjs defaults AGENT_ISSUES_ENABLED to true, then
 * falls back to a dry-run when there is no token, and reports errors only in
 * the enabled mode -- so the step exited 0 whatever happened.
 * agents-master.yml, agents-semi-autopilot-pr.yml and autopilot-agent.yml each
 * passed AGENT_PIPELINE_INCLUDE_ISSUES=1 and a MAX_PER_RUN, no token, and no
 * `issues: write`. Somebody dispatches one of them, watches the step go green
 * and concludes the P1 queue is in the issue list; it is in a report file on
 * main that nobody opens. A queue nobody is told about is not a queue.
 *
 * blog-operator-agent.yml and blog-design-agent.yml had all of this right from
 * the start. Nothing compared them, so the difference cost nothing to anybody
 * writing the next workflow.
 */
const DIR = ".github/workflows";
const SCRIPT = path.resolve("scripts/sync-operator-issues.mjs");

const workflows = readdirSync(DIR)
  .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
  .map((name) => ({ name, text: readFileSync(path.join(DIR, name), "utf8") }));

/** Every workflow that reaches the sync, directly or through a pipeline. */
const syncers = workflows.filter(({ text }) => /npm run agent:(all|autopilot|issues)\b/.test(text));

function enabledValue(text: string) {
  return (text.match(/^\s*AGENT_ISSUES_ENABLED:\s*"?([^"\n]*)"?\s*$/m)?.[1] ?? "").trim();
}

describe("agent issue sync wiring", () => {
  it("finds the workflows that run the sync", () => {
    // Without this, renaming an npm script would make everything below
    // vacuously pass on an empty list.
    expect(syncers.length).toBeGreaterThanOrEqual(5);
  });

  it("makes every one of them say out loud whether it files issues", () => {
    // Leaning on the script's default is what produced a step that read as
    // enabled while doing nothing. Filing issues and not filing them are both
    // defensible; not saying which is not.
    const silent = syncers.filter(({ text }) => !/^\s*AGENT_ISSUES_ENABLED:/m.test(text)).map(({ name }) => name);
    expect(silent).toEqual([]);
  });

  it("gives the ones that can file issues the scope and the token to do it", () => {
    // Configured to file issues and unable to file issues is the worst of both:
    // blog-operator-agent.yml passed a token with no `issues: write` and every
    // create came back 403 while the queue reported nothing wrong.
    const canFile = syncers.filter(({ text }) => enabledValue(text) !== "0");
    expect(canFile.length).toBeGreaterThanOrEqual(4);

    const incomplete = canFile
      .map(({ name, text }) => {
        const absent = [
          !/^\s*issues:\s*write\s*$/m.test(text) && "issues: write",
          !/^\s*GITHUB_TOKEN:\s*\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}/m.test(text) && "GITHUB_TOKEN",
          !/^\s*GITHUB_REPOSITORY:\s*\$\{\{\s*github\.repository\s*\}\}/m.test(text) && "GITHUB_REPOSITORY"
        ].filter(Boolean);
        return absent.length ? `${name}: ${absent.join(", ")}` : "";
      })
      .filter(Boolean);

    expect(incomplete).toEqual([]);
  });
});

/**
 * Run the sync in a throwaway directory so it reads no .env.local and writes
 * its state nowhere that matters. Its queue files are absent there, which is
 * fine: the exit code under test is about configuration, not about content.
 */
function runSync(env: Record<string, string>) {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "issue-sync-"));
  const result = spawnSync(process.execPath, [SCRIPT], {
    cwd,
    encoding: "utf8",
    env: {
      PATH: process.env.PATH ?? "",
      HOME: process.env.HOME ?? "",
      // Named explicitly, not inherited: an ambient GITHUB_TOKEN would turn the
      // first case below into a real call to the GitHub API from a test run.
      NODE_ENV: "test",
      ...env
    }
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

describe("the sync script's own honesty", () => {
  it("fails a run that was told to file issues and could not", () => {
    // The case the three workflows were in. It used to exit 0.
    const { status, output } = runSync({ AGENT_ISSUES_ENABLED: "1" });

    expect(status).toBe(1);
    expect(output).toContain("GITHUB_TOKEN");
  });

  it("passes a run that was told not to, and says disabled rather than dry-run", () => {
    // Switching it off has to stay a usable answer, or the only way out of the
    // failure above is to re-break it.
    const { status, output } = runSync({ AGENT_ISSUES_ENABLED: "0" });

    expect(status).toBe(0);
    expect(output).toContain("Mode: disabled");
  });

  it("leaves a run nobody configured as a quiet dry-run, but says so", () => {
    // `npm run agent:issues` on a laptop never asked for an issue and still
    // wants its report. Failing that would just teach people to ignore this
    // check too, which is how the eighty-day outage stayed invisible.
    const { status, output } = runSync({});

    expect(status).toBe(0);
    expect(output).toContain("Mode: dry-run");
    expect(output).toContain("nothing was filed");
  });
});
