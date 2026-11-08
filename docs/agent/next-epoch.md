# Epoch 8 — brief

Written at the end of epoch 7. Read `docs/agent/convergence.json` and
`docs/agent/epoch-7.md` first.

**This is expected to be the last epoch.** Epoch 7 left one confirmation
outstanding and no known reader-visible defect. If phase 1 confirms it and
finds nothing new, declare convergence and stop. Do not invent a unit.

## Phase 1 — MEASURE

```
npm run invariants
npm run health
node scripts/watchdog.mjs
git fetch && git status -sb
gh run list --workflow=find-stages.yml --limit 3
```

**The Internship Finder is the whole question.** It failed 29 October and 5
November on a frozen ratio in a test; the fix has been on `main` since 8
November. Thursday 12 November is the first run that can confirm it.

- Succeeded → the board grew for the first time in three weeks. Say it plainly;
  it is the most consequential thing this loop produced, and three epochs
  declined to claim it in advance.
- Failed → read `gh run view <id> --log` before theorising. That is how epoch 1
  found the cause when four audit agents and the watchdog had missed it, and
  the fix would then be epoch 8's unit.

Also confirm the watchdog's new fourth status behaves in CI, where the gh CLI
and the workflow directory are present — the six skip sites should not fire
there, and the headline should read "All checks passed" rather than
"Everything checked passed — N not checked".

## Phase 2 — ACT (only with a reason)

If something is failing, fix it. Otherwise the ranked candidates, none urgent:

- **LOOP-4**: promote invariant 1, 6, 9 or 12 out of `hand-checked`. Invariant
  2 was tried in epoch 2 and the reason it cannot be automated is written down
  — do not re-attempt it naively.
- **C-2**: `readTime` literals in `posts.ts` / `posts-cs.ts` contradict what
  the page renders (`"18 min read"` where the page computes and shows "5 min
  read"). Dead, but misleading to a reader of the source. Deleting the field is
  mechanical and touches ~24 objects.

## Phase 3 — PROVE

Four checks clean, tests never below **931**. Write `epoch-8.md`, update the
ledger. If the loop converged, say so and write **no** epoch 9 brief — an
unnecessary brief is an invitation to invent work.

## Standing rules

Evidence before theory — the first version of a measurement has been wrong
three epochs running, and looking at the finding is what saved each one.
Record, don't fix, outside the unit. Nothing may cost money. Never weaken the
CSP, edit `auto-news.json` or `auto-tools.json`, deploy, merge, send anything,
regenerate the lockfile on macOS, or write editorial content. Pushing is the
owner's call; he has given it twice, each time for that push only. The site is
in no affiliate programme (`src/config/site.ts:242-246`). AGENTS.md is binding.
At most two subagents, reading only.
