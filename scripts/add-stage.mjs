#!/usr/bin/env node
/**
 * Add an internship to the list.
 *
 * The weekly update is the whole risk in this format: a list that stops being
 * updated is worse than no list, because it looks maintained while quietly
 * filling with closed positions. So adding an entry has to cost almost
 * nothing — four answers, and the file is written, sorted and re-stamped.
 *
 *   npm run add:stage
 *   npm run add:stage -- --role "Stage PFE - Data" --company OCP --city Casablanca \
 *                        --deadline 2026-11-15 --link https://...
 *
 * It refuses rather than write something broken: a past deadline, a malformed
 * date, a duplicate, or a link that does not resolve.
 *
 * Most postings publish no closing date at all — they run until the position is
 * filled. Pass --deadline rolling (or leave it blank) for those. Do not invent
 * a date to fill the field: a student reads it as fact and plans around it.
 */
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const FILE = path.join(process.cwd(), "src/content/stages.json");
const KINDS = ["stage", "alternance", "pfe"];
const REMOTES = ["onsite", "hybrid", "remote"];

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    out[key] = next && !next.startsWith("--") ? next : "true";
  }
  return out;
}

function slugify(value) {
  return value
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

/** A link nobody can open is not an opening. */
async function linkResolves(url) {
  try {
    const { stdout: code } = await execFileAsync("curl", [
      "-s", "-o", "/dev/null", "-w", "%{http_code}", "-L", "--max-time", "20",
      "-A", "Mozilla/5.0", url
    ]);
    const status = Number.parseInt(code.trim(), 10);
    // 403 and 999 are bot blocks, not dead pages — job boards do this constantly.
    return [200, 201, 301, 302, 303, 307, 308, 403, 405, 999].includes(status) ? status : status;
  } catch {
    return 0;
  }
}

const args = parseArgs(process.argv.slice(2));
const interactive = !args.role;

let answers = args;
if (interactive) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const ask = async (label, fallback = "") => {
    const value = (await rl.question(`  ${label}${fallback ? ` [${fallback}]` : ""}: `)).trim();
    return value || fallback;
  };
  console.log("\n  New internship entry. Enter to accept a default.\n");
  answers = {
    role: await ask("Role"),
    company: await ask("Company"),
    city: await ask("City"),
    country: await ask("Country (MA/FR)", "MA"),
    kind: await ask(`Kind (${KINDS.join("/")})`, "stage"),
    deadline: await ask("Deadline (YYYY-MM-DD, or blank if none published)"),
    link: await ask("Link"),
    duration: await ask("Duration (optional)"),
    level: await ask("Level (optional)"),
    remote: await ask(`Remote (${REMOTES.join("/")})`, "onsite"),
    source: await ask("Source (optional)")
  };
  rl.close();
}

const role = (answers.role || "").trim();
const company = (answers.company || "").trim();
const city = (answers.city || "").trim();
const country = (answers.country || "MA").trim().toUpperCase();
const kind = (answers.kind || "stage").trim().toLowerCase();
const rawDeadline = (answers.deadline || "").trim();
// "rolling" and blank both mean the posting published no closing date.
const deadline = /^(rolling|none|n\/a)$/i.test(rawDeadline) ? "" : rawDeadline;
const href = (answers.link || answers.href || "").trim();

if (!role || !company || !city || !href) {
  fail("role, company, city and link are all required.");
}
if (!KINDS.includes(kind)) fail(`Kind must be one of: ${KINDS.join(", ")}`);
if (deadline) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) fail(`Deadline must look like 2026-11-15, got "${deadline}".`);
  if (Number.isNaN(Date.parse(`${deadline}T12:00:00Z`))) fail(`"${deadline}" is not a real date.`);
  if (Date.parse(`${deadline}T23:59:59Z`) < Date.now()) {
    fail(`That deadline has already passed. Adding a closed position helps nobody.`);
  }
}
if (!/^https?:\/\//.test(href)) fail("Link must be an http(s) URL.");

const file = JSON.parse(await fs.readFile(FILE, "utf8"));
const today = new Date().toISOString().slice(0, 10);
const id = `${slugify(company)}-${slugify(role)}-${deadline ? deadline.slice(0, 7) : "rolling"}`;
if (file.items.some((item) => item.id === id)) fail(`Already listed: ${id}`);
if (file.items.some((item) => item.href === href)) fail(`That link is already in the list.`);

const status = await linkResolves(href);
if (status === 0) fail(`Could not reach ${href}. Check the link before adding it.`);
if (status >= 400 && ![403, 405, 999].includes(status)) {
  fail(`${href} returned HTTP ${status}. Not adding a dead link.`);
}

const entry = {
  id, role, company, city, country, kind,
  ...(answers.duration ? { duration: answers.duration.trim() } : {}),
  ...(answers.level ? { level: answers.level.trim() } : {}),
  ...(REMOTES.includes((answers.remote || "").trim()) ? { remote: answers.remote.trim() } : {}),
  ...(deadline ? { deadline } : {}),
  // What we can actually vouch for on a rolling posting: the day we opened
  // the link and it was still there.
  checkedAt: today,
  postedAt: today,
  href,
  ...(answers.source ? { source: answers.source.trim() } : {})
};

file.items.push(entry);
// Same order the page uses: dated entries by soonest cutoff, rolling after.
file.items.sort((a, b) => {
  if (Boolean(a.deadline) !== Boolean(b.deadline)) return a.deadline ? -1 : 1;
  if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
  return a.company.localeCompare(b.company) || a.role.localeCompare(b.role);
});
file.updatedAt = new Date().toISOString();
await fs.writeFile(FILE, `${JSON.stringify(file, null, 2)}\n`);

const open = file.items.filter(
  (i) => !i.deadline || Date.parse(`${i.deadline}T23:59:59Z`) >= Date.now()
).length;
console.log(`
  Added: ${entry.role} — ${entry.company}
  Deadline: ${deadline || "none published (open until filled)"}
  Link checked: HTTP ${status}
  List now: ${open} open of ${file.items.length}

  Next: npm run build, then commit.
`);
