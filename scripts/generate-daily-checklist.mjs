#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const NEXT_ACTIONS_PATH = path.join(ROOT, "docs/agent/next-actions.json");
const DESIGN_ACTIONS_PATH = path.join(ROOT, "docs/agent/design-actions.json");
const ISSUES_STATE_PATH = path.join(ROOT, "docs/agent/issues-state.json");
const OUTPUT_PATH = path.join(ROOT, "docs/agent/daily-checklist.md");

const priorityWeight = {
  P1: 1,
  P2: 2,
  P3: 3
};

async function readJson(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function formatList(items) {
  if (!items.length) return ["- None"];
  return items.map((item) => `- ${item}`);
}

function clipText(value, max = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function sortByPriority(actions) {
  return [...actions].sort((a, b) => {
    const aPriority = priorityWeight[a.priority] || 99;
    const bPriority = priorityWeight[b.priority] || 99;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return String(a.action || "").localeCompare(String(b.action || ""));
  });
}

async function run() {
  const generatedAt = new Date().toISOString();
  const nextActions = (await readJson(NEXT_ACTIONS_PATH)) || {};
  const designActions = (await readJson(DESIGN_ACTIONS_PATH)) || {};
  const issuesState = (await readJson(ISSUES_STATE_PATH)) || {};

  const operatorActionsRaw = Array.isArray(nextActions.actions) ? nextActions.actions : [];
  const operatorActions = sortByPriority(
    operatorActionsRaw.filter((item) => item && typeof item.action === "string")
  );

  const p1 = operatorActions.filter((item) => item.priority === "P1").slice(0, 4);
  const p2 = operatorActions.filter((item) => item.priority === "P2").slice(0, 4);
  const p3 = operatorActions.filter((item) => item.priority === "P3").slice(0, 4);

  const rawOpportunities = Array.isArray(nextActions.opportunities) ? nextActions.opportunities : [];
  const nonArxivOpportunities = rawOpportunities.filter((item) => {
    const source = String(item?.source || "").toLowerCase();
    const href = String(item?.href || "").toLowerCase();
    return !source.includes("arxiv") && !href.includes("arxiv.org");
  });
  const opportunities = nonArxivOpportunities.slice(0, 5);

  const designQueue = Array.isArray(designActions.actions) ? designActions.actions.slice(0, 5) : [];
  const issuesItems = Array.isArray(issuesState.items) ? issuesState.items : [];
  const openQueueItems = issuesItems.filter((item) => item && item.inQueue).slice(0, 6);

  const revenueEstimate = nextActions.revenueModel?.estimate || null;
  const monetizationState = nextActions.monetization || null;
  const editorialState = nextActions.editorial?.tracks || null;

  const lines = [];
  lines.push("# Daily Semi-Autopilot Checklist");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("");
  lines.push("Use this file as your daily execution board. It is generated from agent outputs.");
  lines.push("");

  lines.push("## Snapshot");
  lines.push(
    ...formatList([
      monetizationState
        ? `Affiliate links active: ${monetizationState.validAffiliates ?? 0}`
        : "",
      monetizationState
        ? `Checkout URL active: ${monetizationState.hasCheckoutUrl ? "yes" : "no"}`
        : "",
      monetizationState
        ? `Email provider: ${monetizationState.emailProvider || "none"}`
        : "",
      editorialState
        ? `Editorial split (AI/CS/Career): ${editorialState.counts?.ai ?? 0}/${editorialState.counts?.cs ?? 0}/${editorialState.counts?.career ?? 0}`
        : "",
      revenueEstimate
        ? `Revenue estimate (model): $${Number(revenueEstimate.totalRevenue || 0).toFixed(2)}`
        : ""
    ].filter(Boolean))
  );
  lines.push("");

  lines.push("## Must Do Today (P1)");
  lines.push(
    ...formatList(
      p1.map((item) => `${clipText(item.action)} — Why: ${clipText(item.why, 140)}`)
    )
  );
  lines.push("");

  lines.push("## Should Do This Week (P2)");
  lines.push(
    ...formatList(
      p2.map((item) => `${clipText(item.action)} — Why: ${clipText(item.why, 140)}`)
    )
  );
  lines.push("");

  lines.push("## Nice-to-Have (P3)");
  lines.push(
    ...formatList(
      p3.map((item) => `${clipText(item.action)} — Why: ${clipText(item.why, 140)}`)
    )
  );
  lines.push("");

  lines.push("## Content Briefs To Draft");
  lines.push(
    ...formatList(
      opportunities.map((item) => {
        const source = clipText(item.source || "Unknown source", 42);
        const title = clipText(item.title || item.sourceTitle || item.slug || "Untitled", 120);
        return `[${source}] ${title}`;
      })
    )
  );
  lines.push("");

  lines.push("## UI / Design Queue");
  lines.push(
    ...formatList(
      designQueue.map((item) => {
        const scope = clipText(item.file || "ui", 50);
        return `${clipText(item.action)} (${scope})`;
      })
    )
  );
  lines.push("");

  lines.push("## Open Issue Queue (Agent)");
  lines.push(
    ...formatList(
      openQueueItems.map((item) => {
        const priority = item.priority || "P?";
        return `${priority} — ${clipText(item.action)} (${item.status || "pending"})`;
      })
    )
  );
  lines.push("");

  lines.push("## Daily Runbook");
  lines.push("- 1) Run `npm run agent:all`.");
  lines.push("- 2) Run `npm run lint && npm run build`.");
  lines.push("- 3) Run `npm run verify:production && npm run verify:affiliates && npm run verify:public-content && npm run verify:agents`.");
  lines.push("- 4) Publish 1 high-intent page or improve 1 existing money page.");
  lines.push("- 5) Distribute at least 1 post on LinkedIn with one clear CTA.");
  lines.push("");

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${lines.join("\n")}\n`, "utf8");
  console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
