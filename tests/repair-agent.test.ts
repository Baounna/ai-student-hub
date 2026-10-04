import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The repair agent writes files and opens pull requests, so its limits matter
 * more than its cleverness. These assert the shape of those limits, because the
 * agent itself cannot be unit-tested without spending money on a model call.
 *
 * It exists because four checks in this repository were found reporting
 * something other than what they measured. The point of the agent is to shorten
 * the wait between a failure and a human seeing a diagnosis — not to make
 * changes nobody reviews.
 */
const AGENT = readFileSync("scripts/repair-agent.mjs", "utf8");
const WATCHDOG = readFileSync(".github/workflows/watchdog.yml", "utf8");

describe("repair agent guardrails", () => {
  it("refuses to touch secrets, itself, or machine-written content", () => {
    for (const forbidden of [
      ".env",
      ".env.local",
      "scripts/repair-agent.mjs",
      "src/content/auto-news.json",
      "src/content/auto-tools.json"
    ]) {
      expect(AGENT, `${forbidden} must be on the forbidden list`).toContain(`"${forbidden}"`);
    }
  });

  it("refuses a path that escapes the repository", () => {
    expect(AGENT).toContain("refused path outside the repo");
  });

  it("throws the patch away unless every gate passes", () => {
    // A patch is only proposed after lint, typecheck, tests AND build.
    for (const gate of ['["run", "lint"]', '["run", "typecheck"]', '["test"]', '["run", "build"]']) {
      expect(AGENT).toContain(gate);
    }
    expect(AGENT).toContain('git", ["checkout", "--", "."]');
    expect(AGENT).toContain("patch-verified");
  });

  it("tells the model not to weaken a check to make a failure go away", () => {
    expect(AGENT).toMatch(/Do not weaken a test, a lint rule, a CI gate, or a security header/);
    expect(AGENT).toMatch(/set confident to false/);
  });

  it("does nothing at all without an API key", () => {
    expect(AGENT).toContain("skipped: ANTHROPIC_API_KEY is not set");
  });
});

describe("how the repair agent is triggered", () => {
  it("runs only when a workflow actually failed", () => {
    // A healthy day must cost nothing, so the step is gated on a failed run id.
    expect(WATCHDOG).toContain("steps.check.outputs.failed_run_id != ''");
  });

  it("opens one pull request at a time", () => {
    // Without this a workflow failing every six hours opens a PR every six
    // hours, each one a model call, and the pile is read by nobody.
    expect(WATCHDOG).toContain("--label repair-agent");
    expect(WATCHDOG).toContain("Stop if a repair is already waiting");
  });

  it("never pushes a repair to main", () => {
    const step = WATCHDOG.slice(WATCHDOG.indexOf("Open a pull request with the verified fix"));
    expect(step).toContain('BRANCH="repair/');
    expect(step).toContain("gh pr create");
    expect(step).not.toContain("git push origin main");
  });

  it("does not use a fork-writable trigger", () => {
    // scripts/verify-security.mjs rejects workflow_run, and that refusal is why
    // this lives in the watchdog instead of on its own trigger.
    expect(WATCHDOG).not.toMatch(/^on:[\s\S]{0,300}workflow_run/m);
  });
});
