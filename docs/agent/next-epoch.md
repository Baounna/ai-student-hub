# Epoch 6 — brief

Written at the end of epoch 5. Read `docs/agent/convergence.json` and
`docs/agent/epoch-5.md` first.

## Phase 1 — MEASURE

```
npm run invariants
npm run health
git fetch && git status -sb
gh run list --workflow=find-stages.yml --limit 3
gh run list --workflow=auto-news-agent.yml --limit 3
```

Two confirmations earlier epochs refused to claim in advance:

1. **The Finder** runs Thursdays against `origin/main`. Pushed → Thursday's run
   is the confirmation epochs 1 and 3 both declined. Not pushed → it failed a
   third time for the same reason, and that is the headline.
2. **Anthropic Engineering.** If pushed, the twice-daily news job should have
   picked up the 21 articles and `npm run health` should no longer name that
   source. If it still does, the epoch 4 fix did not work, and **that** is this
   epoch's unit, not the one below.

## Phase 2 — ACT (one unit)

**Unit LOOP-3: promote invariant 10 out of `hand-checked`.**

Invariant 10 is "every alarm can go red" — the one this repo has broken three
times, under three different names. It is currently hand-checked with the
evidence "checks added in epochs 0–1 have tests proving they can fail; older
checks unaudited". That last word is the problem.

- *Trigger*: `scripts/watchdog.mjs` has roughly fifteen checks. Some have pure
  verdict functions with tests (`scheduledWorkflowProblems`,
  `quietNewsSources`, `newsletterCadenceVerdict`, `editorialAgeVerdict`); the
  rest were never audited for whether a failing condition can actually reach
  `record(..., false, ...)`.
- *Scope*: `scripts/invariants.mjs`, `scripts/watchdog.mjs` (read-only unless a
  check is found that genuinely cannot fail), and the watchdog tests.
- *Exit condition*: invariant 10 reports `pass` or `fail` from a measurement.
  A reasonable measurement: every `record(` call site with a literal `true` as
  its `ok` argument and no sibling call able to pass `false` is a check that
  cannot go red — list them. `pass` means every check has at least one path to
  red.
- *Test*: a fixture with one always-green check must make the measurement fail.

If the measurement finds a check that genuinely cannot fail, **record it and
stop** — fixing it is the next unit, not this one.

## Phase 3 — PROVE

Re-run both commands. Four checks clean, tests never below **919**. Write
`epoch-6.md`, update the ledger, write the epoch 7 brief. Separate commits.

## Standing rules

Evidence before theory — look at a finding before believing it; the first
version of a measurement has now been wrong two epochs running. Record, don't
fix, outside the unit. Nothing may cost money. Never weaken the CSP, edit
`auto-news.json` or `auto-tools.json`, push, deploy, merge, send anything,
regenerate the lockfile on macOS, or write editorial content. The site is in no
affiliate programme (`src/config/site.ts:242-246`). AGENTS.md is binding. At
most two subagents, reading only.
