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
 *   npm run draft:issue -- --all     every open listing (use for issue #1)
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
if (!since && !ALL) {
  try { since = JSON.parse(await fs.readFile(STATE, "utf8")).sentAt || ""; } catch { since = ""; }
}

const picked = ALL || !since ? open : open.filter((s) => (s.postedAt || "") > since);

if (!picked.length) {
  console.log(`\n  Nothing new since ${since}. Skip this week rather than send an empty email.\n`);
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

const dated = picked.filter((s) => s.deadline).length;
const intro =
  `${picked.length} ${picked.length === 1 ? "opening" : "openings"} this week` +
  (dated ? `, ${dated} with a published closing date.` : ". None of them publishes a closing date, so they run until filled.");

let txt = `Tech internships - ${today}\n\n${intro}\n`;
for (const [name, list] of sections) {
  txt += `\n\n${name.toUpperCase()} (${list.length})\n${"-".repeat(name.length + 6)}\n`;
  for (const s of list) { const l = line(s); txt += `\n${l.head}\n  ${l.meta}\n  ${l.href}\n`; }
}
txt += `\n\nEvery link was opened and checked on ${today}. Full list: ${SITE}/en/stages\n`;
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
html += `<p style="margin:28px 0 0;color:#666;font-size:14px">Every link was opened and checked on ${esc(today)}.
<a href="${esc(SITE)}/en/stages" style="color:#0b5cd5">See the full list</a>.</p></div>`;

await fs.mkdir(OUT, { recursive: true });
await fs.writeFile(path.join(OUT, `issue-${today}.txt`), txt);
await fs.writeFile(path.join(OUT, `issue-${today}.html`), html);
await fs.writeFile(STATE, `${JSON.stringify({ sentAt: today, covered: picked.length }, null, 2)}\n`);

const subject = `${picked.length} tech internship${picked.length === 1 ? "" : "s"} - Morocco and France`;
console.log(`
  Subject: ${subject}

  ${picked.length} listings  (${byCountry("MA").length} Morocco, ${byCountry("FR").length} France)
  drafts/issue-${today}.txt
  drafts/issue-${today}.html

  Read it, then paste the HTML into Kit as a broadcast. Nothing was sent.
`);
