#!/usr/bin/env node
/**
 * Do the sources this site cites still exist?
 *
 * The internship board has had an automated weekly link check since September.
 * The guides never had one, and they are the part of the site whose whole claim
 * is that every source was opened and read. Five cited pages had already moved
 * under us before anyone looked -- the OWASP LLM Top 10, Anthropic's agents
 * post, MDN's HTTP status reference, the OWASP API list and the GitHub Actions
 * events page -- each found by hand, months after the fact. Nothing would have
 * said so.
 *
 * This reports and never rewrites. A citation is a claim that a specific page
 * supports a specific sentence; the new address may say something else, and the
 * only way to know is to read it. So unlike check-stages.mjs there is no
 * --write and no --prune: the output is for a person.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { citationIndex } from "./lib/citation-index.mjs";
import { citationVerdict } from "./lib/citation-verdict.mjs";

const execFileAsync = promisify(execFile);

/**
 * An honest identifier, not a browser string.
 *
 * check-stages.mjs sends a Chrome user-agent at job boards, which is a choice
 * made for a different problem: those boards serve the posting only to a
 * browser, and the alternative was a board that could not be checked at all.
 * Publishers do not work that way. One that refuses this agent gets reported as
 * "could not read", which is the truth, rather than being read behind a
 * disguise.
 */
const UA = "ai-student-hub-citation-check/1.0 (+https://ai-student-hub-navy.vercel.app)";

/** One hit per host per second, so a site with nine citations is not hammered. */
const PER_HOST_DELAY_MS = 1_000;
const lastHitAt = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHost(url) {
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    return;
  }
  const wait = (lastHitAt.get(host) || 0) + PER_HOST_DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastHitAt.set(host, Date.now());
}

/**
 * execFile takes an argument array, so there is no shell. "--" still matters:
 * curl reads its own options from argv, and a href beginning with "-K" would
 * make it treat the rest as a config file to obey.
 */
async function head(url) {
  await waitForHost(url);
  try {
    const { stdout } = await execFileAsync(
      "curl",
      [
        "-s", "-o", "/dev/null", "-L", "--max-time", "25", "-A", UA,
        "-w", "%{http_code} %{url_effective}", "--", url
      ],
      { maxBuffer: 1024 * 1024 }
    );
    const [code, finalUrl = url] = stdout.trim().split(/\s+/);
    return { status: Number.parseInt(code, 10) || 0, finalUrl };
  } catch {
    return { status: 0, finalUrl: url };
  }
}

export async function checkAll(entries, fetchOne = head) {
  const results = [];
  for (const entry of entries) {
    const { status, finalUrl } = await fetchOne(entry.href);
    results.push({ ...entry, status, finalUrl, ...citationVerdict({ href: entry.href, status, finalUrl }) });
  }
  return results;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const entries = await citationIndex();
  console.log(`\n  Checking ${entries.length} links in the published content.\n`);

  const results = await checkAll(entries);
  const by = (level) => results.filter((r) => r.level === level);

  for (const result of results) {
    const mark = { ok: "ok   ", moved: "MOVED", gone: "GONE ", check: "check" }[result.level];
    console.log(`  ${mark} ${result.owner.slice(0, 58)}`);
    if (result.level !== "ok") console.log(`        ${result.detail}`);
  }

  console.log(
    `\n  ${by("ok").length} still there · ${by("moved").length} moved · ` +
      `${by("gone").length} gone · ${by("check").length} could not be read`
  );

  if (by("check").length) {
    // First, and the actionable block last, because the workflow puts a tail
    // of this log into the issue body. The stage check's workflow records the
    // same bug: its tail held the harmless block and cut the one a person
    // had to act on.
    //
    // Printed, but it does not fail the run. With an honest user-agent some
    // publishers refuse us every single week, and a check that fails every week
    // is a check nobody reads.
    console.log("\n  Could not be read — proves nothing either way, no action:");
    for (const result of by("check")) {
      console.log(`    ${result.detail}  ${result.href}`);
    }
  }

  if (by("gone").length || by("moved").length) {
    console.log("\n  Needs a person — open each, read the page, then fix or replace the citation:");
    for (const result of [...by("gone"), ...by("moved")]) {
      console.log(`    ${result.file}  ${result.owner}`);
      console.log(`      ${result.detail}`);
      console.log(`      ${result.href}`);
    }
  }

  // One token, printed on purpose, for the workflow to grep. Matching the
  // script's prose is what broke the stage check's workflow once: it looked for
  // "needs a human" and the script said "need a human".
  const outstanding = by("gone").length + by("moved").length;
  console.log(
    outstanding
      ? `\n  REVIEW REQUIRED — ${outstanding} citation(s) no longer answer where the content says they do\n`
      : "\n  Every cited page still answers at the address the content gives.\n"
  );

  process.exit(outstanding ? 1 : 0);
}
