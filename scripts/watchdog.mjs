#!/usr/bin/env node
/**
 * Watchdog — the check that runs when nobody is looking.
 *
 * The project already had five verify:* scripts, but nothing ran them on a
 * schedule and nothing told a human when they failed. That is how a broken
 * lockfile went unnoticed for eighty days while every scheduled run failed
 * sixteen seconds in.
 *
 * This checks the things that actually matter to a reader — is the site up,
 * is it serving fresh content — as well as the things that silently rot, and
 * prints a Markdown report the workflow turns into a single GitHub issue.
 *
 * Exit 0 = healthy. Exit 1 = something needs attention.
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { loadScriptEnv } from "./lib/load-env.mjs";

// Same env loading the verify:* scripts use, so a check that depends on local
// configuration behaves identically whether run here or on a runner.
loadScriptEnv(process.cwd());

const execFileAsync = promisify(execFile);

const SITE = (process.env.WATCHDOG_SITE_URL || "https://ai-student-hub-navy.vercel.app").replace(/\/+$/, "");
const MAX_CONTENT_AGE_HOURS = Number.parseInt(process.env.WATCHDOG_MAX_CONTENT_AGE_HOURS || "72", 10);
const TIMEOUT_SECONDS = 25;

/** @type {{name:string, ok:boolean, detail:string, fixable:boolean}[]} */
const results = [];

function record(name, ok, detail, fixable = false) {
  results.push({ name, ok, detail, fixable });
  console.log(`${ok ? "✔" : "✖"} ${name} — ${detail}`);
}

async function curlStatus(url) {
  const { stdout } = await execFileAsync("curl", [
    "-sL",
    "-o",
    "/dev/null",
    "-w",
    "%{http_code}",
    "--max-time",
    String(TIMEOUT_SECONDS),
    url
  ]);
  return Number.parseInt(String(stdout).trim(), 10);
}

/** The reader's view: if these are down, nothing else matters. */
async function checkLiveSite() {
  const paths = ["/en", "/fr", "/en/news", "/feed.xml", "/sitemap.xml"];
  const bad = [];

  for (const p of paths) {
    try {
      const code = await curlStatus(`${SITE}${p}`);
      if (code !== 200) bad.push(`${p} → ${code}`);
    } catch (error) {
      bad.push(`${p} → unreachable (${String(error?.message || error).slice(0, 60)})`);
    }
  }

  record(
    "Live site",
    bad.length === 0,
    bad.length === 0 ? `all ${paths.length} routes return 200` : `failing: ${bad.join(", ")}`
  );
}

/**
 * A publication that stops publishing looks abandoned. The news agent writes
 * updatedAt on every successful run, so a stale value means the agent has been
 * failing even if its workflow looked fine.
 */
async function checkContentFreshness() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "src/content/auto-news.json"), "utf8");
    const data = JSON.parse(raw);
    const updated = Date.parse(data.updatedAt);

    if (!Number.isFinite(updated)) {
      record("Content freshness", false, "auto-news.json has no readable updatedAt");
      return;
    }

    const ageHours = (Date.now() - updated) / 3_600_000;
    const ok = ageHours <= MAX_CONTENT_AGE_HOURS;
    record(
      "Content freshness",
      ok,
      `${data.items?.length ?? 0} items, last updated ${ageHours.toFixed(1)}h ago (limit ${MAX_CONTENT_AGE_HOURS}h)`
    );
  } catch (error) {
    record("Content freshness", false, `cannot read auto-news.json — ${String(error?.message || error).slice(0, 80)}`);
  }
}

/**
 * The exact failure that caused the outage. `npm ci` refuses to install when
 * package-lock.json has drifted from package.json, which takes down every
 * workflow at once. Marked fixable: the workflow can repair and verify it.
 */
async function checkLockfile() {
  try {
    await execFileAsync("npm", ["ci", "--ignore-scripts", "--prefer-offline", "--no-audit", "--dry-run"], {
      maxBuffer: 12 * 1024 * 1024
    });
    record("Lockfile integrity", true, "npm ci resolves cleanly");
  } catch (error) {
    const output = `${error?.stdout || ""}${error?.stderr || ""}`;
    const reasons = [...output.matchAll(/npm error (Missing|Invalid):? ?(.+)/g)].map((m) => `${m[1]}: ${m[2]}`.trim());
    record(
      "Lockfile integrity",
      false,
      reasons.length ? reasons.slice(0, 4).join("; ") : "npm ci failed — package-lock.json is out of sync",
      true
    );
  }
}

/** A new advisory can land on an untouched dependency at any time. */
async function checkVulnerabilities() {
  try {
    await execFileAsync("npm", ["audit", "--audit-level=high"], { maxBuffer: 12 * 1024 * 1024 });
    record("Vulnerabilities", true, "no high or critical advisories");
  } catch (error) {
    const output = `${error?.stdout || ""}`;
    const summary = output.match(/(\d+ vulnerabilit\w+.*)/)?.[1] || "high or critical advisories present";
    record("Vulnerabilities", false, summary.trim().slice(0, 120));
  }
}

/**
 * Some verify:* scripts read configuration that only exists where the site is
 * deployed — affiliate partners, for instance, live in the deployment
 * environment and are absent on a CI runner by design. Reporting that absence
 * as a fault is a false alarm, and a watchdog that cries wolf is precisely
 * what teaches you to ignore it.
 */
function isConfiguredHere(envKey) {
  return Boolean((process.env[envKey] || "").trim());
}

/** The verify:* scripts the project already had but never scheduled. */
async function checkVerifyScript(label, script) {
  try {
    const { stdout } = await execFileAsync("npm", ["run", script], { maxBuffer: 12 * 1024 * 1024 });
    const warnings = (String(stdout).match(/▲ \[WARN\]/g) || []).length;
    record(label, true, warnings ? `passed with ${warnings} warning(s)` : "passed");
  } catch (error) {
    const output = `${error?.stdout || ""}${error?.stderr || ""}`;
    const firstError = output.match(/✖ \[ERROR\] (.+)/)?.[1];
    record(label, false, firstError ? firstError.slice(0, 140) : "failed — see workflow logs");
  }
}

function buildReport() {
  const failed = results.filter((r) => !r.ok);
  const lines = [];

  lines.push(failed.length ? "## 🔴 Health check failed" : "## 🟢 All checks passed");
  lines.push("");
  lines.push(`Checked \`${SITE}\` at ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC.`);
  lines.push("");
  lines.push("| Check | Result | Detail |");
  lines.push("| --- | --- | --- |");
  for (const r of results) {
    lines.push(`| ${r.name} | ${r.ok ? "✅" : "❌"} | ${r.detail.replace(/\|/g, "\\|")} |`);
  }

  if (failed.length) {
    lines.push("");
    lines.push("### What to do");
    lines.push("");
    for (const r of failed) {
      lines.push(
        r.fixable
          ? `- **${r.name}** — the watchdog attempts this repair itself and commits only if the full build passes. If this issue is still open, the automatic repair did not work and it needs you.`
          : `- **${r.name}** — ${r.detail}`
      );
    }
  }

  lines.push("");
  lines.push("<sub>Opened by the watchdog. It updates this one issue instead of opening new ones, and closes it automatically once everything passes.</sub>");
  return lines.join("\n");
}

async function run() {
  console.log(`Watchdog — checking ${SITE}`);
  console.log("--------------------------------");

  await checkLiveSite();
  await checkContentFreshness();
  await checkLockfile();
  await checkVulnerabilities();
  await checkVerifyScript("Agent health", "verify:agents");
  await checkVerifyScript("Security config", "verify:security");
  await checkVerifyScript("Public content", "verify:public-content");
  if (isConfiguredHere("AFFILIATE_1_URL")) {
    await checkVerifyScript("Affiliate links", "verify:affiliates");
  } else {
    record("Affiliate links", true, "not configured in this environment — skipped");
  }

  const failed = results.filter((r) => !r.ok);
  const report = buildReport();

  if (process.env.GITHUB_OUTPUT) {
    await fs.appendFile(process.env.GITHUB_OUTPUT, `healthy=${failed.length === 0 ? "true" : "false"}\n`);
    await fs.appendFile(
      process.env.GITHUB_OUTPUT,
      `needs_lockfile_repair=${failed.some((r) => r.fixable) ? "true" : "false"}\n`
    );
  }
  await fs.writeFile(path.join(process.cwd(), "watchdog-report.md"), `${report}\n`, "utf8");

  console.log("--------------------------------");
  console.log(failed.length ? `Watchdog: ${failed.length} check(s) failed.` : "Watchdog: all checks passed.");
  process.exitCode = failed.length ? 1 : 0;
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
