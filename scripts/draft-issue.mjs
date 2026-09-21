#!/usr/bin/env node
/**
 * Draft the weekly internship email from the list itself.
 *
 * The signup form promises "one email a week". Zero have ever been sent. The
 * gap between those two facts is the same kind of untruth the roadmap was, and
 * the reason it persists is that writing an issue by hand every week is work
 * nobody sustains. So the issue is generated from src/content/stages.json and
 * the weekly job becomes: run this, read it, send it.
 *
 *   npm run draft:issue              what is new since the last issue
 *   npm run draft:issue -- --all     every open listing, not just what is new
 *   npm run draft:issue -- --full    no digest cap (long, and looks like spam)
 *   npm run draft:issue -- --limit 20
 *   npm run draft:issue -- --since 2026-09-01
 *
 * Writes drafts/issue-<date>.{txt,html} and records what it covered, so the
 * next run genuinely means "new since last time" rather than "new since I last
 * remembered". Nothing is sent: the draft is for a human to read first.
 */
import fs from "node:fs/promises";
import path from "node:path";

const STAGES = path.join(process.cwd(), "src/content/stages.json");
const STATE = path.join(process.cwd(), "drafts/.last-issue.json");
const OUT = path.join(process.cwd(), "drafts");

const argv = process.argv.slice(2);
const arg = (name) => { const i = argv.indexOf(`--${name}`); return i === -1 ? "" : argv[i + 1] || "true"; };
const ALL = argv.includes("--all");

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://ai-student-hub-navy.vercel.app").replace(/\/+$/, "");
const today = new Date().toISOString().slice(0, 10);

const file = JSON.parse(await fs.readFile(STAGES, "utf8"));
const open = file.items.filter((s) => !s.deadline || Date.parse(`${s.deadline}T23:59:59Z`) >= Date.now());

let since = arg("since");
/**
 * Entries already carried in a previous issue, by id. The watermark used to be
 * a single date, which did not survive the digest cap landing later: one run
 * stamped today, covered twelve, and every future run then filtered on
 * "posted after today" and reported nothing new. The other eighty-four could
 * never appear again. Tracking what was actually sent is the only version of
 * this that composes with a cap.
 */
let alreadySent = new Set();
if (!ALL) {
  try {
    const state = JSON.parse(await fs.readFile(STATE, "utf8"));
    if (!since) since = state.sentAt || "";
    if (Array.isArray(state.coveredIds)) alreadySent = new Set(state.coveredIds);
  } catch {
    since = since || "";
  }
}

const fresh = ALL ? open : open.filter((s) => !alreadySent.has(s.id));

/**
 * An email carrying ninety-six outbound links is a spam signal before it is
 * anything else, and nobody scrolls ninety-six jobs in an inbox. So the issue
 * is a digest: the ones with a real closing date first, because those are the
 * ones you can miss, then the most recently found. The rest stay one click
 * away on a page built to hold them.
 */
const LIMIT = Number.parseInt(arg("limit") || "12", 10);
const ranked = [...fresh].sort((a, b) => {
  if (Boolean(a.deadline) !== Boolean(b.deadline)) return a.deadline ? -1 : 1;
  if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
  return (b.postedAt || "").localeCompare(a.postedAt || "");
});
const picked = argv.includes("--full") ? ranked : ranked.slice(0, LIMIT);
const remaining = ranked.length - picked.length;

if (!picked.length) {
  console.log(`\n  Every open listing has already been sent. Skip this week rather than repeat one.\n`);
  process.exit(0);
}

const byCountry = (code) => picked.filter((s) => s.country === code);
const KIND = { stage: "Internship", alternance: "Apprenticeship", pfe: "Final-year project" };

function line(s) {
  const bits = [KIND[s.kind] || s.kind, `${s.city}`];
  if (s.duration) bits.push(s.duration);
  if (s.level) bits.push(s.level);
  const when = s.deadline ? `Apply by ${s.deadline}` : "Open until filled";
  return { head: `${s.role} - ${s.company}`, meta: `${bits.join(" | ")} | ${when}`, href: s.href };
}

const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const sections = [["Morocco", byCountry("MA")], ["France", byCountry("FR")]].filter(([, v]) => v.length);

// The oldest per-entry check, so the email never claims a link was verified
// more recently than it actually was.
const checkedOn = picked
  .map((s) => s.checkedAt)
  .filter(Boolean)
  .reduce((oldest, value) => (value < oldest ? value : oldest), today);

const dated = picked.filter((s) => s.deadline).length;
const intro =
  `${picked.length} ${picked.length === 1 ? "opening" : "openings"} below` +
  (dated ? `, ${dated} with a published closing date.` : ", none with a published closing date, so they run until filled.") +
  (remaining > 0 ? ` ${remaining} more are on the site.` : "");

let txt = `Tech internships - ${today}\n\n${intro}\n`;
for (const [name, list] of sections) {
  txt += `\n\n${name.toUpperCase()} (${list.length})\n${"-".repeat(name.length + 6)}\n`;
  for (const s of list) { const l = line(s); txt += `\n${l.head}\n  ${l.meta}\n  ${l.href}\n`; }
}
txt += remaining > 0 ? `\n\nThe other ${remaining} openings: ${SITE}/en/stages\n` : "\n";
txt += `\nEvery link above was opened and checked on ${checkedOn}.\n`;
txt += `\nYou are getting this because you signed up at ${SITE}. Unsubscribe any time.\n`;

let html = `<div style="font:16px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;max-width:640px">
<p style="margin:0 0 20px">${esc(intro)}</p>`;
for (const [name, list] of sections) {
  html += `<h2 style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#666;margin:28px 0 12px;border-bottom:1px solid #e5e5e5;padding-bottom:6px">${esc(name)} (${list.length})</h2>`;
  for (const s of list) {
    const l = line(s);
    html += `<p style="margin:0 0 16px"><a href="${esc(l.href)}" style="color:#0b5cd5;text-decoration:none;font-weight:600">${esc(l.head)}</a><br>
<span style="color:#666;font-size:14px">${esc(l.meta)}</span></p>`;
  }
}
html += remaining > 0
  ? `<p style="margin:28px 0 0"><a href="${esc(SITE)}/en/stages" style="color:#0b5cd5;font-weight:600">See the other ${remaining} openings</a></p>`
  : "";
html += `<p style="margin:16px 0 0;color:#666;font-size:14px">Every link above was opened and checked on ${esc(checkedOn)}.</p></div>`;

await fs.mkdir(OUT, { recursive: true });
await fs.writeFile(path.join(OUT, `issue-${today}.txt`), txt);
await fs.writeFile(path.join(OUT, `issue-${today}.html`), html);
const covered = [...alreadySent, ...picked.map((s) => s.id)];
await fs.writeFile(
  STATE,
  `${JSON.stringify({ sentAt: today, covered: covered.length, coveredIds: covered }, null, 2)}\n`
);

const subject = remaining > 0
  ? `${picked.length} internships closing soonest - Morocco and France`
  : `${picked.length} tech internship${picked.length === 1 ? "" : "s"} - Morocco and France`;
console.log(`
  Subject: ${subject}

  ${picked.length} listings  (${byCountry("MA").length} Morocco, ${byCountry("FR").length} France)
  drafts/issue-${today}.txt
  drafts/issue-${today}.html

  Read it, then paste the HTML into Kit as a broadcast. Nothing was sent.
`);
