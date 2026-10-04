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

/** Fetch a JSON body from the live site, or null if it cannot be read. */
async function curlJson(url) {
  try {
    const { stdout } = await execFileAsync("curl", [
      "-sL", "--max-time", String(TIMEOUT_SECONDS), url
    ], { maxBuffer: 4 * 1024 * 1024 });
    return JSON.parse(String(stdout));
  } catch {
    return null;
  }
}

/**
 * A publication that stops publishing looks abandoned.
 *
 * Read the age from the DEPLOYED site, not from the working copy. Reading the
 * local file answers a different question: a clone six commits behind reported
 * three-day-old content while the site had updated that morning, and the same
 * blind spot hides the failure that actually costs readers — the agent commits
 * fine, the deploy never ships it, and a local check still looks green.
 *
 * Falls back to the local file when the site cannot be reached, and says which
 * source it used so a stale answer is never mistaken for a fresh one.
 */
async function checkContentFreshness() {
  const health = await curlJson(`${SITE}/health`);
  const liveUpdated = Date.parse(health?.content?.newsUpdatedAt ?? "");

  if (Number.isFinite(liveUpdated)) {
    const ageHours = (Date.now() - liveUpdated) / 3_600_000;
    record(
      "Content freshness",
      ageHours <= MAX_CONTENT_AGE_HOURS,
      `live site: ${health.content.newsItems ?? 0} items, updated ${ageHours.toFixed(1)}h ago (limit ${MAX_CONTENT_AGE_HOURS}h)`
    );
    return;
  }

  try {
    const raw = await fs.readFile(path.join(process.cwd(), "src/content/auto-news.json"), "utf8");
    const data = JSON.parse(raw);
    const updated = Date.parse(data.updatedAt);

    if (!Number.isFinite(updated)) {
      record("Content freshness", false, "auto-news.json has no readable updatedAt");
      return;
    }

    const ageHours = (Date.now() - updated) / 3_600_000;
    record(
      "Content freshness",
      ageHours <= MAX_CONTENT_AGE_HOURS,
      `local checkout (live /health unreadable): ${data.items?.length ?? 0} items, updated ${ageHours.toFixed(1)}h ago (limit ${MAX_CONTENT_AGE_HOURS}h)`
    );
  } catch (error) {
    record("Content freshness", false, `cannot read live /health or auto-news.json — ${String(error?.message || error).slice(0, 80)}`);
  }
}


/**
 * The stages list is the one thing here that rots by standing still: a page of
 * deadlines looks maintained while every date on it passes. The page admits its
 * own age to readers; this tells the publisher before it gets that far.
 *
 * It used to be deliberately more patient than the page: readers saw a notice
 * at 14 days, this raised an issue at 21. That meant a week in which the public
 * banner was up and nothing told the person who could take it down. A watchdog
 * that fires at the same moment as the banner is not a warning either, so this
 * now reads the page's own threshold and warns a few days ahead of it.
 */
const STAGES_WARN_LEAD_DAYS = Number.parseInt(process.env.WATCHDOG_STAGES_LEAD_DAYS || "3", 10);

/** Read from the source of truth so the two numbers cannot drift apart again. */
async function pageStaleThreshold() {
  const source = await fs.readFile(path.join(process.cwd(), "src/content/stages.ts"), "utf8");
  const match = source.match(/STALE_AFTER_DAYS\s*=\s*(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

async function checkStagesFreshness() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "src/content/stages.json"), "utf8");
    const data = JSON.parse(raw);
    const items = Array.isArray(data.items) ? data.items : [];

    if (items.length === 0) {
      record("Stages list", true, "no entries yet — nothing to go stale");
      return;
    }

    const pageThreshold = await pageStaleThreshold();
    if (pageThreshold === null) {
      record("Stages list", false, "cannot read STALE_AFTER_DAYS from stages.ts — thresholds may have drifted");
      return;
    }
    const limit = Math.max(1, pageThreshold - STAGES_WARN_LEAD_DAYS);

    // The page headlines the oldest per-entry check, because writing the file
    // is not the same as checking the links. Measure what the reader is shown.
    const checked = items.map((i) => i.checkedAt).filter(Boolean).sort();
    const oldest = checked.length ? Date.parse(`${checked[0]}T12:00:00Z`) : Date.parse(data.updatedAt);
    if (!Number.isFinite(oldest)) {
      record("Stages list", false, "stages.json has no readable checkedAt or updatedAt");
      return;
    }

    const ageDays = Math.floor((Date.now() - oldest) / 86_400_000);
    const now = Date.now();
    // A listing with no published closing date is open until someone says
    // otherwise. Parsing an absent deadline gives NaN and NaN >= now is false,
    // so this counted all ninety-two rolling entries as closed and could report
    // "all entries have closed" about a perfectly healthy list.
    const open = items.filter(
      (i) => !i.deadline || Date.parse(`${i.deadline}T23:59:59Z`) >= now
    ).length;

    if (ageDays > limit) {
      record("Stages list", false,
        `links unchecked for ${ageDays} days (warn at ${limit}, page says stale at ${pageThreshold}) — ${open} of ${items.length} still open`);
      return;
    }
    if (open === 0) {
      record("Stages list", false, `all ${items.length} entries have closed — the page has nothing to offer`);
      return;
    }
    record("Stages list", true, `${open} open of ${items.length}, links checked ${ageDays}d ago`);
  } catch (error) {
    record("Stages list", false, `cannot read stages.json — ${String(error?.message || error).slice(0, 70)}`);
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
/**
 * Two questions, as in .github/workflows/security-npm-audit.yml.
 *
 * Shipped dependencies decide the verdict, because they are the ones a reader
 * downloads. Build tooling is counted and named in the detail, but does not
 * fail the check: today that is seven advisories, all braces, reached through
 * Next's own ESLint config, and braces@3.0.3 is both the newest release and the
 * version the advisory names -- there is nothing to upgrade to. Failing on it
 * would put this line permanently in the red and send a nightly issue nobody
 * can act on, which is how an alert channel stops being read.
 */
async function checkVulnerabilities() {
  let toolingNote = "";
  try {
    await execFileAsync("npm", ["audit", "--audit-level=high"], { maxBuffer: 12 * 1024 * 1024 });
  } catch (error) {
    const output = `${error?.stdout || ""}`;
    const count = output.match(/(\d+) (?:high|critical) severity/)?.[1];
    toolingNote = count ? `; ${count} in build tooling, not shipped` : "; build tooling has advisories";
  }

  try {
    await execFileAsync("npm", ["audit", "--omit=dev", "--audit-level=high"], { maxBuffer: 12 * 1024 * 1024 });
    record("Vulnerabilities", true, `nothing shipped to readers is flagged${toolingNote}`);
  } catch (error) {
    const output = `${error?.stdout || ""}`;
    const summary = output.match(/(\d+ vulnerabilit\w+.*)/)?.[1] || "high or critical advisories in shipped code";
    record("Vulnerabilities", false, `SHIPPED CODE: ${summary.trim()}`.slice(0, 160));
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

/**
 * Whether each scheduled workflow is still firing at all.
 *
 * The check above cannot answer this, and the difference is the whole reason
 * this file exists. It builds its list of workflows out of the runs it just
 * fetched, so a workflow that has stopped running is absent from that list, is
 * never compared against anything, and the report says "latest run of all N
 * workflows on main passed" -- where N silently excludes it. Silence reads as
 * health.
 *
 * The window makes it worse. Sixty runs on main is about thirty-one hours when
 * four workflows fire on every push and the day has eight commits in it, so the
 * four weekly agents sit outside it six days out of seven. On Mondays the
 * watchdog runs before them, so Monday's watchdog cannot see Monday's agents
 * and Tuesday's may already have lost them.
 *
 * That is precisely the failure this project has already had: the writer agent
 * failed eleven consecutive Mondays and nothing said so. Asking each scheduled
 * workflow about its own last run, by name, is the only version of this check
 * that can notice an absence.
 */
/**
 * Which scheduled workflows have gone quiet.
 *
 * Kept as a pure function, separately from the fetching, because the value of
 * this check is entirely in its judgement and that judgement is otherwise
 * impossible to test: you cannot make a workflow stop firing to see whether the
 * alarm works, and an alarm nobody has heard ring is the thing this project
 * already got wrong once.
 *
 * `lastRuns` maps a workflow filename to the ISO date of its most recent run,
 * null when it has never run, or undefined when GitHub could not be asked --
 * which is not the same thing and must not be reported as an absence.
 */
export function scheduledWorkflowProblems(expected, lastRuns, now = Date.now()) {
  const problems = [];
  let checked = 0;
  let unknown = 0;

  for (const { file, hours } of expected) {
    const last = lastRuns.get(file);

    if (last === undefined) {
      unknown += 1;
      continue;
    }

    checked += 1;

    if (last === null) {
      problems.push(`${file} (never run)`);
      continue;
    }

    // A full extra day on top of the cadence. GitHub's scheduler runs late --
    // five to eight hours is normal on this repository -- so a tighter
    // allowance would cry wolf, and an alarm nobody believes is exactly the
    // failure being guarded against.
    const ageHours = (now - Date.parse(last)) / 3_600_000;
    if (!Number.isFinite(ageHours)) {
      problems.push(`${file} (unreadable run date)`);
      continue;
    }
    if (ageHours > hours + 24) {
      problems.push(`${file} (${Math.round(ageHours)}h since last run, expected every ~${hours}h)`);
    }
  }

  return { problems, checked, unknown };
}

/**
 * Whether each scheduled workflow is still firing at all.
 *
 * checkWorkflowHealth cannot answer this, and the difference is the whole
 * reason this exists. It builds its list of workflows out of the runs it just
 * fetched, so a workflow that has stopped running is absent from that list,
 * is never compared against anything, and the report says "latest run of all N
 * workflows on main passed" -- where N silently excludes it. Silence reads as
 * health.
 *
 * The window makes it worse. Sixty runs on main is about thirty-one hours when
 * four workflows fire on every push and the day has eight commits in it, so the
 * weekly agents sit outside it six days out of seven, and on Mondays this runs
 * before them. The writer agent failed eleven consecutive Mondays and nothing
 * said so. Asking each scheduled workflow about its own last run, by name, is
 * the only version of this check that can notice an absence.
 */
async function checkScheduledWorkflowsStillFiring() {
  let expected;
  try {
    expected = (await scheduledWorkflows()).filter((w) => !PARKED_WORKFLOWS.has(w.file));
  } catch {
    record("Scheduled workflows", true, "could not read .github/workflows — skipped");
    return;
  }

  if (!expected.length) {
    record("Scheduled workflows", true, "no workflow declares a schedule");
    return;
  }

  const lastRuns = new Map();
  for (const { file } of expected) {
    try {
      const { stdout } = await execFileAsync(
        "gh",
        ["run", "list", "--workflow", file, "--limit", "1", "--json", "createdAt"],
        { maxBuffer: 2 * 1024 * 1024 }
      );
      const runs = JSON.parse(stdout);
      lastRuns.set(file, Array.isArray(runs) && runs.length ? runs[0].createdAt : null);
    } catch {
      // Left undefined on purpose: "GitHub would not answer" is not "this
      // workflow has stopped", and reporting the first as the second is how a
      // check starts lying.
    }
  }

  const verdict = scheduledWorkflowVerdict(expected, lastRuns);
  record("Scheduled workflows", verdict.ok, verdict.detail);
}

/**
 * Turn the three states into one pass-or-fail line.
 *
 * Nothing verified is not the same as nothing wrong. With GitHub unreachable
 * for every workflow, lastRuns is empty, every entry counts as unknown,
 * problems is empty, and this reported "all 0 scheduled workflows fired within
 * their cadence (9 could not be checked)" as a PASS. A check whose total
 * failure reads as health is worse than no check, because it occupies the slot
 * where someone would otherwise have looked.
 *
 * The undefined-versus-null distinction inside scheduledWorkflowProblems is
 * right and stays: one workflow GitHub would not answer for is still not a
 * stopped workflow. It is the aggregate that has to say so out loud.
 *
 * Exported because the bug that made this necessary was never in the pure
 * function -- it was in how its result was reported, and in the fact that the
 * whole thing sat inside a try block that swallowed it. Logic nobody can hold
 * in a test is where that hides.
 */
export function scheduledWorkflowVerdict(expected, lastRuns, now = Date.now()) {
  const { problems, checked, unknown } = scheduledWorkflowProblems(expected, lastRuns, now);
  const caveat = unknown ? ` (${unknown} could not be checked)` : "";

  if (checked === 0 && unknown > 0) {
    return {
      ok: false,
      detail: `could not verify any of the ${unknown} scheduled workflows — GitHub did not answer`
    };
  }

  if (problems.length) {
    return { ok: false, detail: `not firing: ${problems.join(", ")}${caveat}` };
  }

  return { ok: true, detail: `all ${checked} scheduled workflows fired within their cadence${caveat}` };
}


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

/**
 * The blind spot this check exists to cover: the watchdog verified the site and
 * the repository but never the automation itself, so a workflow that failed
 * every Monday for over a month went unnoticed — the exact class of silent
 * failure the watchdog was built to catch.
 *
 * Reports the latest run of each workflow, so a job that is quietly broken on a
 * schedule surfaces even when the site looks perfectly healthy.
 *
 * Knowingly-parked workflows are excluded: alarming about a failure you already
 * decided to accept is how an alert channel becomes noise again.
 */
const PARKED_WORKFLOWS = new Set([
  // Nothing parked. CodeQL was here while the repository was private, where
  // code scanning needs Advanced Security; it runs for real now that the
  // repository is public. Add a workflow here only when you have decided to
  // accept its failure, so the alert channel keeps meaning something.
]);

/**
 * The workflows that are supposed to run on a timer, and how often.
 *
 * Read from the workflow files rather than from a list kept here, so a new
 * scheduled agent is covered the day it is added and a decommissioned one stops
 * being expected the day its schedule block is removed. A workflow with only
 * workflow_dispatch is deliberately manual and is not judged on staleness.
 */
/** Every workflow file, whatever triggers it. */
async function allWorkflowFiles() {
  const dir = path.join(process.cwd(), ".github/workflows");
  return (await fs.readdir(dir)).filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"));
}

async function scheduledWorkflows() {
  const dir = path.join(process.cwd(), ".github/workflows");
  const files = (await fs.readdir(dir)).filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"));
  const out = [];

  for (const file of files) {
    const text = await fs.readFile(path.join(dir, file), "utf8");
    const crons = [...text.matchAll(/^\s*-?\s*cron:\s*["']([^"']+)["']/gm)].map((m) => m[1]);
    if (!crons.length) continue;
    out.push({ file, hours: Math.min(...crons.map(cadenceHours)) });
  }

  return out;
}

/**
 * How many hours a cron expression leaves between firings, near enough.
 *
 * Only two answers matter here -- "about daily" and "about weekly" -- so this
 * reads the day-of-week field and, failing that, counts the hours listed. It
 * does not need to be a cron engine; it needs to know whether twelve hours of
 * silence is normal or alarming.
 */
function cadenceHours(cron) {
  const [, hour = "*", , , dow = "*"] = cron.trim().split(/\s+/);
  if (dow !== "*") return 24 * 7;
  const slots = hour === "*" ? 24 : hour.split(",").length;
  return Math.max(1, Math.round(24 / slots));
}

async function checkWorkflowHealth() {
  try {
    // Default branch only. Without --branch this counted runs from every branch,
    // so a failing Dependabot PR reported the live site as unhealthy — and since
    // Dependabot now opens a separate PR per major upgrade, the ones that
    // genuinely break (TypeScript 7 against typescript-eslint, Tailwind 4
    // against a v3 config) fail on purpose and would raise a nightly alarm
    // forever. A PR failing is the review system working; it is not an outage.
    /*
     * One query per workflow, not one shared window.
     *
     * This asked for the last 60 runs on main and took the newest entry per
     * workflow. Four jobs fire on every push -- CI, CodeQL, secret scan, npm
     * audit -- so sixty runs reaches back about two days on an active week.
     * The four weekly workflows (the writer, operator and design agents, and
     * the internship check) are usually not in that window at all, which makes
     * this check blind to exactly the jobs most likely to break unnoticed, and
     * able to report a stale failure on the rare day one lands inside it.
     * Measured: a sixty-run window on 4 October covered 2 to 4 October, while
     * the writer agent last ran on 28 September.
     *
     * Asking each workflow for its own latest run costs a dozen calls on a
     * daily job and is correct whatever the push rate.
     */
    const latest = new Map();
    for (const file of await allWorkflowFiles()) {
      try {
        const { stdout } = await execFileAsync(
          "gh",
          [
            "run", "list",
            "--workflow", file,
            "--branch", process.env.WATCHDOG_BRANCH || "main",
            "--limit", "1",
            "--json", "workflowName,conclusion,status,createdAt"
          ],
          { maxBuffer: 2 * 1024 * 1024 }
        );
        const runs = JSON.parse(stdout);
        const run = Array.isArray(runs) ? runs[0] : null;
        if (!run || run.status !== "completed") continue;
        if (PARKED_WORKFLOWS.has(run.workflowName)) continue;
        latest.set(run.workflowName, run);
      } catch {
        // One workflow GitHub would not answer for is not a failing workflow.
      }
    }

    if (latest.size === 0) {
      record("Workflow health", true, "no completed runs to judge");
      return;
    }

    const failing = [...latest.values()]
      .filter((r) => r.conclusion === "failure")
      .map((r) => r.workflowName);

    record(
      "Workflow health",
      failing.length === 0,
      failing.length === 0
        ? `latest run of all ${latest.size} workflows on main passed`
        : `last run on main failed: ${failing.join(", ")}`
    );

  } catch {
    // No gh, or no token — not a fault in the project itself.
    record("Workflow health", true, "gh CLI unavailable here — skipped");
  }
}

/**
 * Escape a value for a Markdown table cell. Backslashes go first: escaping the
 * pipes alone leaves a trailing backslash able to escape the delimiter we just
 * added, which breaks the row.
 */
function escapeTableCell(value) {
  // A newline ends the row, not the cell: one detail containing one would turn
  // the rest of the report into text outside the table. Details are built here
  // today, so this is the case that has not happened yet rather than one that
  // has -- but a cell escaper that lets through the character that breaks rows
  // is not doing the job it is named for.
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r\n|[\r\n]/g, " ");
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
    lines.push(`| ${r.name} | ${r.ok ? "✅" : "❌"} | ${escapeTableCell(r.detail)} |`);
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
  await checkStagesFreshness();
  await checkLockfile();
  await checkVulnerabilities();
  await checkWorkflowHealth();
  // Its own step, not a line inside checkWorkflowHealth's try block.
  //
  // It used to run after a `gh run list` in that try. That call throws whenever
  // gh has no token -- which is every run, because the workflow step never set
  // one -- so execution jumped to the catch and recorded "gh CLI unavailable
  // here - skipped" as a PASS. The check built specifically to notice a cron
  // that has gone quiet has therefore never executed once, and said so in
  // green: verified against the live run of 2026-10-01, whose output has no
  // "Scheduled workflows" line at all.
  await checkScheduledWorkflowsStillFiring();
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
