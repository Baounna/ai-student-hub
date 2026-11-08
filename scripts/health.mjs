#!/usr/bin/env node
/**
 * The welcome-back report — the whole truth in two minutes.
 *
 * The watchdog runs daily and files a GitHub issue, which is the right shape
 * for a problem that appears while somebody is watching. It is the wrong shape
 * for coming back after three weeks: by then the answer is spread over twenty
 * issue comments, ninety commits and a run history, and the first question is
 * not "what broke" but "is this thing still alive and did it do its job".
 *
 * So this reads the same things the watchdog does, from the same pure verdict
 * functions, and prints them as a page rather than an alarm. No writes, no
 * sends, nothing filed.
 *
 *   npm run health
 *
 * Exit 0 = nothing needs you. Exit 1 = something does. Same contract as the
 * watchdog, so the same judgements can back both.
 *
 * On a network it cannot reach -- the owner's machine cannot open github.com
 * at all -- every network line degrades to "could not check" and is listed as
 * such at the end. A report that turns an unreachable host into bad news is a
 * report that cries wolf every time he works from a café.
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { editorialAgeVerdict, newsletterCadenceVerdict, quietNewsSources } from "./watchdog.mjs";

const execFileAsync = promisify(execFile);
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://ai-student-hub-navy.vercel.app").replace(/\/+$/, "");
const ROOT = process.cwd();
const NOW = Date.now();
const DAY = 86_400_000;

const needsYou = [];
const unchecked = [];

const say = (line = "") => console.log(line);
const head = (title) => {
  say();
  say(title);
  say("-".repeat(title.length));
};
const flag = (line) => {
  needsYou.push(line);
  return line;
};

const readJson = async (rel) => JSON.parse(await fs.readFile(path.join(ROOT, rel), "utf8"));
const days = (iso) => {
  const parsed = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? `${iso}T12:00:00Z` : iso || "");
  return Number.isFinite(parsed) ? Math.floor((NOW - parsed) / DAY) : null;
};

/** Network, but never fatal: an unreachable host is an unknown, not a failure. */
async function probe(label, url) {
  try {
    const { stdout } = await execFileAsync("curl", ["-sL", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "20", url]);
    return Number.parseInt(String(stdout).trim(), 10);
  } catch {
    unchecked.push(label);
    return null;
  }
}

async function theSite() {
  head("The site");
  const home = await probe("site reachability", `${SITE}/fr`);
  if (home === null) say("  could not reach the network from here — unknown, not down");
  else if (home === 200) say(`  up — ${SITE}/fr answers 200`);
  else say(flag(`  ${SITE}/fr answers ${home}`));
}

async function theBoard() {
  head("The internship board");
  try {
    const data = await readJson("src/content/stages.json");
    const items = data.items || [];
    /*
     * Only the rows that CAN be checked set the clock, which is what
     * getStagesLastCheckedAt does and why /stages prints "last checked 5 days
     * ago" rather than 38: the two links nobody can verify keep an old
     * checkedAt forever, and letting them drag the figure down would report
     * the board as stale every day for the rest of its life.
     */
    const unverifiableRows = items.filter((i) => i.unverifiable);
    const unverifiable = unverifiableRows.length;
    const checked = items.filter((i) => !i.unverifiable).map((i) => i.checkedAt).filter(Boolean).sort();
    const age = checked.length ? days(checked[0]) : null;

    say(`  ${items.length} listings, ${items.length - unverifiable} verified, ${unverifiable} could not be verified`);
    if (age === null) say(flag("  no listing carries a check date"));
    else if (age > 14) say(flag(`  oldest check is ${age} days old — the board calls itself stale past 14`));
    else say(`  oldest check ${age} days old`);
  } catch (error) {
    say(flag(`  cannot read stages.json — ${String(error?.message || error).slice(0, 70)}`));
  }
}

async function theWriting() {
  head("The writing");
  const newestIn = async (file, label) => {
    try {
      const raw = await fs.readFile(path.join(ROOT, file), "utf8");
      const dates = [...raw.matchAll(/publishedAt:\s*"(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]).sort();
      return { label, date: dates.at(-1) || "" };
    } catch {
      return { label, date: "" };
    }
  };

  const newest = [
    await newestIn("src/content/posts.ts", "blog"),
    await newestIn("src/content/posts-cs.ts", "blog (cs)"),
    await newestIn("src/content/news.ts", "briefs")
  ].filter((entry) => entry.date);

  const verdict = editorialAgeVerdict(newest, NOW, 60, 120);
  say(`  ${verdict.detail}`);
  if (!verdict.ok) flag("  the site says \"latest\" over content that is not");
}

async function theFeeds() {
  head("The news sources");
  try {
    const data = await readJson("src/content/auto-news.json");
    const fileAge = ((NOW - Date.parse(data.updatedAt)) / 3_600_000).toFixed(0);
    const { total, quiet, silent } = quietNewsSources(data.items || [], NOW, 10, 21);
    say(`  ${(data.items || []).length} items from ${total} sources, file written ${fileAge}h ago`);
    if (!quiet.length) say("  every source produced within 10 days");
    else {
      say(`  quiet: ${quiet.map((q) => `${q.source} (${q.days}d)`).join(", ")}`);
      if (silent.length) flag(`  ${silent.length} source(s) silent for 21+ days — likely a changed page, not a quiet blog`);
    }
  } catch (error) {
    say(flag(`  cannot read auto-news.json — ${String(error?.message || error).slice(0, 70)}`));
  }
}

async function theNewsletter() {
  head("The newsletter");
  let sentAt = null;
  try {
    sentAt = (await readJson("drafts/.last-issue.json")).sentAt ?? null;
  } catch {
    // No ledger is the same fact as never sent; reported as such below.
  }
  let waiting = "";
  try {
    const pending = (await fs.readdir(path.join(ROOT, "drafts"))).filter((f) => f.endsWith(".pending.json")).sort();
    if (pending.length) waiting = `drafts/issue-${pending.at(-1).slice(6, 16)}.html`;
    if (pending.length > 1) waiting += ` (${pending.length} pending — name the one you send)`;
  } catch {
    // No drafts directory.
  }
  const verdict = newsletterCadenceVerdict(sentAt, waiting, NOW, 14);
  say(`  ${verdict.detail}`);
  if (verdict.advisory) flag("  the signup promises an email that is not going out");
}

async function theJobs() {
  head("The scheduled jobs");
  try {
    const { stdout } = await execFileAsync(
      "gh",
      ["run", "list", "--limit", "40", "--json", "name,conclusion,createdAt,event"],
      { maxBuffer: 4_000_000 }
    );
    /*
     * Cadence comes from the scheduled runs; the verdict comes from the most
     * recent run of any kind.
     *
     * Filtering to `schedule` alone meant a manual run could not clear a
     * reported failure. On 8 November the Internship Finder was dispatched by
     * hand to confirm a fix, succeeded, and committed two listings -- and this
     * report went on naming its 5 November scheduled failure, because the run
     * that proved it fixed was the wrong event type to be seen.
     */
    const all = JSON.parse(stdout);
    const runs = all.filter((r) => r.event === "schedule");
    if (!runs.length) {
      say("  no scheduled runs in the last 40 — nothing has fired");
      flag("  scheduled jobs are not firing");
      return;
    }
    const byName = new Map();
    for (const run of runs) if (!byName.has(run.name)) byName.set(run.name, run);
    const latestAny = new Map();
    for (const run of all) if (!latestAny.has(run.name)) latestAny.set(run.name, run);

    for (const [name, run] of byName) {
      const age = Math.floor((NOW - Date.parse(run.createdAt)) / DAY);
      const newest = latestAny.get(name) || run;
      const bad = newest.conclusion && newest.conclusion !== "success";
      const manual = newest !== run && newest.conclusion === "success";
      const line = manual
        ? `  ${name} — scheduled ${age}d ago (${run.conclusion}), since confirmed by a manual run`
        : `  ${name} — last ${age}d ago, ${newest.conclusion || "running"}`;
      say(bad ? flag(line) : line);
    }
  } catch {
    unchecked.push("scheduled job history (gh unreachable)");
    say("  could not ask GitHub — unknown, not broken");
  }
}

async function theDependencies() {
  head("Dependencies");
  try {
    const { stdout } = await execFileAsync("npm", ["audit", "--json", "--omit", "dev"], { maxBuffer: 8_000_000 }).catch(
      (error) => ({ stdout: error.stdout || "{}" })
    );
    const shipped = JSON.parse(stdout)?.metadata?.vulnerabilities || {};
    const total = Object.entries(shipped)
      .filter(([k]) => k !== "info" && k !== "total")
      .reduce((sum, [, v]) => sum + v, 0);
    if (total === 0) say("  shipped site: 0 vulnerabilities");
    else say(flag(`  shipped site: ${total} vulnerabilities`));
    say("  dev-only advisories are not counted here — they do not reach a reader");
  } catch {
    unchecked.push("npm audit");
    say("  could not run npm audit — unknown");
  }
}

async function whileYouWereAway() {
  head("What happened while you were away");
  try {
    const { stdout } = await execFileAsync("git", ["log", "-40", "--pretty=%cI\u0001%s"]);
    const commits = stdout.trim().split("\n").filter(Boolean).map((line) => {
      const [date, subject] = line.split("\u0001");
      return { days: Math.floor((NOW - Date.parse(date)) / DAY), subject };
    });

    /*
     * Grouped by subject, not by author: every commit here carries the same
     * name, the owner's, because the workflows commit as him. The subject is
     * the only honest signal, so this says "looks automated" rather than
     * claiming to know who typed it.
     */
    const automated = /^chore\((content|stages|deps|agent)\)|auto-update/;
    const jobs = commits.filter((c) => automated.test(c.subject));
    const hands = commits.filter((c) => !automated.test(c.subject));

    say(`  ${jobs.length} of the last ${commits.length} commits look automated (by subject; the author is the same for both)`);
    if (hands.length) {
      say("  the rest:");
      for (const c of hands.slice(0, 6)) say(`    ${String(c.days).padStart(3)}d  ${c.subject.slice(0, 72)}`);
      if (hands.length > 6) say(`    …and ${hands.length - 6} more`);
    }
  } catch {
    unchecked.push("git history");
    say("  could not read git history");
  }
}

async function main() {
  say(`Health — ${new Date(NOW).toISOString().slice(0, 16).replace("T", " ")} UTC`);
  await theSite();
  await theBoard();
  await theWriting();
  await theFeeds();
  await theNewsletter();
  await theJobs();
  await theDependencies();
  await whileYouWereAway();

  head("In one line");
  if (unchecked.length) say(`  could not check: ${unchecked.join(", ")}`);
  if (!needsYou.length) {
    say("  nothing needs you.");
    process.exit(0);
  }
  say(`  ${needsYou.length} thing(s) need you:`);
  for (const line of needsYou) say(`   ·${line.replace(/^\s+/, " ")}`);
  process.exit(1);
}

main().catch((error) => {
  console.error(`health: ${String(error?.stack || error).slice(0, 400)}`);
  process.exit(1);
});
