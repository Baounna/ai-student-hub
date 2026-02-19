#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const REPORT_FILE = path.join(ROOT, "docs/agent/pipeline-report.md");
const STATUS_FILE = path.join(ROOT, "docs/agent/pipeline-status.json");

function toBoolean(value, fallback) {
  if (value == null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on", "enabled", "enable"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled", "disable"].includes(normalized)) return false;
  return fallback;
}

function toInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function elapsedLabel(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function runStep(step, envExtras = {}) {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    const child = spawn(step.command, step.args, {
      cwd: ROOT,
      env: { ...process.env, ...envExtras },
      stdio: "inherit"
    });

    child.on("error", (error) => {
      resolve({
        id: step.id,
        label: step.label,
        ok: false,
        code: -1,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error)
      });
    });

    child.on("close", (code) => {
      resolve({
        id: step.id,
        label: step.label,
        ok: code === 0,
        code: typeof code === "number" ? code : -1,
        durationMs: Date.now() - startedAt,
        error: code === 0 ? undefined : `Process exited with code ${code}`
      });
    });
  });
}

function buildMarkdown({ generatedAt, settings, results }) {
  const lines = [];
  const failed = results.filter((step) => !step.ok);

  lines.push("# AI Student Hub Agent Pipeline Report");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Overall: ${failed.length ? "FAILED" : "SUCCESS"}`);
  lines.push("");

  lines.push("## Settings");
  lines.push(`- Auto news: ${settings.includeAutoNews ? "ON" : "OFF"}`);
  lines.push(`- Blog operator: ${settings.includeOperator ? "ON" : "OFF"}`);
  lines.push(`- Blog design: ${settings.includeDesign ? "ON" : "OFF"}`);
  lines.push(`- Issue sync: ${settings.includeIssues ? "ON" : "OFF"}`);
  lines.push(`- Agent health verify: ${settings.includeVerify ? "ON" : "OFF"}`);
  lines.push(`- Issue max per run: ${settings.issuesMaxPerRun}`);
  lines.push("");

  lines.push("## Step Results");
  for (const result of results) {
    const marker = result.ok ? "PASS" : "FAIL";
    lines.push(`- [${marker}] ${result.label} (${elapsedLabel(result.durationMs)})`);
    if (!result.ok && result.error) {
      lines.push(`  - ${result.error}`);
    }
  }
  lines.push("");

  if (failed.length) {
    lines.push("## Failures");
    failed.forEach((item) => {
      lines.push(`- ${item.label}: ${item.error || `exit ${item.code}`}`);
    });
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function run() {
  const generatedAt = new Date().toISOString();
  const settings = {
    includeAutoNews: toBoolean(process.env.AGENT_PIPELINE_INCLUDE_AUTO_NEWS, true),
    includeOperator: toBoolean(process.env.AGENT_PIPELINE_INCLUDE_OPERATOR, true),
    includeDesign: toBoolean(process.env.AGENT_PIPELINE_INCLUDE_DESIGN, true),
    includeIssues: toBoolean(process.env.AGENT_PIPELINE_INCLUDE_ISSUES, true),
    includeVerify: toBoolean(process.env.AGENT_PIPELINE_INCLUDE_VERIFY, true),
    writeReports: toBoolean(process.env.AGENT_PIPELINE_WRITE_REPORTS, true),
    issuesMaxPerRun: Math.max(1, Math.min(toInteger(process.env.AGENT_PIPELINE_ISSUES_MAX_PER_RUN, 6), 20))
  };

  const steps = [];
  if (settings.includeAutoNews) {
    steps.push({ id: "auto-news", label: "Auto news agent", command: "node", args: ["scripts/auto-news-agent.mjs"] });
  }
  if (settings.includeOperator) {
    steps.push({ id: "operator", label: "Blog operator agent", command: "node", args: ["scripts/blog-operator-agent.mjs"] });
  }
  if (settings.includeDesign) {
    steps.push({ id: "design", label: "Blog design agent", command: "node", args: ["scripts/blog-design-agent.mjs"] });
  }
  if (settings.includeIssues) {
    steps.push({ id: "issues", label: "Issue sync", command: "node", args: ["scripts/sync-operator-issues.mjs"] });
  }
  if (settings.includeVerify) {
    steps.push({ id: "verify", label: "Agent health verification", command: "node", args: ["scripts/verify-agent-health.mjs"] });
  }

  if (!steps.length) {
    console.log("No pipeline steps enabled. Nothing to run.");
    return;
  }

  const results = [];
  for (const step of steps) {
    const envExtras = step.id === "issues"
      ? {
          AGENT_ISSUES_INCLUDE_OPERATOR: settings.includeOperator ? "1" : "0",
          AGENT_ISSUES_INCLUDE_DESIGN: settings.includeDesign ? "1" : "0",
          AGENT_ISSUES_MAX_PER_RUN: String(settings.issuesMaxPerRun)
        }
      : {};

    // Keep execution deterministic: each agent runs after its dependencies.
    const result = await runStep(step, envExtras);
    results.push(result);
    if (!result.ok) break;
  }

  const payload = {
    generatedAt,
    settings,
    summary: {
      total: results.length,
      passed: results.filter((step) => step.ok).length,
      failed: results.filter((step) => !step.ok).length,
      success: results.every((step) => step.ok)
    },
    steps: results
  };

  if (settings.writeReports) {
    const report = buildMarkdown({ generatedAt, settings, results });
    await fs.mkdir(path.dirname(REPORT_FILE), { recursive: true });
    await fs.writeFile(REPORT_FILE, report, "utf8");
    await fs.writeFile(STATUS_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }

  console.log("Agent pipeline");
  console.log("--------------");
  console.log(`Steps executed: ${results.length}`);
  console.log(`Success: ${payload.summary.success ? "YES" : "NO"}`);
  if (settings.writeReports) {
    console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
    console.log(`Status: ${path.relative(ROOT, STATUS_FILE)}`);
  } else {
    console.log("Report writing: disabled");
  }

  if (!payload.summary.success) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
