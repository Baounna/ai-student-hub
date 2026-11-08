# Epoch 4 — brief

Written at the end of epoch 3. Read `docs/agent/convergence.json` and
`docs/agent/epoch-3.md` first.

## Phase 1 — MEASURE

```
npm run invariants        # expect 0 failing, 7 hand-checked
npm run health
git fetch && git status -sb
gh run list --workflow=find-stages.yml --limit 3
```

**Check the Finder first.** If the branch was pushed, Thursday's run is the
confirmation epochs 1 and 3 both declined to claim. If it was not pushed, the
run failed a third time for the same reason, and that is the single most
valuable thing to tell the owner — ahead of this epoch's unit.

## Phase 2 — ACT (one unit)

**Unit B-3: the news source that has gone silent.**

- *Trigger*: `npm run health` and the daily watchdog both report one source
  quiet for 21+ days — Anthropic Engineering, last item 13 October. The
  per-source check added in an earlier epoch found it; nothing has diagnosed
  it. A page that redesigns its HTML stops matching `parsePageItems`, returns
  an empty array, and the run still prints success.
- *Scope*: `src/lib/live-news.ts` (`FEED_SOURCES`, `parsePageItems`),
  `scripts/auto-news-agent.mjs`. **Not** `src/content/auto-news.json` — machine-written.
- *Exit condition*: either the source produces items again, or it is removed
  from `FEED_SOURCES` with the reason recorded, or — if the page cannot be
  reached from this machine, which is likely — the diagnosis is written down
  and the unit is closed as owner-blocked rather than guessed at.
- *Test*: whichever outcome, the per-source freshness check must still be able
  to go red. If a source is removed, assert the removal is deliberate and not
  silent.

Note: `anthropic.com` and `github.com` are unreachable from the owner's
machine. If the page cannot be fetched, say so and close the unit as
network-blocked — **do not** infer the cause from the parser alone and present
it as fact.

## Phase 3 — PROVE

Re-run `npm run invariants` and `npm run health`. Four checks clean, tests
never below **903**. Write `epoch-4.md`, update the ledger, write the epoch 5
brief. Separate commits for separate concerns.

## Standing rules

Evidence before theory. Record, don't fix, outside the unit. Nothing may cost
money. Never weaken the CSP, edit `auto-news.json` or `auto-tools.json`, push,
deploy, merge, send anything, regenerate the lockfile on macOS, or write
editorial content. The site is in no affiliate programme
(`src/config/site.ts:242-246`). AGENTS.md is binding: read
`node_modules/next/dist/docs/` before using a framework API. At most two
subagents, reading only.
