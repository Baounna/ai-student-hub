#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

const FILES = {
  autoNews: path.join(ROOT, "src/content/auto-news.json"),
  operatorReport: path.join(ROOT, "docs/agent/latest-report.md"),
  operatorQueue: path.join(ROOT, "docs/agent/next-actions.json"),
  designReport: path.join(ROOT, "docs/agent/design-report.md"),
  designQueue: path.join(ROOT, "docs/agent/design-actions.json"),
  issuesReport: path.join(ROOT, "docs/agent/issues-report.md"),
  issuesState: path.join(ROOT, "docs/agent/issues-state.json")
};

function toInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function parseTimestamp(value) {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? timestamp : null;
}

function ageHours(value) {
  const ts = parseTimestamp(value);
  if (ts == null) return null;
  return (Date.now() - ts) / (1000 * 60 * 60);
}

function log(type, message) {
  const icon = type === "ERROR" ? "✖" : type === "WARN" ? "▲" : "✔";
  console.log(`${icon} [${type}] ${message}`);
}

async function run() {
  const maxAgeHours = Math.max(1, Math.min(toInteger(process.env.AGENT_HEALTH_MAX_AGE_HOURS, 96), 24 * 30));
  let errors = 0;
  let warns = 0;

  const ok = (message) => log("OK", message);
  const warn = (message) => {
    warns += 1;
    log("WARN", message);
  };
  const fail = (message) => {
    errors += 1;
    log("ERROR", message);
  };

  console.log("Agent health verification");
  console.log("-------------------------");

  for (const [label, filePath] of Object.entries(FILES)) {
    const present = await exists(filePath);
    if (!present) {
      fail(`Missing required file: ${path.relative(ROOT, filePath)} (${label})`);
    } else {
      ok(`Found: ${path.relative(ROOT, filePath)}`);
    }
  }

  if (errors) {
    console.log("-------------------------");
    console.log(`Health check failed early: ${errors} error(s), ${warns} warning(s).`);
    process.exitCode = 1;
    return;
  }

  const autoNews = await readJson(FILES.autoNews);
  if (!Array.isArray(autoNews.items)) {
    fail("auto-news.json is missing an items array.");
  } else {
    ok(`Auto news items: ${autoNews.items.length}`);
    if (!autoNews.items.length) warn("Auto news feed is empty.");
  }

  const operatorQueue = await readJson(FILES.operatorQueue);
  if (!Array.isArray(operatorQueue.actions)) {
    fail("next-actions.json missing actions array.");
  } else {
    ok(`Operator actions: ${operatorQueue.actions.length}`);
  }

  const designQueue = await readJson(FILES.designQueue);
  if (!Array.isArray(designQueue.actions)) {
    fail("design-actions.json missing actions array.");
  } else {
    ok(`Design actions: ${designQueue.actions.length}`);
  }

  const issuesState = await readJson(FILES.issuesState);
  if (!Array.isArray(issuesState.items)) {
    fail("issues-state.json missing items array.");
  } else {
    ok(`Issue state entries: ${issuesState.items.length}`);
    const byHash = new Map();
    for (const item of issuesState.items) {
      const hash = String(item.hash || "").trim();
      if (!hash) {
        fail("issues-state contains item with empty hash.");
        continue;
      }
      if (byHash.has(hash)) {
        fail(`Duplicate issue-state hash detected: ${hash}`);
      }
      byHash.set(hash, true);
    }
  }

  const freshnessChecks = [
    ["operator queue", operatorQueue.generatedAt],
    ["design queue", designQueue.generatedAt],
    ["issues state", issuesState.generatedAt]
  ];

  for (const [label, value] of freshnessChecks) {
    const age = ageHours(value);
    if (age == null) {
      warn(`${label} missing valid generatedAt timestamp.`);
      continue;
    }

    if (age > maxAgeHours) {
      warn(`${label} is stale (${age.toFixed(1)}h > ${maxAgeHours}h).`);
    } else {
      ok(`${label} freshness: ${age.toFixed(1)}h`);
    }
  }

  console.log("-------------------------");
  if (errors) {
    console.log(`Agent health failed: ${errors} error(s), ${warns} warning(s).`);
    process.exitCode = 1;
  } else {
    console.log(`Agent health passed with ${warns} warning(s).`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
