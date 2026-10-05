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
import { visibleText } from "./lib/visible-text.mjs";

const execFileAsync = promisify(execFile);
const fileArg = process.argv.indexOf("--file");
// --file points the check at a fixture. The regression fixture below is the
// point: a checker nobody has seen fail is not evidence of anything.
const FILE = fileArg !== -1 && process.argv[fileArg + 1]
  ? path.resolve(process.argv[fileArg + 1])
  : path.join(process.cwd(), "src/content/stages.json");
const WRITE = process.argv.includes("--write");
/** Boards whose validThrough is a listing expiry of their own, not the employer's. */
/**
 * Hosts whose validThrough is their own listing lifetime, not the employer's
 * deadline, so a lapsed one means the advert rotated and not that the job is
 * gone.
 *
 * linkedin.com sets it to exactly datePosted + 30 days -- verified on six
 * listings on this board. Without it here, the first of those to reach day
 * thirty would have been reported GONE while still perfectly open.
 */
const LISTING_TTL_HOSTS = new Set(["hellowork.com", "linkedin.com"]);

/**
 * The registrable part of a listing's host, for matching against the sets above.
 *
 * Stripping only a leading "www." meant m.hellowork.com and www2.hellowork.com
 * missed the TTL exemption and got retired a month early -- the exact failure
 * the exemption exists to prevent, reintroduced by the normalisation.
 */
export function listingHost(href) {
  try {
    const hostname = new URL(String(href)).hostname.toLowerCase().replace(/\.$/, "");
    const labels = hostname.split(".");
    return labels.length > 2 ? labels.slice(-2).join(".") : hostname;
  } catch {
    return "";
  }
}

/** Statuses that mean "we were refused", never "the posting is gone". */
const BLOCKED_STATUSES = new Set([401, 403, 405, 429, 503, 999]);

/**
 * Sixteen requests to LinkedIn and eleven to Capgemini, fired back to back, is
 * how you get told to go away. Airbus started returning 403 to the Workday API
 * the day after a full run, having answered 200 throughout the run itself. So
 * we wait between hits on the same host — the whole sweep is a background job
 * nobody is watching, and being a good citizen costs it nothing but seconds.
 */
const PER_HOST_DELAY_MS = 1_500;
const lastHitAt = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHost(url) {
  let host = "";
  try { host = new URL(url).hostname; } catch { return; }
  const previous = lastHitAt.get(host) || 0;
  const wait = previous + PER_HOST_DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastHitAt.set(host, Date.now());
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/**
 * Phrases a posting shows once it is over. A page that says this still returns
 * HTTP 200, which is why a status check on its own is not enough: the single
 * worst listing we rejected by hand was a live 200 whose body read
 * "Cette offre d'emploi n'est plus d'actualite".
 */
const GONE = [
  "n'est plus d'actualit",
  // hellowork writes the plain French of "no longer available". The English
  // form was on this list from the start; its literal translation was not, so
  // five dead postings sailed through every weekly run answering a clean 200.
  "n'est plus disponible",
  "n'est plus en ligne",
  // SmartRecruiters' wording, found on a Wavestone listing that answered 200
  // with no deadline and so rendered as open: "Ce poste a expire / Desole,
  // cette offre a expire". The list already had "offre expir", which catches
  // "offre expiree" but not the verb form with the auxiliary between.
  "poste a expir",
  "offre a expir",
  // ENGIE answers 200 with the whole page intact and this one sentence where
  // the posting used to be. Nothing else on the page says it is closed, and no
  // phrase on this list matched, so it was reported open for weeks.
  "not available at this time",
  "can't view this job",
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
  const normalized = String(text)
    .toLowerCase()
    // The caller strips tags but never decodes entities, so a page that writes
    // &#039; or &rsquo; arrives here with the apostrophe still encoded and every
    // phrase below misses by one character.
    .replace(/&(?:#0*39|#x0*27|apos|lsquo|rsquo|#0*8217|#x0*2019);/gi, "'")
    .replace(/&nbsp;|&#0*160;/gi, " ")
    .replace(/[\u2018\u2019\u02bc\u00b4`]/g, "'")
    .replace(/\s+/g, " ");
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

/**
 * A schema.org validThrough that has already passed, read from the RAW body.
 *
 * This used to run against the tag-stripped text, which is the one place the
 * date can never be. Employers publish validThrough inside a
 * <script type="application/ld+json"> block or as a <meta itemprop> attribute,
 * and fetchText() deletes every <script> block and then every tag before the
 * grep ran — so the rule that "exposed six long-dead cyber internships still
 * serving HTTP 200" could not match anything on any page, ever. A posting whose
 * employer closed it six months ago still reported "ok".
 *
 * Returns the offending date, or "" when there is nothing to report.
 */
export function expiredValidThrough(raw, host, now = Date.now()) {
  // On most sites a past validThrough means the posting is over. On some
  // aggregators it means nothing of the kind: HelloWork stamps every listing
  // datePosted + 30 days regardless of the employer's own timetable, so
  // trusting it there would retire live jobs a month after we found them.
  if (LISTING_TTL_HOSTS.has(host)) return "";

  // Read the JobPosting entities, do not grep the page.
  //
  // A bare search for the first `validThrough` anywhere in the body answers a
  // different question than the one asked. Job boards put a related-jobs
  // carousel beside the posting, each entry with its own JSON-LD, so the first
  // date on the page routinely belongs to a different -- and often expired --
  // job; a date left behind in an HTML comment counts the same way. Either one
  // retires a live listing, which is how a real internship disappears from the
  // site while its page still says it is open.
  const dates = jobPostingValidThrough(raw);
  if (!dates.length) return "";

  // The latest of them. Where the page describes several postings and we cannot
  // tell which is this one, the only date that proves anything is the last: if
  // even that has passed, nothing on the page is still open.
  const latest = dates.slice().sort().at(-1);
  return Date.parse(`${latest}T23:59:59Z`) < now ? latest : "";
}

/** Every validThrough date on a schema.org JobPosting in the page, as YYYY-MM-DD. */
function jobPostingValidThrough(raw) {
  const source = String(raw || "");
  const dates = [];

  for (const [, block] of source.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    let parsed;
    try {
      parsed = JSON.parse(block);
    } catch {
      // Malformed JSON-LD is common enough that failing here would be louder
      // than useful. A posting with no readable date is simply no signal.
      continue;
    }

    const queue = [parsed];
    while (queue.length) {
      const node = queue.pop();
      if (Array.isArray(node)) {
        queue.push(...node);
        continue;
      }
      if (!node || typeof node !== "object") continue;

      const types = [].concat(node["@type"] ?? []).map((value) => String(value).toLowerCase());
      if (types.includes("jobposting")) {
        const date = String(node.validThrough ?? "").match(/^(\d{4}-\d{2}-\d{2})/);
        if (date) dates.push(date[1]);
      }

      for (const value of Object.values(node)) {
        if (value && typeof value === "object") queue.push(value);
      }
    }
  }

  return dates;
}

/**
 * A URL safe to hand to curl as an argument.
 *
 * execFile takes an argument array, so there is no shell and no shell
 * injection. curl still reads its own options from argv though: a listing whose
 * href began with "-K" would make curl treat the rest as a config file path and
 * honour whatever that file said, including writing output to disk. "--" ends
 * option parsing, and this rejects anything that is not http(s) before dialling
 * -- add-stage.mjs already validated the scheme at the only place listings are
 * written, so this closes the gap for entries added by hand.
 */
function isHttpUrl(value) {
  try {
    const { protocol } = new URL(String(value));
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchText(url) {
  if (!isHttpUrl(url)) return { status: 0, text: "", raw: "", finalUrl: url };
  await waitForHost(url);
  try {
    const { stdout } = await execFileAsync("curl", [
      "-s", "-L", "--max-time", "25", "-A", UA,
      "-w", "\n__CODE__%{http_code}__URL__%{url_effective}", "--", url
    ], { maxBuffer: 12 * 1024 * 1024 });
    const marker = stdout.lastIndexOf("__CODE__");
    const tail = stdout.slice(marker + 8);
    const split = tail.indexOf("__URL__");
    const status = Number.parseInt(tail.slice(0, split === -1 ? undefined : split).trim(), 10) || 0;
    const finalUrl = split === -1 ? url : tail.slice(split + 7).trim();
    const body = stdout.slice(0, marker);
    // Comments before tags, and quoted attributes before the closing bracket.
    // This text is the only thing that decides whether a posting is dead, and
    // three separate wordings have already slipped past the check, so the
    // extraction is not cosmetic. Two regexes got it wrong in opposite
    // directions before it moved into scripts/lib/visible-text.mjs, which
    // explains both and is tested against them.
    return { status, text: visibleText(body), raw: body, finalUrl };
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
  // Two bugs lived in this pattern, and between them they sent three listings
  // down the HTML path where Workday serves an empty JavaScript shell:
  //   wd\d matched a single digit, so bdf.wd103 never reached the API at all;
  //   and the locale segment was required, so Renault's
  //   /renault-group-careers/job/... did not match either. Both tenants were
  //   then judged on a page containing no text, and reported OK.
  const match = href.match(/^https:\/\/([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com\/(?:[^/]+\/)?([^/]+)\/job\/(.+)$/i);
  if (!match) return "";
  const [, tenant, wd, site, jobPath] = match;
  return `https://${tenant}.${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/job/${jobPath}`;
}

/**
 * The tenant's public job-search endpoint, and the requisition token to ask it
 * about.
 *
 * Airbus answers 403 on three requisitions and 200 on a fourth, to the same
 * client, with the same headers, in the same second. That is not a rate limit —
 * a blocked client gets blocked for everything. Workday returns 403 for a
 * requisition that is no longer public, so a 403 here is a fact about the job,
 * not about us. The search endpoint is what proves which: if it answers 200 we
 * are demonstrably not blocked at this tenant, and a requisition missing from
 * its own site's search is gone.
 */
function workdaySearchUrl(href) {
  const match = href.match(/^https:\/\/([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com\/(?:[^/]+\/)?([^/]+)\/job\/(.+)$/i);
  if (!match) return null;
  const [, tenant, wd, site, jobPath] = match;
  const last = jobPath.split("/").pop() || "";
  const token = last.includes("_") ? last.slice(last.lastIndexOf("_") + 1) : last;
  if (!token) return null;
  return { url: `https://${tenant}.${wd}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/jobs`, token };
}

async function fetchJsonPost(url, payload) {
  await waitForHost(url);
  try {
    const { stdout } = await execFileAsync("curl", [
      "-s", "-L", "--max-time", "25", "-A", UA,
      "-X", "POST", "-H", "Content-Type: application/json", "-H", "Accept: application/json",
      "--data", JSON.stringify(payload),
      "-w", "\n__CODE__%{http_code}", "--", url
    ], { maxBuffer: 12 * 1024 * 1024 });
    const marker = stdout.lastIndexOf("__CODE__");
    const status = Number.parseInt(stdout.slice(marker + 8).trim(), 10) || 0;
    return { status, raw: stdout.slice(0, marker) };
  } catch {
    return { status: 0, raw: "" };
  }
}

/**
 * Does the tenant's own search still list this requisition? Returns null when
 * the search itself could not be trusted, so the caller keeps saying "a human
 * should look" rather than inventing a verdict from a failed lookup.
 */
export function requisitionInSearchResults(raw, token) {
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return null; }
  const postings = Array.isArray(parsed.jobPostings) ? parsed.jobPostings : null;
  if (!postings) return null;
  return postings.some((p) => String(p?.externalPath || "").includes(token));
}

async function workdayStillListed(href) {
  const search = workdaySearchUrl(href);
  if (!search) return null;
  const { status, raw } = await fetchJsonPost(search.url, {
    appliedFacets: {}, limit: 20, offset: 0, searchText: search.token
  });
  if (status !== 200) return null;
  return requisitionInSearchResults(raw, search.token);
}

/**
 * A Greenhouse-hosted posting, asked of Greenhouse rather than of the website.
 *
 * Several employers put a Cloudflare or Vercel challenge in front of their
 * careers page, so the posting answers 403 or 429 forever and parks in "needs a
 * human" every single week. A recurring alert that is never actionable is how
 * the last outage stayed invisible for eighty days -- the notifications had
 * become wallpaper. The board API answers cleanly and is authoritative: a job
 * is served there only while it is published, so a 404 is real evidence of
 * removal in a way a bot block never is.
 *
 * Returns true (still published), false (unpublished), or null (no opinion).
 */
function greenhouseApiUrl(href) {
  const direct = String(href).match(/^https?:\/\/(?:job-boards|boards)\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/i);
  if (direct) return `https://boards-api.greenhouse.io/v1/boards/${direct[1]}/jobs/${direct[2]}`;

  // Employers who front Greenhouse with their own domain -- helsing.ai/jobs/N,
  // coinbase.com/careers/positions/N -- are exactly the ones putting a
  // challenge page in the way, so they are the ones worth resolving. The board
  // slug is conventionally the brand, which the hostname already carries. A
  // wrong guess costs one 404 and returns "no opinion", which is where we
  // already were.
  try {
    const url = new URL(String(href));
    const id = url.pathname.match(/\/(\d{4,})(?:\/|$)/);
    if (!id) return null;
    const labels = url.hostname.toLowerCase().replace(/^www\./, "").split(".");
    const slug = labels.length > 1 ? labels[labels.length - 2] : labels[0];
    if (!slug) return null;
    return `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs/${id[1]}`;
  } catch {
    return null;
  }
}

/**
 * Ashby's public board, for the same reason as Greenhouse and Workday.
 *
 * jobs.ashbyhq.com serves a 78-126 character JavaScript shell to a plain fetch,
 * so all five Ashby listings on this board were judged on a page with no words
 * in it and reported OK. One of them -- Qonto's ML internship -- had been
 * delisted: absent from the 43 jobs the board API publishes, and its own
 * embedded state says isListed: false. Ashby deliberately keeps a direct link
 * working after delisting so in-flight candidates can finish, and shows no
 * closure banner, so there is nothing on the page to read even once it loads.
 *
 * Returns true if the board still publishes it, false if it does not, and null
 * when the question could not be asked.
 */
async function ashbyStillListed(href) {
  const match = href.match(/^https:\/\/jobs\.ashbyhq\.com\/([^/]+)\/([0-9a-f-]{36})/i);
  if (!match) return null;
  const [, board, id] = match;
  const { status, raw } = await fetchText(`https://api.ashbyhq.com/posting-api/job-board/${board}`);
  if (status !== 200) return null;
  try {
    const jobs = JSON.parse(raw).jobs;
    if (!Array.isArray(jobs)) return null;
    return jobs.some((job) => String(job.id).toLowerCase() === id.toLowerCase());
  } catch {
    return null;
  }
}

async function greenhouseStillListed(href) {
  const url = greenhouseApiUrl(href);
  if (!url) return null;
  const { status, text } = await fetchText(url);
  if (status === 404) return false;
  if (status !== 200) return null;
  try {
    return Boolean(JSON.parse(text).id);
  } catch {
    return null;
  }
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
      // Ask the same tenant's search before giving up. A 200 from search proves
      // this client is not blocked here, which turns the 403 above from "no
      // information" into "this requisition is not public any more".
      const listed = await workdayStillListed(stage.href);
      if (listed === false) {
        return { verdict: "GONE", detail: `Workday API HTTP ${status} and the requisition is absent from the tenant's own search` };
      }
      if (listed === true) {
        return { verdict: "OK", detail: `Workday API HTTP ${status}, but the tenant's search still lists the requisition` };
      }
      return { verdict: "CHECK", detail: `Workday API HTTP ${status} (blocked, and search could not confirm either way)` };
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

  // Ashby's own board, before the HTML -- which is a script shell either way.
  if (/^https:\/\/jobs\.ashbyhq\.com\//i.test(stage.href)) {
    const listed = await ashbyStillListed(stage.href);
    if (listed === true) return { verdict: "OK", detail: "Ashby board still publishes the posting" };
    if (listed === false) {
      return { verdict: "CHECK", detail: "Ashby board no longer publishes this posting (the direct link still works, which is how Ashby handles a delisted job)" };
    }
  }

  const { status, text, raw, finalUrl } = await fetchText(stage.href);
  if (status === 0) return { verdict: "CHECK", detail: "no response" };
  // Same move as the Workday branch above, for the other board this list uses:
  // when the website refuses us, ask the system of record.
  if (BLOCKED_STATUSES.has(status)) {
    const listed = await greenhouseStillListed(stage.href);
    if (listed === true) {
      return { verdict: "OK", detail: `HTTP ${status} from the site, but Greenhouse still publishes the posting` };
    }
    if (listed === false) {
      return { verdict: "GONE", detail: `HTTP ${status} from the site and Greenhouse no longer publishes the posting` };
    }
  }
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

  // A past schema.org validThrough — read from the raw body, because the date
  // only ever lives in markup that the text pipeline strips. See
  // expiredValidThrough.
  const host = listingHost(stage.href);
  const expired = expiredValidThrough(raw, host);
  if (expired) {
    return { verdict: "GONE", detail: `validThrough ${expired} has passed` };
  }

  if (BLOCKED_STATUSES.has(status)) {
    return { verdict: "CHECK", detail: `HTTP ${status} (blocked, not proof either way)` };
  }

  /**
   * A page with no words in it proves nothing, and used to pass.
   *
   * Workday, Ashby and BPCE all serve a JavaScript shell to a plain fetch: 0 to
   * 126 characters of text, no status error, no closure phrase, no
   * validThrough. Every check above finds nothing, so control reached the line
   * below and returned OK on the strength of a 200 and an empty body. That is
   * how two dead postings survived -- and the page tells readers "Every link is
   * opened and its page read", which cannot be true of a page that has nothing
   * to read.
   *
   * 400 characters is comfortably below any real posting and well above an
   * empty shell.
   */
  if (text.trim().length < 400) {
    return {
      verdict: "CHECK",
      detail: `HTTP ${status} but only ${text.trim().length} characters of text — the page is a script shell, so nothing was verified`
    };
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

/**
 * One stable token for the workflow to look for.
 *
 * .github/workflows/check-stages.yml used to grep this log for the prose
 * "needs a human". The line below says "need a human", singular, so the match
 * never fired -- and the only other branch, "^  Probably gone", is printed only
 * when something is GONE, which is also the path that makes this script exit 1
 * and abort the step before it can write any output at all. The review issue
 * was therefore unreachable in both directions. It had already swallowed two
 * suspect listings, Coinbase and Helsing, on the first and only run.
 *
 * A marker rather than prose, because prose gets reworded and a grep does not
 * follow it. tests/check-stages-review-signal.test.ts holds the two together.
 */
const REVIEW_MARKER = "REVIEW REQUIRED";
if (results.CHECK.length || results.GONE.length) {
  console.log(
    `\n  ${REVIEW_MARKER} — ${results.CHECK.length} need a human, ${results.GONE.length} look gone`
  );
}

/*
 * Both blocks print near the end, and that position is load-bearing.
 *
 * The workflow puts `tail -n 80` of this log into the review issue, so anything
 * printed inside the per-entry loop above is 100-odd lines up and gets cut.
 * GONE already had a block down here and survived; CHECK had only its inline
 * line, so the issue said "2 need a human" and never said WHICH two -- a
 * summary with no way to act on it, which is the same failure as a review
 * signal that cannot fire. Measured on run 37309467443: the issue named both
 * dead EDF listings and neither of the two suspect ones.
 */
if (results.CHECK.length) {
  console.log("\n  Needs a human — open each and judge it; leave it listed if the employer merely refused us:");
  for (const { stage, detail } of results.CHECK) {
    console.log(`    ${stage.id}\n      ${detail}\n      ${stage.href}`);
  }
}

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
