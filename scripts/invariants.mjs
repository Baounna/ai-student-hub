#!/usr/bin/env node
/**
 * The site-wide invariants, measured rather than asserted.
 *
 * Epochs 0 and 1 of the convergence loop recorded four invariants as "pass" in
 * docs/agent/convergence.json on the strength of audits that predated the
 * fixes. Nobody re-measured them. That is the same failure as the commit in
 * this repo's history called "stop four checks from passing without checking",
 * committed by the person who then did it again in a ledger.
 *
 * So the status vocabulary has three values and not two:
 *
 *   pass          a check ran and succeeded
 *   fail          a check ran and failed
 *   hand-checked  no automation exists, or the network was unavailable
 *
 * `hand-checked` is the whole point. It is visibly not `pass`, so an invariant
 * nobody has measured cannot hide among the ones that were. Its evidence must
 * say what a human would have to run.
 *
 *   npm run invariants            human-readable
 *   npm run invariants -- --json  the ledger's input
 *
 * Writes nothing. Exit 0 when no invariant FAILS; hand-checked does not fail
 * the run, because "not measured" is not "broken".
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://ai-student-hub-navy.vercel.app").replace(/\/+$/, "");
const LANG_DIR = path.join(ROOT, "src/app/[lang]");
const JSON_OUT = process.argv.includes("--json");

const results = {};
const record = (n, status, evidence) => {
  results[n] = { status, evidence };
};

/**
 * Routes that are not claims about the site.
 *
 * /growth-sprint is an internal checklist, disallowed in src/app/robots.ts and
 * carrying its own robots metadata. Its literals are instructions -- "Add
 * internal links between all 3 new articles" -- not statements about what the
 * site holds, so invariant 3 would otherwise fail forever on a page no reader
 * is meant to find. Excluded by name and for a stated reason, rather than by
 * loosening the pattern until it stops noticing.
 */
const NOT_READER_FACING = new Set(["/growth-sprint"]);

/** Nouns a reader counts. Used by invariants 2 and 3; kept in one place. */
const COUNTED = ["sources", "listings", "offres", "tools", "outils", "guides", "articles", "stages", "briefs"];

async function pageFiles() {
  const entries = await fs.readdir(LANG_DIR, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name.startsWith("[")) continue;
    const file = path.join(LANG_DIR, entry.name, "page.tsx");
    try {
      await fs.access(file);
      files.push({ route: `/${entry.name}`, file });
    } catch {
      // A section without its own page.tsx; nothing to measure.
    }
  }
  files.push({ route: "", file: path.join(LANG_DIR, "page.tsx") });
  return files;
}

async function fetchText(url) {
  const { stdout } = await execFileAsync("curl", ["-sL", "--max-time", "25", url], { maxBuffer: 20_000_000 });
  return stdout;
}

// ---------------------------------------------------------------- invariant 2
/**
 * One number, one value per screen — NOT automated, and here is why.
 *
 * The first attempt flagged every counted noun carrying two values on one
 * page. Measured against /blog it returned "sources = 72 and 4 and 3 and 1 and
 * 2 and 6", and against /campus "listings = 2 and 3". Those are not defects:
 * they are per-item counts, and twenty-four articles legitimately cite
 * different numbers of sources. The heuristic cannot tell a page-level
 * aggregate from a per-row figure, and every value it reported after the real
 * one was noise.
 *
 * The defect it was written for is narrower than the rule: an AGGREGATE
 * disagreeing with the per-item figures carrying the same label. /blog printed
 * "72 cited sources" in a summary tile while the chips beside each article
 * said "6 sources", and the same article read 6 in the stream and 4 in the
 * picks. Detecting that needs to know which figure is a summary, which this
 * cannot know from rendered text.
 *
 * So it is hand-checked, with the procedure written down, rather than
 * automated into something that cries wolf. A check that reports six values
 * where one is real is a check somebody switches off, and the switching off is
 * what this whole script exists to prevent.
 */
function invariant2() {
  record(
    2,
    "hand-checked",
    "no reliable automation: a per-item count and a page aggregate are indistinguishable in rendered text. " +
      "Procedure: on each page, list every summary figure and the per-row figures sharing its noun, and confirm " +
      "each is labelled with which quantity it is (src/lib/citations.ts referenceCountLabel is the pattern). " +
      "Last done 2026-11-08 on /blog: tile 72 cited sources, cards 'cited sources' or 'sources consulted', no bare 'sources'."
  );
}

// ---------------------------------------------------------------- invariant 3
/** Computed, never frozen: a counted noun preceded by a literal digit in source. */
async function invariant3(files) {
  const offenders = [];
  for (const { route, file } of files) {
    if (NOT_READER_FACING.has(route)) continue;
    const source = await fs.readFile(file, "utf8");
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const match of code.matchAll(/"([^"]*?\b\d+\s+(?:[a-zà-ÿ]+\s+)?(?:[a-zà-ÿ]+))[^"]*"/gi)) {
      const noun = match[1].trim().split(/\s+/).pop().toLowerCase();
      if (COUNTED.includes(noun)) offenders.push(`${route || "/"}: "${match[1].trim()}"`);
    }
  }
  if (!offenders.length) return record(3, "pass", `no reader-visible count is a literal in a page file (${[...NOT_READER_FACING].join(", ")} excluded: internal, robots-disallowed)`);
  record(3, "fail", offenders.slice(0, 6).join("; "));
}

// ---------------------------------------------------------------- invariant 4
/** Both locales render the same structure: heading count, level sequence, anchors. */
async function invariant4(routes) {
  const offenders = [];
  for (const route of routes) {
    let fr;
    let en;
    try {
      fr = await fetchText(`${SITE}/fr${route}`);
      en = await fetchText(`${SITE}/en${route}`);
    } catch {
      return record(4, "hand-checked", `network unavailable; run: curl -s ${SITE}/fr${route}`);
    }
    const shape = (html) => {
      const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
      const levels = [...body.matchAll(/<h([1-6])\b/gi)].map((m) => m[1]).join("");
      const anchors = (body.match(/<a\b/gi) || []).length;
      return { levels, anchors };
    };
    const a = shape(fr);
    const b = shape(en);
    if (a.levels !== b.levels) offenders.push(`${route || "/"}: heading levels fr=${a.levels.length} en=${b.levels.length}`);
    else if (Math.abs(a.anchors - b.anchors) > 0) offenders.push(`${route || "/"}: anchors fr=${a.anchors} en=${b.anchors}`);
  }
  if (!offenders.length) return record(4, "pass", `heading sequence and anchor count identical across locales (${routes.length} routes, measured at ${SITE})`);
  record(4, "fail", `measured at ${SITE} — ` + offenders.slice(0, 6).join("; "));
}

// ---------------------------------------------------------------- invariant 5
/** At most one signup block of a page's own, beyond the global footer. */
async function invariant5(files) {
  const offenders = [];
  for (const { route, file } of files) {
    const count = ((await fs.readFile(file, "utf8")).match(/<Newsletter\b/g) || []).length;
    if (count > 1) offenders.push(`${route || "/"}: ${count}`);
  }
  if (!offenders.length) return record(5, "pass", `every page renders <=1 of its own (${files.length} pages)`);
  record(5, "fail", offenders.join("; "));
}

// ---------------------------------------------------------------- invariant 8
/**
 * One date format per locale per page.
 *
 * Source-based, so it needs no network: it collects the locale tags any
 * Intl.DateTimeFormat in a page file resolves to. The defect it exists for had
 * one page printing "Nov 7, 2026" from en-US beside "10 November 2026" from
 * en-GB, month-first and day-first in the same column.
 */
async function invariant8(files) {
  const offenders = [];
  for (const { route, file } of files) {
    const source = await fs.readFile(file, "utf8");
    const tags = new Set();
    for (const match of source.matchAll(/Intl\.DateTimeFormat\(([^)]*)\)/g)) {
      for (const tag of match[1].matchAll(/"([a-z]{2}-[A-Z]{2})"/g)) tags.add(tag[1]);
    }
    const english = [...tags].filter((t) => t.startsWith("en"));
    const french = [...tags].filter((t) => t.startsWith("fr"));
    if (english.length > 1) offenders.push(`${route || "/"}: ${english.join(" + ")}`);
    if (french.length > 1) offenders.push(`${route || "/"}: ${french.join(" + ")}`);
  }
  if (!offenders.length) return record(8, "pass", "no page file resolves to two locale tags for one language");
  record(8, "fail", offenders.join("; "));
}

// --------------------------------------------------------------- invariant 11
/** The suite, and the baseline it may not drop below. */
async function invariant11() {
  let ledgerBaseline = 0;
  try {
    ledgerBaseline = JSON.parse(await fs.readFile(path.join(ROOT, "docs/agent/convergence.json"), "utf8")).baselineTests || 0;
  } catch {
    // No ledger yet: any count is the baseline.
  }
  try {
    const { stdout, stderr } = await execFileAsync("npx", ["vitest", "run"], { maxBuffer: 20_000_000 });
    const output = `${stdout}${stderr}`;
    const count = Number.parseInt(output.match(/Tests\s+(\d+) passed/)?.[1] || "0", 10);
    if (!count) return record(11, "hand-checked", "could not read a test count; run: npm test");
    if (count < ledgerBaseline) return record(11, "fail", `${count} tests, below the ledger baseline of ${ledgerBaseline}`);
    return record(11, "pass", `${count} tests passing (baseline ${ledgerBaseline})`);
  } catch (error) {
    record(11, "fail", `suite did not pass — ${String(error?.message || error).slice(0, 90)}`);
  }
}

/** Invariants with no automation yet. Named so they cannot hide among the passes. */
function handChecked() {
  record(1, "hand-checked", "no automation; read each page's claims against today's data (epoch 1: /stages, /news, /blog carry staleness notices)");
  record(6, "hand-checked", "npm run health reports it: no issue has ever been sent");
  record(7, "hand-checked", "grep hasPaidLinks in src/config/site.ts and GUIDE_EXISTS in src/lib/product.ts; both gates still drive the copy");
  record(9, "hand-checked", "tests/french-typography.test.ts covers the spacing; articles and elision are read by eye");
  record(10, "hand-checked", "every check added in epochs 0-1 has a test proving it can go red; older checks unaudited");
  record(12, "hand-checked", "npm run health");
}

async function main() {
  const files = await pageFiles();
  const routes = files.map((f) => f.route);

  handChecked();
  await invariant3(files);
  await invariant5(files);
  await invariant8(files);
  invariant2();
  await invariant4(routes);
  await invariant11();

  const ordered = Object.fromEntries(Object.keys(results).map(Number).sort((a, b) => a - b).map((n) => [n, results[n]]));

  if (JSON_OUT) {
    console.log(JSON.stringify(ordered, null, 2));
  } else {
    for (const [n, r] of Object.entries(ordered)) {
      const mark = r.status === "pass" ? "✔" : r.status === "fail" ? "✖" : "·";
      console.log(`${mark} ${String(n).padStart(2)}  ${r.status.padEnd(13)} ${r.evidence}`);
    }
    const failed = Object.values(ordered).filter((r) => r.status === "fail").length;
    const unmeasured = Object.values(ordered).filter((r) => r.status === "hand-checked").length;
    console.log(`\n${failed} failing, ${unmeasured} not measured by machine.`);
  }

  process.exit(Object.values(ordered).some((r) => r.status === "fail") ? 1 : 0);
}

main().catch((error) => {
  console.error(`invariants: ${String(error?.stack || error).slice(0, 400)}`);
  process.exit(1);
});
