#!/usr/bin/env node
/**
 * Re-check every listed internship.
 *
 * The page tells readers the list is "checked and updated weekly". Until now
 * nothing actually did the checking, so that sentence was a promise resting on
 * someone remembering. This is the thing that keeps it true.
 *
 *   npm run check:stages          report only
 *   npm run check:stages -- --write   also re-stamp checkedAt on what passed
 *
 * It never deletes. Whether a posting is really gone is a judgement call, and a
 * script that quietly drops entries would hide exactly the rot this is meant to
 * surface. It tells you what to look at; you decide.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const fileArg = process.argv.indexOf("--file");
// --file points the check at a fixture. The regression fixture below is the
// point: a checker nobody has seen fail is not evidence of anything.
const FILE = fileArg !== -1 && process.argv[fileArg + 1]
  ? path.resolve(process.argv[fileArg + 1])
  : path.join(process.cwd(), "src/content/stages.json");
const WRITE = process.argv.includes("--write");
/** Boards whose validThrough is a listing expiry of their own, not the employer's. */
const LISTING_TTL_HOSTS = new Set(["hellowork.com"]);

/** Statuses that mean "we were refused", never "the posting is gone". */
const BLOCKED_STATUSES = new Set([401, 403, 405, 429, 503, 999]);

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/**
 * Phrases a posting shows once it is over. A page that says this still returns
 * HTTP 200, which is why a status check on its own is not enough: the single
 * worst listing we rejected by hand was a live 200 whose body read
 * "Cette offre d'emploi n'est plus d'actualite".
 */
const GONE = [
  "n'est plus d'actualit",
  "no longer accepting applications",
  "no longer available",
  "cette offre est pourvue",
  "offre expir",
  "position has been filled",
  "this job is no longer"
];

/**
 * Real pages write "n\u2019est plus d\u2019actualite" with a typographic
 * apostrophe, not the ASCII one. Matching ASCII alone let the most notorious
 * dead listing we know of pass this check as perfectly healthy.
 */
export function gonePhrase(text) {
  const normalized = String(text).toLowerCase().replace(/[\u2018\u2019\u02bc\u00b4`]/g, "'");
  return GONE.find((phrase) => normalized.includes(phrase)) || "";
}

/**
 * A pulled posting frequently redirects to the board's front page and still
 * answers 200 — Greenhouse sends you to /<company>?error=true. The status code
 * says nothing; landing somewhere that no longer names this job says everything.
 */
export function redirectedAway(href, finalUrl) {
  if (!finalUrl) return false;
  if (/[?&]error=true\b/.test(finalUrl)) return true;
  // Landing on a different id is normal: plenty of boards canonicalise to an
  // internal one (ENGIE rewrites .../1367860955/ to .../70237-fr_FR/ and the
  // job is perfectly alive). What actually signals a pulled posting is landing
  // somewhere *shallower* — the board's own index instead of a job page.
  const depth = (url) => {
    try { return new URL(url).pathname.replace(/\/+$/, "").split("/").filter(Boolean).length; }
    catch { return -1; }
  };
  const from = depth(href);
  const to = depth(finalUrl);
  return from > 0 && to >= 0 && to < from;
}

async function fetchText(url) {
  try {
    const { stdout } = await execFileAsync("curl", [
      "-s", "-L", "--max-time", "25", "-A", UA,
      "-w", "\n__CODE__%{http_code}__URL__%{url_effective}", url
    ], { maxBuffer: 12 * 1024 * 1024 });
    const marker = stdout.lastIndexOf("__CODE__");
    const tail = stdout.slice(marker + 8);
    const split = tail.indexOf("__URL__");
    const status = Number.parseInt(tail.slice(0, split === -1 ? undefined : split).trim(), 10) || 0;
    const finalUrl = split === -1 ? url : tail.slice(split + 7).trim();
    const body = stdout.slice(0, marker);
    const text = body
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");
    return { status, text, raw: body, finalUrl };
  } catch {
    return { status: 0, text: "", raw: "", finalUrl: url };
  }
}

/**
 * A Workday posting URL answers 200 with an empty shell whether the requisition
 * is live or long gone — the page is built in the browser. The JSON endpoint
 * behind it is the only thing that actually knows, so ask that instead.
 */
function workdayApi(href) {
  const match = href.match(/^https:\/\/([a-z0-9-]+)\.(wd\d)\.myworkdayjobs\.com\/[^/]+\/([^/]+)\/job\/(.+)$/i);
  if (!match) return "";
  const [, tenant, wd, site, jobPath] = match;
  return `https://${tenant}.${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/job/${jobPath}`;
}

async function checkOne(stage) {
  const api = workdayApi(stage.href);
  if (api) {
    const { status, raw } = await fetchText(api);
    // A block is not a death. Airbus's tenant started answering 403 the day
    // after we read it, while Thales's identical endpoint kept returning 200 —
    // bot protection, not four vanished internships. Treating every non-200 as
    // gone would have deleted live postings on the strength of a rate limit.
    if (BLOCKED_STATUSES.has(status)) {
      return { verdict: "CHECK", detail: `Workday API HTTP ${status} (blocked, not proof either way)` };
    }
    if (status !== 200) return { verdict: "GONE", detail: `Workday API HTTP ${status}` };
    try {
      const info = JSON.parse(raw).jobPostingInfo || {};
      if (info.canApply === false) return { verdict: "GONE", detail: "Workday says canApply=false" };
      return { verdict: "OK", detail: `Workday canApply=true, posted ${info.startDate || "?"}` };
    } catch {
      return { verdict: "CHECK", detail: "Workday API returned unparseable JSON" };
    }
  }

  const { status, text, finalUrl } = await fetchText(stage.href);
  if (status === 0) return { verdict: "CHECK", detail: "no response" };
  if (status >= 400 && !BLOCKED_STATUSES.has(status)) {
    return { verdict: "GONE", detail: `HTTP ${status}` };
  }

  const hit = gonePhrase(text);
  if (hit) return { verdict: "GONE", detail: `page says "${hit}"` };

  // schema.org validThrough already in the past: still 200, still gone.
  // A pulled posting frequently redirects to the board root and still answers
  // 200 — Greenhouse sends you to /<company>?error=true. The status says
  // nothing; landing somewhere that no longer names this job says everything.
  if (redirectedAway(stage.href, finalUrl)) {
    return { verdict: "GONE", detail: `redirected off the posting to ${String(finalUrl).slice(0, 80)}` };
  }

  // On most sites a past validThrough means the posting is over — that is what
  // exposed six long-dead cyber internships still serving HTTP 200. On some
  // aggregators it means nothing of the kind: HelloWork stamps every listing
  // datePosted + 30 days regardless of the employer's own timetable, so
  // trusting it there would retire live jobs a month after we found them.
  const host = (() => { try { return new URL(stage.href).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  const valid = text.match(/validThrough["':\s]+(\d{4}-\d{2}-\d{2})/i);
  if (valid && !LISTING_TTL_HOSTS.has(host) && Date.parse(`${valid[1]}T23:59:59Z`) < Date.now()) {
    return { verdict: "GONE", detail: `validThrough ${valid[1]} has passed` };
  }

  if (BLOCKED_STATUSES.has(status)) {
    return { verdict: "CHECK", detail: `HTTP ${status} (blocked, not proof either way)` };
  }
  return { verdict: "OK", detail: `HTTP ${status}` };
}

// Only sweep when run as a command. Importing this file (the tests do, for the
// two helpers above) must not fire eighteen network requests.
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {

const file = JSON.parse(await fs.readFile(FILE, "utf8"));
const today = new Date().toISOString().slice(0, 10);
const results = { OK: [], CHECK: [], GONE: [] };

console.log(`\n  Re-checking ${file.items.length} entries.\n`);

for (const stage of file.items) {
  const { verdict, detail } = await checkOne(stage);
  results[verdict].push({ stage, detail });
  const mark = verdict === "OK" ? "ok   " : verdict === "GONE" ? "GONE " : "check";
  console.log(`  ${mark} ${stage.company} — ${stage.role.slice(0, 44)}`);
  if (verdict !== "OK") console.log(`        ${detail}`);
  if (verdict === "OK" && WRITE) stage.checkedAt = today;
}

const expired = file.items.filter(
  (item) => item.deadline && Date.parse(`${item.deadline}T23:59:59Z`) < Date.now()
);

console.log(`
  ${results.OK.length} still open · ${results.CHECK.length} need a human · ${results.GONE.length} look gone`);
if (expired.length) console.log(`  ${expired.length} past their stated deadline`);

if (results.GONE.length) {
  console.log("\n  Probably gone — open each, then remove it from stages.json by hand:");
  for (const { stage, detail } of results.GONE) console.log(`    ${stage.id}\n      ${detail}\n      ${stage.href}`);
}

if (WRITE) {
  file.updatedAt = new Date().toISOString();
  await fs.writeFile(FILE, `${JSON.stringify(file, null, 2)}\n`);
  console.log(`\n  Re-stamped checkedAt on ${results.OK.length} entries and updatedAt on the file.`);
} else {
  console.log("\n  Report only. Re-run with --write to re-stamp what passed.");
}
console.log("");

process.exit(results.GONE.length ? 1 : 0);

}
