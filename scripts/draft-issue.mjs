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
import { readPostIndex } from "./lib/posts-index.mjs";

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

/**
 * --since is a manual override for one run: "only entries found on or after
 * this day". It is read from the command line and nowhere else. It used to
 * default to the previous issue's sentAt, which is the single-date watermark
 * the comment below exists to warn about — reviving it through this flag would
 * reintroduce the same bug. It was also never applied to anything: the variable
 * was assigned and then unread, so the documented flag silently did nothing.
 */
const since = arg("since");
if (since && !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
  console.error(`\n  --since must look like 2026-09-01, got "${since}".\n`);
  process.exit(1);
}

/**
 * Entries already carried in a previous issue, by id. The watermark used to be
 * a single date, which did not survive the digest cap landing later: one run
 * stamped today, covered twelve, and every future run then filtered on
 * "posted after today" and reported nothing new. The other eighty-four could
 * never appear again. Tracking what was actually sent is the only version of
 * this that composes with a cap.
 *
 * Read on every run, --all included. --all changes what *this* issue covers;
 * it says nothing about what previous issues covered. Skipping the read left
 * this set empty, and the write at the end is `[...alreadySent, ...picked]` —
 * so a single --all run rebuilt the record from nothing and threw away every
 * id ever sent. The next ordinary run then re-sent listings subscribers had
 * already received, which is the one thing this file exists to prevent.
 */
let alreadySent = new Set();
let guidesSent = new Set();
try {
  const state = JSON.parse(await fs.readFile(STATE, "utf8"));
  if (Array.isArray(state.coveredIds)) alreadySent = new Set(state.coveredIds);
  if (Array.isArray(state.coveredSlugs)) guidesSent = new Set(state.coveredSlugs);
} catch {
  // No state file yet: the first issue covers whatever is open.
}

const unsent = ALL ? open : open.filter((s) => !alreadySent.has(s.id));
const fresh = since ? unsent.filter((s) => (s.postedAt || "") >= since) : unsent;

/**
 * An email carrying ninety-six outbound links is a spam signal before it is
 * anything else, and nobody scrolls ninety-six jobs in an inbox. So the issue
 * is a digest: the ones with a real closing date first, because those are the
 * ones you can miss, then the most recently found. The rest stay one click
 * away on a page built to hold them.
 */
// A bare `--limit` with no value makes arg() return "true", and
// Number.parseInt("true") is NaN — slice(0, NaN) returns an empty array, so the
// run reported "everything has already been sent" and wrote no issue at all.
const parsedLimit = Number.parseInt(arg("limit") || "12", 10);
const LIMIT = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 12;
const ranked = [...fresh].sort((a, b) => {
  if (Boolean(a.deadline) !== Boolean(b.deadline)) return a.deadline ? -1 : 1;
  if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
  return (b.postedAt || "").localeCompare(a.postedAt || "");
});
const picked = argv.includes("--full") ? ranked : ranked.slice(0, LIMIT);
const remaining = ranked.length - picked.length;
// What the reader will find if they click, which is every open listing except
// the ones already in this email. `remaining` counts only what has not been
// emailed before, so using it here said "80 more are on the site" about a page
// showing 102 -- true of our sending history, not of the page.
const onSiteOther = Math.max(open.length - picked.length, 0);

/**
 * The guides, which are the part of this email that is not regional.
 *
 * Listings are regional -- ten countries now, not the two this started with --
 * so a subscriber in a country with nothing new this week opens an email with
 * no listing for them, which is a strange thing to send from a site whose
 * twenty-four guides work the same in any country. So the issue also
 * carries the guides it has not sent before, tracked by slug the same way
 * listings are tracked by id — never a rotation of old ones dressed up as new.
 */
const GUIDE_LIMIT = 3;
const allGuides = await readPostIndex();
const newGuides = allGuides
  .filter((g) => ALL || !guidesSent.has(g.slug))
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  .slice(0, GUIDE_LIMIT);

// An issue with no new listings but a new guide is still worth sending, so the
// exit now needs both halves to be empty. It used to check listings alone,
// which would have thrown away a perfectly good guides-only issue.
if (!picked.length && !newGuides.length) {
  console.log(`\n  Nothing new since the last issue - no unsent listings, no unsent guides. Skip this week rather than repeat one.\n`);
  process.exit(0);
}

const byCountry = (code) => picked.filter((s) => s.country === code);
const KIND = { stage: "Internship", alternance: "Apprenticeship", pfe: "Final-year project" };

/**
 * Duration and level are printed as the employer wrote them -- "6 mois",
 * "Bac+5" -- where the site translates them.
 *
 * src/lib/stage-format.ts does that properly, and it is 117 lines of parsing,
 * not a lookup table. This file is plain .mjs run by node, so reaching it would
 * mean either adding tsx as a dependency -- regenerating package-lock.json,
 * which on macOS is the mistake that kept CI red for four commits -- or
 * copying the parser here, which is the duplicated-rule fault this repository
 * has now hit three times. Neither is worth it: these subscribers are mostly
 * French-speaking students for whom "Bac+5" is the clearer term, and the words
 * are the employer's own rather than anything invented. Revisit if the list
 * stops being mostly francophone.
 */
function line(s) {
  // Not every employer publishes a city. Cohere lists its two Canadian roles
  // with none, and `${s.city}` rendered the string "undefined" into the email:
  // "Internship | undefined | 3-6 months". The page fixed this by falling back
  // to the country; so does this, because a reader deciding whether to apply
  // needs to know where, and "undefined" is worse than no answer at all.
  const where = s.city || countryName(s.country);
  const bits = [KIND[s.kind] || s.kind, where];
  if (s.duration) bits.push(s.duration);
  if (s.level) bits.push(s.level);
  const when = s.deadline ? `Apply by ${s.deadline}` : "Open until filled";
  return { head: `${s.role} - ${s.company}`, meta: `${bits.join(" | ")} | ${when}`, href: s.href };
}

const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Every country in the issue, not the two this board started with.
 *
 * This read [["Morocco", MA], ["France", FR]] and nothing else. The board now
 * spans ten countries, so the week its twelve picks came from the United
 * States, Canada, Germany and the Netherlands, both sections were empty and
 * the email printed no listings at all -- under an opening line promising
 * "12 openings below". The subject said "Morocco and France" over an issue
 * containing none of either. Same stale assumption the /stages title carried
 * until it was counted from the data instead.
 *
 * Read from the listings, largest first, so the issue describes itself.
 */
const COUNTRY_NAMES = {
  MA: "Morocco", FR: "France", BE: "Belgium", CH: "Switzerland", DE: "Germany",
  ES: "Spain", IE: "Ireland", IT: "Italy", LU: "Luxembourg", NL: "Netherlands",
  PL: "Poland", PT: "Portugal", SE: "Sweden", GB: "United Kingdom",
  US: "United States", CA: "Canada"
};
const countryName = (code) => COUNTRY_NAMES[code] || code;

const sections = [...new Set(picked.map((s) => s.country))]
  .map((code) => [countryName(code), byCountry(code), code])
  .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

// The oldest per-entry check, so the email never claims a link was verified
// more recently than it actually was.
const checkedOn = picked
  .map((s) => s.checkedAt)
  .filter(Boolean)
  .reduce((oldest, value) => (value < oldest ? value : oldest), today);

const dated = picked.filter((s) => s.deadline).length;
const intro = !picked.length
  ? `No new openings since the last issue. ${open.length} are still open on the site, and the guides below are new.`
  : `${picked.length} ${picked.length === 1 ? "opening" : "openings"} below` +
    (dated ? `, ${dated} with a published closing date.` : ", none with a published closing date, so they run until filled.") +
    (onSiteOther > 0 ? ` ${onSiteOther} more are on the site.` : "");

// A guides-only issue headed "Tech internships" contradicts its own contents
// in the first line a reader sees.
const heading = picked.length ? "Tech internships" : "New guides";
let txt = `${heading} - ${today}\n\n${intro}\n`;
for (const [name, list] of sections) {
  txt += `\n\n${name.toUpperCase()} (${list.length})\n${"-".repeat(name.length + 6)}\n`;
  for (const s of list) { const l = line(s); txt += `\n${l.head}\n  ${l.meta}\n  ${l.href}\n`; }
}
txt += onSiteOther > 0 ? `\n\nThe other ${onSiteOther} openings: ${SITE}/en/stages\n` : "\n";
if (newGuides.length) {
  txt += `\n\nGUIDES (${newGuides.length})\n${"-".repeat(12)}\n`;
  txt += `\nNot region-specific. These work wherever you are.\n`;
  for (const g of newGuides) {
    txt += `\n${g.title}\n  ${SITE}/en/blog/${g.slug}\n`;
  }
}
if (picked.length) txt += `\nEvery listing above was opened and checked on ${checkedOn}.\n`;
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
if (newGuides.length) {
  html += `<h2 style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#666;margin:28px 0 12px;border-bottom:1px solid #e5e5e5;padding-bottom:6px">Guides (${newGuides.length})</h2>`;
  html += `<p style="margin:0 0 16px;color:#666;font-size:14px">Not region-specific. These work wherever you are.</p>`;
  for (const g of newGuides) {
    html += `<p style="margin:0 0 16px"><a href="${esc(SITE)}/en/blog/${esc(g.slug)}" style="color:#0b5cd5;text-decoration:none;font-weight:600">${esc(g.title)}</a></p>`;
  }
}
if (picked.length) {
  html += `<p style="margin:16px 0 0;color:#666;font-size:14px">Every listing above was opened and checked on ${esc(checkedOn)}.</p>`;
}
html += `</div>`;

await fs.mkdir(OUT, { recursive: true });
await fs.writeFile(path.join(OUT, `issue-${today}.txt`), txt);
await fs.writeFile(path.join(OUT, `issue-${today}.html`), html);
/**
 * Writing a draft is not sending it.
 *
 * This wrote the sent-ledger on every run, directly under a line reading
 * "Nothing was sent" -- and sending really is a separate manual step: the
 * script produces HTML a person then pastes into Kit. So every draft that was
 * generated and not sent silently retired its listings. Three drafts exist in
 * this folder from September, no issue has ever gone out, and the ledger
 * claimed 48 of 102 listings covered: the first real issue would have skipped
 * nearly half the board, and nobody would have seen that happen.
 *
 * The ids go into a pending file beside the draft instead. `npm run
 * draft:sent` promotes the pending file once the issue is actually sent, which
 * is the only moment the claim becomes true.
 */
await fs.writeFile(
  path.join(OUT, `issue-${today}.pending.json`),
  `${JSON.stringify({ draftedAt: today, ids: picked.map((s) => s.id), slugs: newGuides.map((g) => g.slug) }, null, 2)}\n`
);

/**
 * The countries this issue actually contains, named in the subject.
 *
 * It said "Morocco and France" every week whatever was inside, which this week
 * would have been a subject line naming two countries the email did not
 * mention once. Two names and a count, because a subject listing six is not
 * read.
 */
const subjectWhere = sections.length
  ? sections.length <= 2
    ? sections.map(([name]) => name).join(" and ")
    : `${sections[0][0]}, ${sections[1][0]} and ${sections.length - 2} more`
  : "";

// A subject line reading "0 internships" is the kind of detail that decides
// whether an email gets opened, so a guides-only issue says what it is.
const subject = !picked.length
  ? `${newGuides.length} new guide${newGuides.length === 1 ? "" : "s"} - and ${open.length} internships still open`
  : remaining > 0
    ? `${picked.length} internships closing soonest - ${subjectWhere}`
    : `${picked.length} tech internship${picked.length === 1 ? "" : "s"} - ${subjectWhere}`;
console.log(`
  Subject: ${subject}

  ${picked.length} listings  (${sections.map(([name, list]) => `${list.length} ${name}`).join(", ") || "none"})
  ${newGuides.length} guides   (not region-specific)
  drafts/issue-${today}.txt
  drafts/issue-${today}.html

  Read it, then paste the HTML into Kit as a broadcast. Nothing was sent.
  Once it IS sent, run: npm run draft:sent
  Until then these listings stay unsent, so the next draft still offers them.
`);
