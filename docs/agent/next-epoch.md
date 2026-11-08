# Epoch 9 — confirmation only

**Do not run this before Thursday 12 November 2026.** There is nothing to
confirm until the Internship Finder has run, and nothing else is known to be
wrong. Running it earlier means inventing work.

Read `docs/agent/convergence.json` and `docs/agent/epoch-8.md` first.

## The only question

```
gh run list --workflow=find-stages.yml --limit 3
npm run invariants
npm run health
node scripts/watchdog.mjs
git fetch && git status -sb
```

The Finder failed on 29 October and 5 November, both times because a test
capped one employer at 2 of the opening 12 rows — a ratio true of an 81-listing
board, frozen while the board grew. The workflow runs the suite before
committing, so the run aborted and the listings it had just found were thrown
away. The fix has been on `main` since 8 November.

- **Succeeded** → the board grew for the first time since 29 October. Say it
  plainly. Three epochs declined to claim it in advance; this is the epoch that
  gets to. Then declare the loop converged, write `epoch-9.md`, and **write no
  epoch 10 brief**.
- **Failed** → read `gh run view <id> --log` before theorising. That is how
  epoch 1 found the cause when four audit agents and the watchdog had all
  missed it. The fix is then epoch 9's unit.

## If it converged

Say so, and stop. The remaining items belong to the owner and no epoch can
close them:

- send the first newsletter — nothing has ever been sent, and `/campus`
  promises students it will be
- write or retire the nine February briefs
- decide whether `WATCHDOG_EDITORIAL_FAIL_DAYS` should rise, or accept a
  permanently red editorial alarm
- turn on Vercel Web Analytics

Five invariants remain `hand-checked` (1, 2, 6, 9, 12). Promoting them is
available work, not needed work — and invariant 2 was attempted in epoch 2 and
the reason it cannot be automated is written down. Do not re-attempt it naively.

## Standing rules

Evidence before theory — the first description of a problem has now been wrong
four epochs running. Record, don't fix, outside the unit. Nothing may cost
money. Never weaken the CSP, edit `auto-news.json` or `auto-tools.json`,
deploy, merge, send anything, regenerate the lockfile on macOS, or write
editorial content. Pushing is the owner's call. The site is in no affiliate
programme (`src/config/site.ts:242-246`). AGENTS.md is binding.
