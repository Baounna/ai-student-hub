#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { loadScriptEnv } from "./lib/load-env.mjs";

const ROOT = process.cwd();
loadScriptEnv(ROOT);
const REPORT_FILE = path.join(ROOT, "docs/agent/autopilot-report.md");
const PRESERVE_ON_FAILURE_FILES = [
  path.join(ROOT, "src/content/auto-news.json"),
  path.join(ROOT, "src/content/auto-tools.json")
];

function toBoolean(value, fallback) {
  if (value == null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on", "enable", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disable", "disabled"].includes(normalized)) return false;
  return fallback;
}

function toInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function durationLabel(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function withDefault(target, key, value) {
  if (target[key] == null || String(target[key]).trim() === "") {
    target[key] = value;
  }
}

function buildQualityEnv() {
  const env = { ...process.env };

  withDefault(env, "NEXT_PUBLIC_SITE_URL", "https://aistudenthub.ai");
  withDefault(env, "SITE_URL", env.NEXT_PUBLIC_SITE_URL);
  withDefault(env, "AUTH_SESSION_SECRET", "autopilot-session-secret-please-change-in-production-123456789");
  withDefault(env, "NEXT_PUBLIC_CONTACT_EMAIL", "hello@aistudenthub.ai");
  withDefault(env, "NEXT_PUBLIC_LEGAL_NAME", "AI and Cybersecurity News");
  withDefault(env, "NEXT_PUBLIC_LINKEDIN_URL", "https://www.linkedin.com/company/ai-student-hub");
  withDefault(env, "NEXT_PUBLIC_LEAD_MAGNET_URL_EN", "https://aistudenthub.ai/en#newsletter");
  withDefault(env, "NEXT_PUBLIC_LEAD_MAGNET_URL_FR", "https://aistudenthub.ai/fr#newsletter");
  withDefault(env, "NEXT_PUBLIC_PRODUCT_CHECKOUT_URL", "https://aistudenthub.ai/en/product/ai-career-guide");
  withDefault(env, "AFFILIATE_DISCLOSURE_TEXT_EN", "Some links may be affiliate links at no extra cost to you.");
  withDefault(env, "AFFILIATE_DISCLOSURE_TEXT_FR", "Certains liens peuvent etre des liens d'affiliation sans cout supplementaire.");
  withDefault(env, "ENABLE_INTERNAL_GROWTH_SPRINT", "false");

  const fallbackAffiliates = [
    {
      name: "DigitalOcean",
      url: "https://www.digitalocean.com/",
      placement: "home/resources"
    },
    {
      name: "Coursera",
      url: "https://www.coursera.org/",
      placement: "resources/blog"
    },
    {
      name: "Notion",
      url: "https://www.notion.so/",
      placement: "blog/resources"
    },
    {
      name: "GitHub Student Pack",
      url: "https://education.github.com/pack",
      placement: "comparison/blog"
    },
    {
      name: "Hugging Face",
      url: "https://huggingface.co/",
      placement: "home/comparison"
    }
  ];

  for (let i = 1; i <= fallbackAffiliates.length; i += 1) {
    const fallback = fallbackAffiliates[i - 1];
    withDefault(env, `AFFILIATE_${i}_NAME`, fallback.name);
    withDefault(env, `AFFILIATE_${i}_URL`, fallback.url);
    withDefault(env, `AFFILIATE_${i}_PLACEMENT`, fallback.placement);
  }

  const oauthEnabled = toBoolean(env.ENABLE_OAUTH, null);
  if (oauthEnabled === true) {
    const hasOAuthProvider =
      Boolean((env.GOOGLE_CLIENT_ID || "").trim() && (env.GOOGLE_CLIENT_SECRET || "").trim()) ||
      Boolean((env.GITHUB_CLIENT_ID || "").trim() && (env.GITHUB_CLIENT_SECRET || "").trim()) ||
      Boolean((env.LINKEDIN_CLIENT_ID || "").trim() && (env.LINKEDIN_CLIENT_SECRET || "").trim());
    if (!hasOAuthProvider) {
      env.ENABLE_OAUTH = "false";
    }
  }

  if ((env.EMAIL_PROVIDER || "").trim().toLowerCase() === "convertkit") {
    withDefault(env, "CONVERTKIT_FORM_ID", "autopilot-form");
    withDefault(env, "CONVERTKIT_API_KEY", "autopilot-api-key");
  }

  if ((env.ANALYTICS_MODE || "").trim().toLowerCase() === "ga4") {
    withDefault(env, "GA4_MEASUREMENT_ID", "G-AUTOPILOT123");
  }

  return env;
}

async function runCommand(command, args, options = {}) {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: options.env || process.env,
      stdio: "inherit"
    });

    child.on("error", (error) => {
      resolve({
        command: [command, ...args].join(" "),
        ok: false,
        code: -1,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error)
      });
    });

    child.on("close", (code) => {
      resolve({
        command: [command, ...args].join(" "),
        ok: code === 0,
        code: typeof code === "number" ? code : -1,
        durationMs: Date.now() - startedAt,
        error: code === 0 ? "" : `Process exited with code ${code}`
      });
    });
  });
}

async function readCurrentBranch() {
  try {
    const buffer = await fs.readFile(path.join(ROOT, ".git/HEAD"), "utf8");
    const ref = buffer.trim();
    if (ref.startsWith("ref: refs/heads/")) return ref.slice("ref: refs/heads/".length);
  } catch {
    // no-op
  }

  return "";
}

async function isDetachedHead() {
  const result = await runCommand("git", ["symbolic-ref", "--short", "-q", "HEAD"]);
  return !result.ok;
}

async function getChangedFiles() {
  const output = await new Promise((resolve) => {
    const child = spawn("git", ["status", "--short"], { cwd: ROOT, env: process.env });
    let text = "";

    child.stdout.on("data", (chunk) => {
      text += String(chunk || "");
    });

    child.on("close", () => resolve(text));
    child.on("error", () => resolve(""));
  });

  return String(output)
    .split("\n")
    .map((line) => line.replace(/\r/g, ""))
    .map((line) => (line.length >= 4 ? line.slice(3).trim() : line.trim()))
    .filter(Boolean)
    .map((line) => {
      const renameParts = line.split("->").map((part) => part.trim()).filter(Boolean);
      return renameParts.length ? renameParts[renameParts.length - 1] : line;
    })
    .filter(Boolean);
}

function buildImpactNotes(changedFiles) {
  const notes = [];
  const has = (prefix) => changedFiles.some((file) => file.startsWith(prefix));

  if (changedFiles.some((file) => file.startsWith("src/content/"))) {
    notes.push("Fresh source-backed content keeps SEO freshness and improves recurring student traffic.");
  }
  if (has("src/app/") || has("src/components/")) {
    notes.push("Public UX/content updates improve readability, trust, and conversion flow quality.");
  }
  if (has("src/lib/") || changedFiles.some((file) => file.startsWith("src/app/api/"))) {
    notes.push("Core reliability/security/tracking updates reduce breakage and protect monetization paths.");
  }
  if (has("scripts/") || has(".github/workflows/")) {
    notes.push("Automation upgrades reduce manual operations and increase shipping consistency.");
  }
  if (has("docs/agent/")) {
    notes.push("Agent reporting makes weekly optimization faster and more predictable.");
  }

  if (!notes.length) {
    notes.push("No code/content modifications were required in this run.");
  }

  return notes;
}

async function readJsonSafe(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function topSources(items, limit = 5) {
  const counts = new Map();
  for (const item of items || []) {
    const key = String(item?.source || "Unknown");
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

async function collectSourceCoverage() {
  const [autoNews, autoTools] = await Promise.all([
    readJsonSafe(path.join(ROOT, "src/content/auto-news.json")),
    readJsonSafe(path.join(ROOT, "src/content/auto-tools.json"))
  ]);

  const newsItems = Array.isArray(autoNews?.items) ? autoNews.items : [];
  const toolsItems = Array.isArray(autoTools?.items) ? autoTools.items : [];

  return {
    news: {
      count: newsItems.length,
      topSources: topSources(newsItems)
    },
    tools: {
      count: toolsItems.length,
      topSources: topSources(toolsItems)
    }
  };
}

async function captureFileSnapshots(files) {
  const snapshots = new Map();
  await Promise.all(
    files.map(async (filePath) => {
      try {
        const value = await fs.readFile(filePath, "utf8");
        snapshots.set(filePath, value);
      } catch {
        snapshots.set(filePath, null);
      }
    })
  );
  return snapshots;
}

async function restoreFileSnapshots(snapshots) {
  for (const [filePath, value] of snapshots.entries()) {
    if (typeof value === "string") {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, value, "utf8");
      continue;
    }
    try {
      await fs.unlink(filePath);
    } catch {
      // no-op
    }
  }
}

function buildReport({ generatedAt, attemptsUsed, runResults, changedFiles, committed, pushed, rolledBack, sourceCoverage }) {
  const lines = [];
  const gateResults = runResults.filter((item) => item.type === "quality");
  const pipelineResults = runResults.filter((item) => item.type === "pipeline");
  const failed = runResults.filter((item) => !item.ok);
  const impactNotes = buildImpactNotes(changedFiles);

  lines.push("# AI and Cybersecurity News Autopilot Report");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Attempts used: ${attemptsUsed}`);
  lines.push(`Overall status: ${failed.length ? "FAILED" : "SUCCESS"}`);
  lines.push(`Committed: ${committed ? "YES" : "NO"}`);
  lines.push(`Pushed: ${pushed ? "YES" : "NO"}`);
  lines.push(`Content rollback on failure: ${rolledBack ? "YES" : "NO"}`);
  lines.push("");

  lines.push("## What Changed");
  if (!changedFiles.length) {
    lines.push("- No repository file changes in this run.");
  } else {
    changedFiles.forEach((file) => lines.push(`- ${file}`));
  }
  lines.push("");

  lines.push("## Why This Improves Quality/Revenue");
  impactNotes.forEach((note) => lines.push(`- ${note}`));
  lines.push("");

  lines.push("## Pipeline Steps");
  if (!pipelineResults.length) {
    lines.push("- No pipeline steps were executed.");
  } else {
    pipelineResults.forEach((step) => {
      lines.push(`- ${step.ok ? "PASS" : "FAIL"} | ${step.command} | ${durationLabel(step.durationMs)}`);
    });
  }
  lines.push("");

  lines.push("## Checks Status");
  if (!gateResults.length) {
    lines.push("- No quality gates were executed.");
  } else {
    gateResults.forEach((check) => {
      lines.push(`- ${check.ok ? "PASS" : "FAIL"} | ${check.command} | ${durationLabel(check.durationMs)}`);
    });
  }
  lines.push("");

  lines.push("## Source Coverage Summary");
  lines.push(`- Auto news items: ${sourceCoverage.news.count}`);
  if (sourceCoverage.news.topSources.length) {
    sourceCoverage.news.topSources.forEach(([name, count]) => lines.push(`  - ${name}: ${count}`));
  } else {
    lines.push("  - No auto news items currently.");
  }
  lines.push(`- Auto tools items: ${sourceCoverage.tools.count}`);
  if (sourceCoverage.tools.topSources.length) {
    sourceCoverage.tools.topSources.forEach(([name, count]) => lines.push(`  - ${name}: ${count}`));
  } else {
    lines.push("  - No auto tools items currently.");
  }
  lines.push("");

  if (failed.length) {
    lines.push("## Failures");
    failed.forEach((item) => {
      lines.push(`- ${item.command}: ${item.error || `exit ${item.code}`}`);
    });
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function run() {
  const generatedAt = new Date().toISOString();
  const branch = process.env.AUTOPILOT_BRANCH || process.env.GITHUB_REF_NAME || (await readCurrentBranch()) || "main";
  const shouldPull = toBoolean(process.env.AUTOPILOT_PULL, true);
  const shouldCommit = toBoolean(process.env.AUTOPILOT_COMMIT, process.env.CI === "true");
  const shouldPush = toBoolean(process.env.AUTOPILOT_PUSH, false);
  const maxRetries = Math.max(1, Math.min(toInteger(process.env.AUTOPILOT_MAX_RETRIES, 2), 5));
  const commitMessage = (process.env.AUTOPILOT_COMMIT_MESSAGE || "chore(autopilot): refresh blog quality and content").trim();
  const qualityEnv = buildQualityEnv();

  const runResults = [];
  let attemptsUsed = 0;
  let success = false;
  let rolledBack = false;
  let baselineSnapshots = new Map();

  if (shouldPull) {
    const detachedHead = await isDetachedHead();
    const syncResult = detachedHead
      ? await runCommand("git", ["fetch", "origin", branch])
      : await runCommand("git", ["pull", "--ff-only", "origin", branch]);
    runResults.push({ ...syncResult, type: "pipeline" });
    if (!syncResult.ok) {
      const sourceCoverage = await collectSourceCoverage();
      const report = buildReport({
        generatedAt,
        attemptsUsed,
        runResults,
        changedFiles: [],
        committed: false,
        pushed: false,
        rolledBack,
        sourceCoverage
      });
      await fs.mkdir(path.dirname(REPORT_FILE), { recursive: true });
      await fs.writeFile(REPORT_FILE, report, "utf8");
      process.exitCode = 1;
      return;
    }
  }

  baselineSnapshots = await captureFileSnapshots(PRESERVE_ON_FAILURE_FILES);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    attemptsUsed = attempt;

    const pipelineRun = await runCommand("npm", ["run", "agent:all"]);
    runResults.push({ ...pipelineRun, type: "pipeline", attempt });
    if (!pipelineRun.ok) continue;

    const checks = [
      { args: ["run", "lint"] },
      { args: ["run", "build"] },
      { args: ["run", "verify:production"], env: qualityEnv },
      { args: ["run", "verify:affiliates"], env: qualityEnv },
      { args: ["run", "verify:public-content"] },
      { args: ["run", "verify:agents"] }
    ];

    let attemptOk = true;
    for (const check of checks) {
      const result = await runCommand("npm", check.args, { env: check.env || process.env });
      runResults.push({ ...result, type: "quality", attempt });
      if (!result.ok) {
        attemptOk = false;
        break;
      }
    }

    if (attemptOk) {
      success = true;
      break;
    }
  }

  let committed = false;
  let pushed = false;

  if (success && shouldCommit) {
    const beforeCommitChanges = await getChangedFiles();
    if (beforeCommitChanges.length) {
      const configName = await runCommand("git", ["config", "user.name", "AI and Cybersecurity News Bot"]);
      runResults.push({ ...configName, type: "pipeline" });
      const configEmail = await runCommand("git", ["config", "user.email", "ai-student-hub-bot@users.noreply.github.com"]);
      runResults.push({ ...configEmail, type: "pipeline" });

      if (!configName.ok || !configEmail.ok) {
        const sourceCoverage = await collectSourceCoverage();
        const changedFiles = await getChangedFiles();
        const report = buildReport({
          generatedAt,
          attemptsUsed,
          runResults,
          changedFiles,
          committed: false,
          pushed: false,
          rolledBack,
          sourceCoverage
        });
        await fs.mkdir(path.dirname(REPORT_FILE), { recursive: true });
        await fs.writeFile(REPORT_FILE, report, "utf8");
        process.exitCode = 1;
        return;
      }

      const add = await runCommand("git", ["add", "-A"]);
      runResults.push({ ...add, type: "pipeline" });

      if (add.ok) {
        const commit = await runCommand("git", ["commit", "-m", commitMessage]);
        runResults.push({ ...commit, type: "pipeline" });
        committed = commit.ok;

        if (committed && shouldPush) {
          const rebasePull = await runCommand("git", ["pull", "--rebase", "origin", branch]);
          runResults.push({ ...rebasePull, type: "pipeline" });
          if (rebasePull.ok) {
            const push = await runCommand("git", ["push", "origin", branch]);
            runResults.push({ ...push, type: "pipeline" });
            pushed = push.ok;
          }
        }
      }
    }
  }

  if (!success) {
    await restoreFileSnapshots(baselineSnapshots);
    rolledBack = true;
  }

  const sourceCoverage = await collectSourceCoverage();
  const changedFiles = await getChangedFiles();
  const report = buildReport({
    generatedAt,
    attemptsUsed,
    runResults,
    changedFiles,
    committed,
    pushed,
    rolledBack,
    sourceCoverage
  });
  await fs.mkdir(path.dirname(REPORT_FILE), { recursive: true });
  await fs.writeFile(REPORT_FILE, report, "utf8");

  if (!success) {
    process.exitCode = 1;
    return;
  }

  // Fail the run if we committed but never pushed (e.g. rebase conflict or push
  // rejection). Deriving this from `committed`/`pushed` covers the case where the
  // rebase fails and no "git push" step is ever recorded.
  if (shouldCommit && shouldPush && committed && !pushed) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
