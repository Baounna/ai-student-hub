#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { loadScriptEnv } from "./lib/load-env.mjs";

const ROOT = process.cwd();
loadScriptEnv(ROOT);
const STATE_FILE = path.join(ROOT, "docs/agent/issues-state.json");
const REPORT_FILE = path.join(ROOT, "docs/agent/issues-report.md");

const SOURCE_ORDER = ["operator", "design"];
const SOURCE_CONFIG = {
  operator: {
    label: "Operator",
    queueFile: path.join(ROOT, "docs/agent/next-actions.json"),
    includeEnv: "AGENT_ISSUES_INCLUDE_OPERATOR",
    defaultEnabled: true
  },
  design: {
    label: "Design",
    queueFile: path.join(ROOT, "docs/agent/design-actions.json"),
    includeEnv: "AGENT_ISSUES_INCLUDE_DESIGN",
    defaultEnabled: true
  }
};

const PRIORITY_RANK = {
  P1: 1,
  P2: 2,
  P3: 3
};

function toInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback) {
  if (value == null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on", "enabled", "enable"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled", "disable"].includes(normalized)) return false;
  return fallback;
}

function shortHash(input) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function normalizePriority(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "P1" || normalized === "P2" || normalized === "P3" ? normalized : "P3";
}

function sourceRank(sourceId) {
  const index = SOURCE_ORDER.indexOf(sourceId);
  return index >= 0 ? index : 99;
}

function buildActionHash(item) {
  return shortHash(
    [
      item.sourceId || "operator",
      normalizePriority(item.priority),
      String(item.action || "").trim(),
      String(item.why || "").trim(),
      String(item.file || "").trim(),
      String(item.checkId || "").trim()
    ].join("|")
  );
}

function truncate(value, limit) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

function buildIssueTitle(item) {
  return `[${item.sourceLabel} ${normalizePriority(item.priority)}] ${truncate(item.action || "Agent task", 84)}`;
}

async function safeReadJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function normalizeSourceId(sourceId) {
  return sourceId === "design" ? "design" : "operator";
}

function normalizeSourceLabel(sourceId) {
  const config = SOURCE_CONFIG[sourceId];
  return config?.label || "Operator";
}

function normalizeQueueFile(value, sourceId) {
  const raw = String(value || "").trim();
  const fallback = path.relative(ROOT, SOURCE_CONFIG[sourceId].queueFile);
  if (!raw) return fallback;

  const absolute = path.isAbsolute(raw) ? raw : path.join(ROOT, raw);
  if (absolute.startsWith(ROOT)) return path.relative(ROOT, absolute);
  return raw;
}

function parseTime(value) {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function statusRank(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "created") return 6;
  if (normalized === "already_open") return 5;
  if (normalized === "already_tracked") return 4;
  if (normalized === "tracked") return 3;
  if (normalized === "dry-run" || normalized === "disabled") return 2;
  if (normalized === "error") return 1;
  return 0;
}

function pickBetterStateItem(a, b) {
  const scoreA = (a.issueNumber ? 100 : 0) + statusRank(a.status) * 10 + (a.inQueue ? 1 : 0);
  const scoreB = (b.issueNumber ? 100 : 0) + statusRank(b.status) * 10 + (b.inQueue ? 1 : 0);
  if (scoreA !== scoreB) return scoreA > scoreB ? a : b;

  const timeA = parseTime(a.lastSeenAt);
  const timeB = parseTime(b.lastSeenAt);
  if (timeA !== timeB) return timeA > timeB ? a : b;

  return b;
}

function prioritySort(a, b) {
  const rankA = PRIORITY_RANK[normalizePriority(a.priority)] || 99;
  const rankB = PRIORITY_RANK[normalizePriority(b.priority)] || 99;
  if (rankA !== rankB) return rankA - rankB;

  const sourceA = sourceRank(normalizeSourceId(a.sourceId));
  const sourceB = sourceRank(normalizeSourceId(b.sourceId));
  if (sourceA !== sourceB) return sourceA - sourceB;

  return String(a.action || "").localeCompare(String(b.action || ""));
}

function normalizeQueuedAction(rawAction, context) {
  const action = String(rawAction?.action || "").trim();
  if (!action) return null;

  const priority = normalizePriority(rawAction?.priority);
  const why = String(rawAction?.why || "").trim() || `${context.label} agent task for execution quality.`;
  const file = String(rawAction?.file || "").trim();
  const checkId = String(rawAction?.checkId || "").trim();

  return {
    sourceId: context.sourceId,
    sourceLabel: context.label,
    queueFile: context.queueFile,
    queueGeneratedAt: context.queueGeneratedAt,
    priority,
    action,
    why,
    file,
    checkId
  };
}

async function loadQueueSource(sourceId) {
  const source = SOURCE_CONFIG[sourceId];
  const enabled = toBoolean(process.env[source.includeEnv], source.defaultEnabled);

  if (!enabled) {
    return {
      sourceId,
      label: source.label,
      queueFile: path.relative(ROOT, source.queueFile),
      enabled,
      queueGeneratedAt: "",
      totalActions: 0,
      actions: []
    };
  }

  const queue = await safeReadJson(source.queueFile, { generatedAt: "", actions: [] });
  const queueGeneratedAt = String(queue.generatedAt || "").trim();
  const rawActions = Array.isArray(queue.actions) ? queue.actions : [];

  const context = {
    sourceId,
    label: source.label,
    queueFile: path.relative(ROOT, source.queueFile),
    queueGeneratedAt
  };

  const actions = rawActions
    .map((item) => normalizeQueuedAction(item, context))
    .filter((item) => Boolean(item));

  return {
    sourceId,
    label: source.label,
    queueFile: context.queueFile,
    enabled,
    queueGeneratedAt,
    totalActions: actions.length,
    actions
  };
}

function buildIssueBody({ item, generatedAt }) {
  const lines = [];
  lines.push("## Agent Task");
  lines.push("");
  lines.push(`- Source: ${item.sourceLabel}`);
  lines.push(`- Priority: ${normalizePriority(item.priority)}`);
  lines.push(`- Action: ${item.action}`);
  lines.push(`- Why: ${item.why}`);
  if (item.file) lines.push(`- Target file: ${item.file}`);
  if (item.checkId) lines.push(`- Check id: ${item.checkId}`);
  lines.push("");
  lines.push("## Queue Metadata");
  lines.push("");
  lines.push(`- Queue file: \`${item.queueFile}\``);
  lines.push(`- Queue generated at: ${item.queueGeneratedAt || "unknown"}`);
  lines.push(`- Issue sync generated at: ${generatedAt}`);
  lines.push("");
  lines.push("## Acceptance");
  lines.push("");
  lines.push("- [ ] Implement this action in code/content/config");
  lines.push("- [ ] Run `npm run lint`");
  lines.push("- [ ] Run `npm run build`");
  lines.push("- [ ] Update docs if behavior changed");
  lines.push("");
  lines.push(`Tracking hash: \`${buildActionHash(item)}\``);
  lines.push("");

  return lines.join("\n");
}

async function githubRequest({ repository, token, method, apiPath, body }) {
  const url = `https://api.github.com/repos/${repository}${apiPath}`;
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`${method} ${apiPath} failed (${response.status}): ${truncate(raw, 360)}`);
  }

  return response.json();
}

function normalizeStateItem(rawItem, generatedAt) {
  const sourceId = normalizeSourceId(rawItem?.sourceId);
  const sourceLabel = normalizeSourceLabel(sourceId);
  const normalized = {
    hash: "",
    sourceId,
    sourceLabel,
    queueFile: normalizeQueueFile(rawItem?.queueFile, sourceId),
    queueGeneratedAt: String(rawItem?.queueGeneratedAt || "").trim(),
    priority: normalizePriority(rawItem?.priority),
    action: String(rawItem?.action || "").trim(),
    why: String(rawItem?.why || "").trim(),
    file: String(rawItem?.file || "").trim(),
    checkId: String(rawItem?.checkId || "").trim(),
    title: String(rawItem?.title || "").trim(),
    issueNumber: typeof rawItem?.issueNumber === "number" ? rawItem.issueNumber : undefined,
    issueUrl: String(rawItem?.issueUrl || "").trim() || undefined,
    status: String(rawItem?.status || "historical").trim() || "historical",
    createdAt: String(rawItem?.createdAt || generatedAt).trim() || generatedAt,
    lastSeenAt: String(rawItem?.lastSeenAt || generatedAt).trim() || generatedAt,
    inQueue: Boolean(rawItem?.inQueue)
  };

  normalized.hash = buildActionHash(normalized);
  if (!normalized.title) {
    normalized.title = buildIssueTitle(normalized);
  }

  return normalized;
}

function buildReport({ generatedAt, mode, repository, maxPerRun, sources, created, existing, dryRun, errors, tracked }) {
  const lines = [];

  lines.push("# AI and Cybersecurity News Agent Issue Sync");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Mode: ${mode}`);
  lines.push(`Repository: ${repository || "(not set)"}`);
  lines.push(`Max issues per run: ${maxPerRun}`);
  lines.push("");

  lines.push("## Queue Sources");
  for (const source of sources) {
    lines.push(`- ${source.label}: enabled=${source.enabled ? "YES" : "NO"} | actions=${source.totalActions} | queue=${source.queueFile}`);
    if (source.queueGeneratedAt) {
      lines.push(`  - Queue generated at: ${source.queueGeneratedAt}`);
    }
    lines.push(`  - Selected this run: ${source.selectedCount}`);
  }
  lines.push("");

  lines.push("## Run Summary");
  lines.push(`- Created: ${created.length}`);
  lines.push(`- Already open/tracked: ${existing.length}`);
  lines.push(`- Dry-run candidates: ${dryRun.length}`);
  lines.push(`- Errors: ${errors.length}`);
  lines.push(`- Tracked total: ${tracked.length}`);
  lines.push("");

  if (created.length) {
    lines.push("## Created");
    created.forEach((item) => {
      lines.push(`- #${item.issueNumber} [${item.sourceLabel}] ${item.title}`);
    });
    lines.push("");
  }

  if (existing.length) {
    lines.push("## Existing");
    existing.forEach((item) => {
      const issueLabel = item.issueNumber ? `#${item.issueNumber}` : "(tracked)";
      lines.push(`- ${issueLabel} [${item.sourceLabel}] ${item.title}`);
    });
    lines.push("");
  }

  if (dryRun.length) {
    lines.push("## Dry-run");
    dryRun.forEach((item) => {
      lines.push(`- [${item.sourceLabel}] ${item.title}`);
    });
    lines.push("");
  }

  if (errors.length) {
    lines.push("## Errors");
    errors.forEach((error) => lines.push(`- ${error}`));
    lines.push("");
  }

  lines.push("## Tracked Actions");
  tracked
    .slice()
    .sort(prioritySort)
    .forEach((item) => {
      lines.push(`- [${item.sourceLabel} ${normalizePriority(item.priority)}] ${item.action}`);
      if (item.issueNumber) lines.push(`  - Issue: #${item.issueNumber}`);
      lines.push(`  - Status: ${item.status}`);
      lines.push(`  - Last seen: ${item.lastSeenAt}`);
    });
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function run() {
  const generatedAt = new Date().toISOString();
  const enabled = toBoolean(process.env.AGENT_ISSUES_ENABLED, true);
  const maxPerRun = Math.max(0, Math.min(toInteger(process.env.AGENT_ISSUES_MAX_PER_RUN, 3), 20));
  const token = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "").trim();
  const repository = (process.env.GITHUB_REPOSITORY || "").trim();

  const sourceStates = [];
  for (const sourceId of SOURCE_ORDER) {
    sourceStates.push(await loadQueueSource(sourceId));
  }

  const queuedActions = sourceStates
    .flatMap((source) => source.actions)
    .sort(prioritySort)
    .slice(0, maxPerRun);

  const selectedBySource = new Map();
  queuedActions.forEach((action) => {
    const current = selectedBySource.get(action.sourceId) || 0;
    selectedBySource.set(action.sourceId, current + 1);
  });

  const sourcesWithSelection = sourceStates.map((source) => ({
    ...source,
    selectedCount: selectedBySource.get(source.sourceId) || 0
  }));

  const mode = !enabled ? "disabled" : token && repository ? "enabled" : "dry-run";

  const state = await safeReadJson(STATE_FILE, {
    generatedAt: "",
    repository,
    mode: "init",
    items: []
  });

  const stateByHash = new Map();
  const existingItems = Array.isArray(state.items) ? state.items : [];

  for (const item of existingItems) {
    const normalized = normalizeStateItem(item, generatedAt);
    const existing = stateByHash.get(normalized.hash);
    stateByHash.set(normalized.hash, existing ? pickBetterStateItem(existing, normalized) : normalized);
  }

  let openIssues = [];
  if (mode === "enabled") {
    const open = await githubRequest({
      repository,
      token,
      method: "GET",
      apiPath: "/issues?state=open&per_page=100"
    });
    openIssues = Array.isArray(open) ? open.filter((item) => !item.pull_request) : [];
  }

  const openByTitle = new Map(openIssues.map((issue) => [String(issue.title || ""), issue]));

  const created = [];
  const existing = [];
  const dryRun = [];
  const errors = [];
  const touchedHashes = new Set();

  for (const action of queuedActions) {
    const hash = buildActionHash(action);
    const previous = stateByHash.get(hash);
    const title = buildIssueTitle(action);
    const openIssue = openByTitle.get(title);

    const nextStateItem = {
      hash,
      sourceId: action.sourceId,
      sourceLabel: action.sourceLabel,
      queueFile: action.queueFile,
      queueGeneratedAt: action.queueGeneratedAt,
      priority: normalizePriority(action.priority),
      action: action.action,
      why: action.why,
      file: action.file,
      checkId: action.checkId,
      title,
      issueNumber: previous?.issueNumber,
      issueUrl: previous?.issueUrl,
      status: "tracked",
      createdAt: previous?.createdAt || generatedAt,
      lastSeenAt: generatedAt,
      inQueue: true
    };

    touchedHashes.add(hash);

    if (openIssue) {
      nextStateItem.issueNumber = openIssue.number;
      nextStateItem.issueUrl = openIssue.html_url;
      nextStateItem.status = "already_open";
      existing.push(nextStateItem);
      stateByHash.set(hash, nextStateItem);
      continue;
    }

    if (previous?.issueNumber) {
      nextStateItem.status = "already_tracked";
      existing.push(nextStateItem);
      stateByHash.set(hash, nextStateItem);
      continue;
    }

    if (mode !== "enabled") {
      nextStateItem.status = mode;
      dryRun.push(nextStateItem);
      stateByHash.set(hash, nextStateItem);
      continue;
    }

    try {
      const createdIssue = await githubRequest({
        repository,
        token,
        method: "POST",
        apiPath: "/issues",
        body: {
          title,
          body: buildIssueBody({ item: action, generatedAt })
        }
      });

      nextStateItem.issueNumber = createdIssue.number;
      nextStateItem.issueUrl = createdIssue.html_url;
      nextStateItem.status = "created";
      created.push(nextStateItem);
      stateByHash.set(hash, nextStateItem);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      nextStateItem.status = "error";
      errors.push(`${title}: ${message}`);
      stateByHash.set(hash, nextStateItem);
    }
  }

  for (const [hash, item] of stateByHash.entries()) {
    if (touchedHashes.has(hash)) continue;
    stateByHash.set(hash, {
      ...item,
      inQueue: false,
      status: item.status || "historical"
    });
  }

  const tracked = Array.from(stateByHash.values()).sort(prioritySort);

  const nextState = {
    generatedAt,
    repository,
    mode,
    maxPerRun,
    sources: sourcesWithSelection.map((source) => ({
      sourceId: source.sourceId,
      label: source.label,
      queueFile: source.queueFile,
      enabled: source.enabled,
      queueGeneratedAt: source.queueGeneratedAt,
      totalActions: source.totalActions,
      selectedCount: source.selectedCount
    })),
    summary: {
      created: created.length,
      existing: existing.length,
      dryRun: dryRun.length,
      errors: errors.length,
      tracked: tracked.length
    },
    items: tracked
  };

  const report = buildReport({
    generatedAt,
    mode,
    repository,
    maxPerRun,
    sources: sourcesWithSelection,
    created,
    existing,
    dryRun,
    errors,
    tracked
  });

  await ensureDir(STATE_FILE);
  await fs.writeFile(STATE_FILE, `${JSON.stringify(nextState, null, 2)}\n`, "utf8");
  await fs.writeFile(REPORT_FILE, report, "utf8");

  console.log("Agent Issue Sync");
  console.log("----------------");
  console.log(`Mode: ${mode}`);
  console.log(`Selected actions: ${queuedActions.length}`);
  console.log(`Created: ${created.length}`);
  console.log(`Existing: ${existing.length}`);
  console.log(`Dry-run: ${dryRun.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`State: ${path.relative(ROOT, STATE_FILE)}`);
  console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);

  if (errors.length && mode === "enabled") {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
