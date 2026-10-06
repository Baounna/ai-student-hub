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

const pending = (await fs.readdir(OUT))
  .filter((f) => f.endsWith(".pending.json"))
  .sort();

if (!pending.length) {
  console.log("\n  No draft is waiting to be marked sent. Run `npm run draft:issue` first.\n");
  process.exit(0);
}

const newest = pending[pending.length - 1];
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
