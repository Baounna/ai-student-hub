import fs from "node:fs/promises";
import path from "node:path";

/**
 * Promote the most recent draft from "written" to "sent".
 *
 * Kept separate from draft-issue.mjs because the send itself is manual -- the
 * draft produces HTML a person pastes into Kit -- and the two were the same
 * action, so a draft that was generated and never sent still retired its
 * listings. Three September drafts had done exactly that, and no issue had
 * ever gone out.
 *
 * Nothing here contacts Kit. It records a send that already happened, and the
 * person running it is the evidence that it did.
 */
const OUT = path.join(process.cwd(), "drafts");
const STATE = path.join(OUT, ".last-issue.json");

const argv = process.argv.slice(2);
const wanted = (() => {
  const i = argv.indexOf("--issue");
  return i === -1 ? "" : argv[i + 1] || "";
})();

const pending = (await fs.readdir(OUT))
  .filter((f) => f.endsWith(".pending.json"))
  .sort();

if (!pending.length) {
  console.log("\n  No draft is waiting to be marked sent. Run `npm run draft:issue` first.\n");
  process.exit(0);
}

/**
 * With two drafts waiting, which one was sent is not something this file can
 * know, and the last one by filename is the wrong guess as often as not.
 *
 * It happened: a draft from 6 October sat unsent for a month while the board
 * moved on, five of its twelve listings closed, and a fresh draft was written
 * on 8 November. Pasting the October HTML into Kit and running this script
 * would have retired the November listings -- so those twelve would never be
 * offered again -- and left the five dead ones marked unsent, ready to be
 * offered a second time. Nothing would have reported either half of that.
 *
 * So it asks instead. Naming the issue costs one flag and makes the person who
 * sent it the one who says which it was, which is the same principle that put
 * this script in a separate file from the draft in the first place.
 */
let newest;
if (wanted) {
  const named = `issue-${wanted}.pending.json`;
  if (!pending.includes(named)) {
    console.error(`\n  No draft is waiting for ${wanted}. Waiting: ${pending.map((f) => f.slice(6, 16)).join(", ")}.\n`);
    process.exit(1);
  }
  newest = named;
} else if (pending.length > 1) {
  console.error(`\n  ${pending.length} drafts are waiting, so which one you sent cannot be guessed:\n`);
  for (const f of pending) console.error(`    ${f.slice(6, 16)}   drafts/issue-${f.slice(6, 16)}.html`);
  console.error(`\n  Name the one you sent:  npm run draft:sent -- --issue ${pending[pending.length - 1].slice(6, 16)}`);
  console.error(`  A draft you are not going to send can simply be deleted.\n`);
  process.exit(1);
} else {
  newest = pending[0];
}

const { draftedAt, ids = [], slugs = [] } = JSON.parse(await fs.readFile(path.join(OUT, newest), "utf8"));

let coveredIds = [];
let coveredSlugs = [];
try {
  const state = JSON.parse(await fs.readFile(STATE, "utf8"));
  if (Array.isArray(state.coveredIds)) coveredIds = state.coveredIds;
  if (Array.isArray(state.coveredSlugs)) coveredSlugs = state.coveredSlugs;
} catch {
  // No ledger yet: this is the first issue ever sent.
}

const mergedIds = [...new Set([...coveredIds, ...ids])];
const mergedSlugs = [...new Set([...coveredSlugs, ...slugs])];
const today = new Date().toISOString().slice(0, 10);

await fs.writeFile(
  STATE,
  `${JSON.stringify({ sentAt: today, covered: mergedIds.length, coveredIds: mergedIds, coveredSlugs: mergedSlugs }, null, 2)}\n`
);
// Removed, so the same issue cannot be marked sent twice and quietly retire a
// later draft's listings along with it.
await fs.rm(path.join(OUT, newest));

console.log(`\n  Marked the ${draftedAt} issue as sent.`);
console.log(`  ${ids.length} listing(s) and ${slugs.length} guide(s) recorded; ${mergedIds.length} covered in total.\n`);
