#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { loadScriptEnv } from "./lib/load-env.mjs";

const ROOT = process.cwd();
loadScriptEnv(ROOT);

const FILES = {
  autoTools: path.join(ROOT, "src/content/auto-tools.json"),
  autoNews: path.join(ROOT, "src/content/auto-news.json"),
  comparePage: path.join(ROOT, "src/app/[lang]/compare/page.tsx"),
  newsPage: path.join(ROOT, "src/app/[lang]/news/page.tsx"),
  liveNewsPage: path.join(ROOT, "src/app/[lang]/news/live/page.tsx"),
  editorialPolicy: path.join(ROOT, "docs/editorial-policy.md"),
  operatorReport: path.join(ROOT, "docs/agent/latest-report.md"),
  operatorQueue: path.join(ROOT, "docs/agent/next-actions.json"),
  designReport: path.join(ROOT, "docs/agent/design-report.md"),
  designQueue: path.join(ROOT, "docs/agent/design-actions.json"),
  dailyChecklist: path.join(ROOT, "docs/agent/daily-checklist.md"),
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

async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
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

function hasBlockedSourcePattern(item) {
  const values = [item?.source, item?.sourceFeed, item?.href].join(" ").toLowerCase();
  return values.includes("arxiv.org") || /\barxiv\b/.test(values);
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
  const autoTools = await readJson(FILES.autoTools);

  if (!Array.isArray(autoTools.items)) {
    fail("auto-tools.json is missing an items array.");
  } else {
    ok(`Auto tools items: ${autoTools.items.length}`);
    const blocked = autoTools.items.filter((item) => hasBlockedSourcePattern(item));
    if (blocked.length) {
      fail(`auto-tools.json contains blocked source patterns (e.g. arXiv): ${blocked.length} item(s).`);
    } else {
      ok("Auto tools source policy check: no blocked source patterns found.");
    }

    const missingSourceLabels = autoTools.items.filter(
      (item) =>
        !String(item?.source || "").trim() ||
        !String(item?.href || "").trim() ||
        !String(item?.sourceFeed || "").trim()
    );
    if (missingSourceLabels.length) {
      fail(`auto-tools.json has ${missingSourceLabels.length} item(s) missing source labels/links.`);
    } else {
      ok("Auto tools source labels are present on all items.");
    }

    if (!autoTools.items.length) {
      const comparePageText = await readText(FILES.comparePage);
      const hasToolsFallback =
        comparePageText.includes("No new tools captured yet.") &&
        comparePageText.includes("Aucune nouveaute captee pour le moment.");

      if (hasToolsFallback) {
        ok("Auto tools feed is empty; EN/FR fallback state is present on tools page.");
      } else {
        warn("Auto tools feed is empty and fallback state looks incomplete.");
      }
    }
  }

  if (!Array.isArray(autoNews.items)) {
    fail("auto-news.json is missing an items array.");
  } else {
    ok(`Auto news items: ${autoNews.items.length}`);
    const blocked = autoNews.items.filter((item) => hasBlockedSourcePattern(item));
    if (blocked.length) {
      fail(`auto-news.json contains blocked source patterns (e.g. arXiv): ${blocked.length} item(s).`);
    } else {
      ok("Auto news source policy check: no blocked source patterns found.");
    }

    const missingSourceLabels = autoNews.items.filter(
      (item) =>
        !String(item?.source || "").trim() ||
        !String(item?.href || "").trim() ||
        !String(item?.sourceFeed || "").trim()
    );
    if (missingSourceLabels.length) {
      fail(`auto-news.json has ${missingSourceLabels.length} item(s) missing source labels/links.`);
    } else {
      ok("Auto news source labels are present on all items.");
    }

    if (!autoNews.items.length) {
      const [newsPageText, liveNewsPageText] = await Promise.all([
        readText(FILES.newsPage),
        readText(FILES.liveNewsPage)
      ]);
      const hasNewsFallback =
        newsPageText.includes("No new items yet.") &&
        newsPageText.includes("Aucun nouvel item pour le moment.");
      const hasLiveFallback =
        liveNewsPageText.includes("No updates available right now") &&
        liveNewsPageText.includes("Aucune mise a jour disponible");

      if (hasNewsFallback && hasLiveFallback) {
        ok("Auto news feed is empty; EN/FR fallback states are present on news pages.");
      } else {
        warn("Auto news feed is empty and fallback states look incomplete.");
      }
    }
  }

  const operatorQueue = await readJson(FILES.operatorQueue);
  if (!Array.isArray(operatorQueue.actions)) {
    fail("next-actions.json missing actions array.");
  } else {
    ok(`Operator actions: ${operatorQueue.actions.length}`);
  }
  if (!operatorQueue.editorial || typeof operatorQueue.editorial !== "object") {
    warn("next-actions.json missing editorial audit block.");
  } else {
    const tracks = operatorQueue.editorial?.tracks?.counts;
    if (!tracks || typeof tracks.ai !== "number" || typeof tracks.cs !== "number") {
      warn("Editorial audit track counts are missing or invalid in operator queue.");
    } else {
      ok(`Editorial tracks: AI=${tracks.ai} CS=${tracks.cs}`);
    }
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
