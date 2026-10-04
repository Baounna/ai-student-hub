#!/usr/bin/env node
/**
 * Diagnose a failed workflow run and propose a fix as a pull request.
 *
 * Why this exists: four checks in this repository were found reporting
 * something other than what they measured, and every one of them sat unnoticed
 * because nobody was watching. The watchdog already detects problems and
 * repairs exactly one of them -- an out-of-sync lockfile -- because that is the
 * only class a deterministic script can fix safely. Everything else lands in an
 * issue that waits for a person.
 *
 * This narrows that wait. It reads the logs of a run that failed, asks the model
 * what is wrong, applies the smallest change it proposes, and then has to earn
 * the right to be seen: the patch is thrown away unless lint, typecheck, the
 * whole test suite and a production build all pass with it applied.
 *
 * It opens a pull request. It never pushes to main. That is deliberate and not
 * a limitation to be fixed later -- an unattended agent merging its own guesses
 * into a live site is a worse failure mode than the bug it is chasing, and the
 * person who wrote this broke CI twice in one week with changes he was sure of.
 *
 * It costs money only when something is already broken.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const execFileAsync = promisify(execFile);
const DEFAULT_MODEL = "claude-opus-5";
const MAX_LOG_CHARS = 30_000;
const MAX_FILE_CHARS = 20_000;

/** Files the agent may never touch, whatever it concludes. */
const FORBIDDEN = [
  ".github/workflows/repair-agent.yml",
  "scripts/repair-agent.mjs",
  ".env",
  ".env.local",
  "src/content/auto-news.json",
  "src/content/auto-tools.json"
];

const PATCH_SCHEMA = {
  type: "object",
  properties: {
    diagnosis: { type: "string" },
    confident: { type: "boolean" },
    files: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          contents: { type: "string" },
          why: { type: "string" }
        },
        required: ["path", "contents", "why"],
        additionalProperties: false
      }
    }
  },
  required: ["diagnosis", "confident", "files"],
  additionalProperties: false
};

async function run(cmd, args, opts = {}) {
  return execFileAsync(cmd, args, { maxBuffer: 24 * 1024 * 1024, ...opts });
}

/** The tail of the failed run's logs — the end is where the error is. */
async function failedRunLogs(runId) {
  try {
    const { stdout } = await run("gh", ["run", "view", runId, "--log-failed"]);
    return stdout.slice(-MAX_LOG_CHARS);
  } catch (error) {
    const partial = `${error?.stdout || ""}`.slice(-MAX_LOG_CHARS);
    if (partial) return partial;
    throw new Error(`could not read logs for run ${runId}`);
  }
}

/** Repository context the model needs and cannot guess. */
async function repoContext() {
  const wanted = ["package.json", "AGENTS.md"];
  const parts = [];
  for (const file of wanted) {
    try {
      const text = await fs.readFile(path.join(process.cwd(), file), "utf8");
      parts.push(`--- ${file} ---\n${text.slice(0, MAX_FILE_CHARS)}`);
    } catch {
      // Absent is fine; it is context, not a requirement.
    }
  }
  return parts.join("\n\n");
}

function buildPrompt({ workflow, logs, context }) {
  return `A GitHub Actions workflow failed on the main branch of a Next.js 16 site.

Workflow: ${workflow}

Your job is to find the cause and propose the SMALLEST change that fixes it.

Rules you must follow:
- Return the COMPLETE new contents of each file you change, not a diff.
- Change as few files as possible. Prefer one.
- Do not "improve" anything unrelated to this failure.
- Do not weaken a test, a lint rule, a CI gate, or a security header to make a
  failure go away. If the only way to pass is to weaken a check, set confident
  to false and explain instead.
- Do not touch secrets, environment files, or machine-generated content files.
- If the logs do not actually tell you what is wrong, set confident to false and
  say what further information a person would need. Guessing is worse than
  saying you do not know: a wrong patch costs a human more time than no patch.

Known facts about this repository that the logs will not tell you:
- The lockfile MUST be generated on linux with npm 11. It is written on macOS
  and built on linux, and npm records optional dependencies only for the
  platform that resolves them, so a macOS-generated lockfile breaks npm ci in
  CI. This has broken the build twice.
- Several high-severity npm advisories exist in build tooling (braces, via
  Next's own ESLint config). braces@3.0.3 is both the newest release and the
  version the advisory names, so there is nothing to upgrade to. This is known
  and deliberate; do not try to fix it.

Repository context:
${context}

Failed run logs (tail):
${logs}`;
}

function extractJson(message) {
  const block = message.content.find((item) => item.type === "text");
  if (!block) throw new Error("model returned no text block");
  return JSON.parse(block.text);
}

async function gatesPass() {
  const steps = [
    ["npm", ["run", "lint"]],
    ["npm", ["run", "typecheck"]],
    ["npm", ["test"]],
    ["npm", ["run", "build"]]
  ];
  for (const [cmd, args] of steps) {
    try {
      await run(cmd, args);
    } catch (error) {
      return { ok: false, failed: args.join(" "), output: `${error?.stdout || error?.message || ""}`.slice(-2000) };
    }
  }
  return { ok: true };
}

async function main() {
  const runId = (process.env.FAILED_RUN_ID || "").trim();
  const workflow = (process.env.FAILED_WORKFLOW || "unknown").trim();
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();

  if (!apiKey) {
    console.log("[repair] skipped: ANTHROPIC_API_KEY is not set.");
    console.log("::notice title=Repair agent inactive::No ANTHROPIC_API_KEY secret, so nothing was diagnosed.");
    return;
  }
  if (!runId) {
    console.log("[repair] skipped: no FAILED_RUN_ID.");
    return;
  }

  const logs = await failedRunLogs(runId);
  const context = await repoContext();
  const model = (process.env.ANTHROPIC_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { format: { type: "json_schema", schema: PATCH_SCHEMA } },
    messages: [{ role: "user", content: buildPrompt({ workflow, logs, context }) }]
  });

  if (message.stop_reason === "refusal") {
    console.log("[repair] model declined to answer.");
    return;
  }

  const result = extractJson(message);
  await fs.writeFile("repair-diagnosis.md", `## Diagnosis\n\n${result.diagnosis}\n`, "utf8");

  if (!result.confident || !result.files.length) {
    console.log("[repair] not confident enough to propose a patch.");
    await fs.writeFile("repair-outcome.txt", "diagnosis-only", "utf8");
    return;
  }

  for (const file of result.files) {
    const target = path.resolve(process.cwd(), file.path);
    if (!target.startsWith(process.cwd())) throw new Error(`refused path outside the repo: ${file.path}`);
    if (FORBIDDEN.some((f) => file.path === f || file.path.startsWith(`${f}/`))) {
      console.log(`[repair] refused a forbidden path: ${file.path}`);
      await fs.writeFile("repair-outcome.txt", "diagnosis-only", "utf8");
      return;
    }
  }

  for (const file of result.files) {
    await fs.mkdir(path.dirname(path.resolve(process.cwd(), file.path)), { recursive: true });
    await fs.writeFile(path.resolve(process.cwd(), file.path), file.contents, "utf8");
    console.log(`[repair] wrote ${file.path}`);
  }

  const gates = await gatesPass();
  if (!gates.ok) {
    console.log(`[repair] patch failed ${gates.failed}; discarding it.`);
    await run("git", ["checkout", "--", "."]);
    await fs.appendFile(
      "repair-diagnosis.md",
      `\n## Patch discarded\n\nA patch was generated and then failed \`${gates.failed}\`, so it was thrown away rather than proposed.\n\n\`\`\`\n${gates.output}\n\`\`\`\n`,
      "utf8"
    );
    await fs.writeFile("repair-outcome.txt", "diagnosis-only", "utf8");
    return;
  }

  await fs.appendFile(
    "repair-diagnosis.md",
    `\n## Files changed\n\n${result.files.map((f) => `- \`${f.path}\` — ${f.why}`).join("\n")}\n`,
    "utf8"
  );
  await fs.writeFile("repair-outcome.txt", "patch-verified", "utf8");
  console.log("[repair] patch passes lint, typecheck, tests and build.");
}

main().catch((error) => {
  console.error(`[repair] ${error?.message || error}`);
  process.exitCode = 1;
});
