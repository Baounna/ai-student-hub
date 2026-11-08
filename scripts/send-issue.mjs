#!/usr/bin/env node
/**
 * Send the waiting issue to Kit — the step that was always manual.
 *
 * draft-issue.mjs and mark-issue-sent.mjs are deliberately separate files, and
 * the comment in each says why: writing a draft is not sending it, and when
 * the two were one action, three September drafts retired their listings
 * without an email ever going out. This closes the gap without collapsing that
 * distinction — the draft is still produced and still readable, and a send is
 * still a separate, deliberate act. What changes is that the act no longer
 * requires a person to copy HTML between two browser tabs.
 *
 *   npm run send:issue                 what it WOULD do, and nothing else
 *   npm run send:issue -- --send       actually send
 *   npm run send:issue -- --issue 2026-11-08 --send
 *
 * Dry run is the default because this is the only irreversible thing in the
 * repository. Everything else here can be reverted with git.
 *
 * Needs KIT_API_KEY: a **v4** key, used as the `X-Kit-Api-Key` header. The
 * CONVERTKIT_API_KEY already in the environment is a v3 key for the subscribe
 * form and will not work here.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "drafts");
const STATE = path.join(OUT, ".last-issue.json");
const API = "https://api.kit.com/v4/broadcasts";

const argv = process.argv.slice(2);
const DO_SEND = argv.includes("--send");
const WANTED = (() => {
  const i = argv.indexOf("--issue");
  return i === -1 ? "" : argv[i + 1] || "";
})();

/** How stale a draft may be. The board moves twice a week. */
export const MAX_DRAFT_AGE_DAYS = 7;
/** How recently an issue may have gone out. The site promises one a week. */
export const MIN_DAYS_BETWEEN_ISSUES = 5;

const days = (iso, nowMs) => Math.floor((nowMs - Date.parse(`${iso}T12:00:00Z`)) / 86_400_000);

/**
 * Everything that must be true before an email reaches a real person.
 *
 * A pure function, because the one thing that cannot be tested by running it
 * is the thing most worth testing. Each refusal names what a person would have
 * to do about it; "cannot send" with no reason is an instruction to override
 * the check.
 */
export function sendGuards({ draft, boardIds, expiredIds, lastSentAt, nowMs, hasKey }) {
  const stop = (why) => ({ ok: false, why });

  if (!hasKey) return stop("KIT_API_KEY is not set. It must be a v4 key — the v3 CONVERTKIT_API_KEY used by the subscribe form will not work.");
  if (!draft) return stop("no draft is waiting. Run `npm run draft:issue` first.");
  if (!draft.subject) return stop(`drafts/issue-${draft.draftedAt}.pending.json carries no subject. It predates the subject being recorded — re-run \`npm run draft:issue\`.`);

  const age = days(draft.draftedAt, nowMs);
  if (age > MAX_DRAFT_AGE_DAYS) {
    return stop(`the draft is ${age} days old and the board moves twice a week. Re-run \`npm run draft:issue\`.`);
  }

  const gone = (draft.ids || []).filter((id) => !boardIds.includes(id));
  if (gone.length) {
    return stop(`${gone.length} listing(s) in the draft are no longer on the board: ${gone.slice(0, 3).join(", ")}. Re-run \`npm run draft:issue\`.`);
  }

  const expired = (draft.ids || []).filter((id) => expiredIds.includes(id));
  if (expired.length) {
    return stop(`${expired.length} listing(s) in the draft have closed: ${expired.slice(0, 3).join(", ")}. Re-run \`npm run draft:issue\`.`);
  }

  const sent = Date.parse(lastSentAt || "");
  if (Number.isFinite(sent)) {
    const since = Math.floor((nowMs - sent) / 86_400_000);
    if (since < MIN_DAYS_BETWEEN_ISSUES) {
      return stop(`an issue went out ${since} day(s) ago, and the site promises at most one a week.`);
    }
  }

  return { ok: true, why: `draft ${draft.draftedAt}, ${(draft.ids || []).length} listing(s), all still open` };
}

async function main() {
  const now = Date.now();

  let pending = [];
  try {
    pending = (await fs.readdir(OUT)).filter((f) => f.endsWith(".pending.json")).sort();
  } catch {
    // No drafts directory; guarded below as "no draft is waiting".
  }

  // The same refusal mark-issue-sent.mjs makes, for the same reason: with two
  // waiting, which one you meant is not something this file can know.
  if (pending.length > 1 && !WANTED) {
    console.error(`\n  ${pending.length} drafts are waiting. Name one: npm run send:issue -- --issue ${pending[pending.length - 1].slice(6, 16)}\n`);
    process.exit(1);
  }

  const file = WANTED ? `issue-${WANTED}.pending.json` : pending[0];
  let draft = null;
  if (file && pending.includes(file)) {
    draft = JSON.parse(await fs.readFile(path.join(OUT, file), "utf8"));
  }

  const board = JSON.parse(await fs.readFile(path.join(ROOT, "src/content/stages.json"), "utf8")).items || [];
  const today = new Date(now).toISOString().slice(0, 10);
  const boardIds = board.map((s) => s.id);
  const expiredIds = board.filter((s) => s.deadline && s.deadline < today).map((s) => s.id);

  let lastSentAt = null;
  try {
    lastSentAt = JSON.parse(await fs.readFile(STATE, "utf8")).sentAt ?? null;
  } catch {
    // Never sent.
  }

  const verdict = sendGuards({
    draft,
    boardIds,
    expiredIds,
    lastSentAt,
    nowMs: now,
    hasKey: Boolean(process.env.KIT_API_KEY)
  });

  if (!verdict.ok) {
    console.error(`\n  Not sending: ${verdict.why}\n`);
    process.exit(1);
  }

  const html = await fs.readFile(path.join(OUT, `issue-${draft.draftedAt}.html`), "utf8");

  console.log(`\n  Subject : ${draft.subject}`);
  console.log(`  Listings: ${draft.ids.length}, all still open`);
  console.log(`  Guides  : ${(draft.slugs || []).length}`);
  console.log(`  Body    : drafts/issue-${draft.draftedAt}.html (${html.length} bytes)`);

  if (!DO_SEND) {
    console.log(`\n  Dry run. Nothing was sent. Add --send to send it.\n`);
    return;
  }

  /*
   * send_at is what sends it. Kit has no "send now" flag: a timestamp
   * schedules the broadcast and null saves a draft, so "now" is expressed as a
   * timestamp a minute out, which also leaves a last window to cancel in Kit.
   */
  const sendAt = new Date(now + 60_000).toISOString();

  const response = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Kit-Api-Key": process.env.KIT_API_KEY },
    body: JSON.stringify({
      subject: draft.subject,
      description: `Issue ${draft.draftedAt} — ${draft.ids.length} listings`,
      content: html,
      preview_text: draft.subject,
      public: false,
      published_at: new Date(now).toISOString(),
      send_at: sendAt,
      subscriber_filter: []
    })
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`\n  Kit refused the broadcast (HTTP ${response.status}): ${body.slice(0, 300)}\n`);
    process.exit(1);
  }

  /*
   * The ledger is written only after Kit has accepted it, and the pending file
   * removed only then too. The reverse order is how three September drafts
   * retired their listings without an email going out.
   */
  let coveredIds = [];
  let coveredSlugs = [];
  try {
    const state = JSON.parse(await fs.readFile(STATE, "utf8"));
    if (Array.isArray(state.coveredIds)) coveredIds = state.coveredIds;
    if (Array.isArray(state.coveredSlugs)) coveredSlugs = state.coveredSlugs;
  } catch {
    // First issue ever sent.
  }

  const mergedIds = [...new Set([...coveredIds, ...draft.ids])];
  const mergedSlugs = [...new Set([...coveredSlugs, ...(draft.slugs || [])])];
  await fs.writeFile(
    STATE,
    `${JSON.stringify({ sentAt: today, covered: mergedIds.length, coveredIds: mergedIds, coveredSlugs: mergedSlugs }, null, 2)}\n`
  );
  await fs.rm(path.join(OUT, file));

  console.log(`\n  Scheduled for ${sendAt} (one minute out, cancellable in Kit until then).`);
  console.log(`  Ledger updated: ${mergedIds.length} listing(s) covered.\n`);
}

if (process.argv[1] && process.argv[1].endsWith("send-issue.mjs")) {
  main().catch((error) => {
    console.error(`send-issue: ${String(error?.stack || error).slice(0, 400)}`);
    process.exit(1);
  });
}
