#!/usr/bin/env node
/**
 * Run the test suite as if it were several future dates.
 *
 * On 28 October a listing's deadline lapsed. The next morning
 * tests/stages-order.test.ts failed -- it had gathered every dated listing,
 * closed ones included, and demanded ascending deadlines, while getStages
 * deliberately sorts closed rows last. Correct behaviour, read as a failure.
 *
 * That one wrong assertion stopped two scheduled agents for two days. The
 * internship finder found 23 candidates and committed none; the news agent
 * failed three runs and the site's content aged to 41 hours against a 72-hour
 * limit. Both run `npm test` before committing -- a gate added deliberately,
 * and the right trade -- which is exactly why a test that is wrong about a date
 * is not a test problem but an outage.
 *
 * This sweep found five more of them after that one was fixed:
 *   - recently-added: asserted today's board was fresh. Would have failed on
 *     10 November, and the failure is a deadlock -- a stale board blocks the
 *     gate that the Monday check needs to pass in order to refresh the board.
 *   - stage-digest x3: the digest window is three weeks, so the assertions
 *     emptied out by 30 November.
 *   - stages-a11y: required at least one dated listing, and getStages retires a
 *     listing thirty days after its deadline, so zero by 25 December.
 *
 * Known false positive: tests/draft-issue.test.ts spawns the script as a
 * subprocess, which keeps the real clock, so the faked date in the parent never
 * matches the filename the child wrote. Not a time bomb.
 *
 *   npm run test:clock
 *   npm run test:clock -- 2027-06-01 2028-01-01
 */
import { spawnSync } from "node:child_process";

const DEFAULT_DATES = ["2026-11-11", "2026-11-30", "2026-12-25", "2027-02-15", "2027-10-30"];
const KNOWN_FALSE_POSITIVES = ["tests/draft-issue.test.ts"];

const dates = process.argv.slice(2).filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const run = dates.length ? dates : DEFAULT_DATES;

let realFailures = 0;
for (const date of run) {
  const result = spawnSync(
    "npx",
    ["vitest", "run", "--config", "vitest.clock.config.ts"],
    { env: { ...process.env, FAKE_TODAY: date }, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }
  );
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const failed = [...out.matchAll(/FAIL\s+(tests\/[\w./-]+)/g)].map((m) => m[1]);
  const unexpected = [...new Set(failed)].filter((f) => !KNOWN_FALSE_POSITIVES.includes(f));
  const summary = out.match(/^\s*Tests\s+.+$/m)?.[0]?.trim();
  if (!summary) {
    // No summary means vitest never reported, so there is nothing to conclude.
    // Counting that as a clean date is how a broken harness reads as green.
    console.log(`\n  ${date}  the suite did not report -- sweep cannot tell`);
    console.log(out.trim().split("\n").slice(-12).map((l) => `      ${l}`).join("\n"));
    realFailures += 1;
    continue;
  }

  console.log(`\n  ${date}  ${summary}`);
  for (const f of unexpected) console.log(`    TIME BOMB  ${f}`);
  for (const f of [...new Set(failed)].filter((f) => KNOWN_FALSE_POSITIVES.includes(f))) {
    console.log(`    (known false positive, subprocess clock)  ${f}`);
  }
  realFailures += unexpected.length;
}

console.log(
  realFailures === 0
    ? "\n  No test depends on today's date beyond the known subprocess case.\n"
    : `\n  ${realFailures} failure(s): a test that depends on today's date, or a date the sweep could not run.\n`
);
process.exit(realFailures === 0 ? 0 : 1);
