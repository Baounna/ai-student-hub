# Epoch 7 — brief

Written at the end of epoch 6. Read `docs/agent/convergence.json` and
`docs/agent/epoch-6.md` first.

**Before choosing a unit, read the stop condition.** Epoch 6 reported the loop
as close to converged. If phase 1 confirms both pending runs and finds nothing
new, the honest outcome of epoch 7 is to **declare convergence and stop**, not
to find work.

## Phase 1 — MEASURE

```
npm run invariants
npm run health
git fetch && git status -sb
gh run list --workflow=find-stages.yml --limit 3
gh run list --workflow=auto-news-agent.yml --limit 3
```

Two confirmations that every earlier epoch refused to claim in advance, both
now possible because the branch was pushed on 8 November:

1. **The Internship Finder** failed 29 October and 5 November on a frozen
   ratio in a test. The fix is on `main` now. Thursday 12 November is the first
   run that can confirm it. If it succeeded, the board grew for the first time
   in three weeks — say so plainly, it is the most consequential thing in this
   loop.
2. **Anthropic Engineering.** Epoch 4 widened its path rule after the posts
   moved to `/research/<slug>`. The news job runs twice daily. If `npm run
   health` no longer names that source, the 21 articles are back. If it still
   does, **that is epoch 7's unit** — the fix did not work.

## Phase 2 — ACT (only if phase 1 gives you a reason)

If both confirmations are good and nothing is failing, do **not** invent a
unit. Write `epoch-7.md` saying the loop converged, list what is left for the
owner, and stop.

If you need one, the ranked candidates are:

- **WATCHDOG-1**: `scripts/watchdog.mjs:1175` records a *skipped* check as
  green — `record("Affiliate links", true, "not configured … skipped")`. Give
  the watchdog the third status the invariants script already has, or make the
  skip advisory. Recorded in epoch 6.
- **LOOP-4**: promote invariant 1, 2, 6, 9 or 12 out of `hand-checked`. Note
  that epoch 2 already tried and failed to automate invariant 2, and the reason
  is written down — do not re-attempt it naively.

## Phase 3 — PROVE

Four checks clean, tests never below **927**. Write `epoch-7.md`, update the
ledger. Write an epoch 8 brief **only if there is a reason to run one**; if the
loop converged, say so instead.

## Standing rules

Evidence before theory — look at a finding before believing it. The first
version of a measurement has now been wrong three epochs running, and each
time looking at it was what saved the result. Record, don't fix, outside the
unit. Nothing may cost money. Never weaken the CSP, edit `auto-news.json` or
`auto-tools.json`, deploy, merge, send anything, regenerate the lockfile on
macOS, or write editorial content. Pushing is the owner's call and he gave it
once, on 8 November, for that push only. The site is in no affiliate programme
(`src/config/site.ts:242-246`). AGENTS.md is binding. At most two subagents,
reading only.
