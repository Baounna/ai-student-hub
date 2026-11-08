# Epoch 5 — brief

Written at the end of epoch 4. Read `docs/agent/convergence.json` and
`docs/agent/epoch-4.md` first.

## Phase 1 — MEASURE

```
npm run invariants
npm run health
git fetch && git status -sb
gh run list --workflow=find-stages.yml --limit 3
gh run list --workflow=auto-news-agent.yml --limit 3
```

Two confirmations to look for, neither of which earlier epochs would claim in
advance:

1. **The Finder.** It runs Thursdays against `origin/main`. If the branch was
   pushed, Thursday's run is the confirmation epochs 1 and 3 both declined to
   make. If not, it failed a third time for the same reason.
2. **Anthropic Engineering.** Epoch 4 widened its path rule. If the branch was
   pushed, the twice-daily news job will have picked up the 21 articles and
   `npm run health` will no longer name that source. If it still does, the fix
   did not work and that is the unit for this epoch, not the one below.

## Phase 2 — ACT (one unit)

**Unit LOOP-2: promote an invariant out of `hand-checked`.**

Seven of twelve are hand-checked. Each is a place where the ledger records a
human's word rather than a measurement, and epoch 2 showed what that is worth.

Take **invariant 7** — disclosure matches reality — because it is the most
mechanical of the seven and the most costly to get wrong: it is the claim that
the site is in no affiliate programme and earns no commission.

- *Trigger*: `hasPaidLinks` (`src/config/site.ts:116`) and `GUIDE_EXISTS`
  (`src/lib/product.ts:17`) govern reader-facing claims on four pages, and
  nothing checks that the copy still agrees with the gates. A session earlier
  in this project read the names `affiliateHref` and `affiliate_click` and
  concluded the site took commission — it does not — and wrote that into a
  letter addressed to a university Dean.
- *Scope*: `scripts/invariants.mjs`; read-only over `src/config/site.ts`,
  `src/lib/product.ts`, and the pages that render their output.
- *Exit condition*: invariant 7 reports `pass` or `fail` from a measurement,
  never `hand-checked`, and fails if the disclosure wording and the gate
  disagree in either direction.
- *Test*: flip each gate in a fixture and assert the check goes red. A check
  that cannot fail is the bug this repo has fixed three times.

## Phase 3 — PROVE

Re-run both commands. Four checks clean, tests never below **908**. Write
`epoch-5.md`, update the ledger, write the epoch 6 brief. Separate commits.

## Standing rules

Evidence before theory. Record, don't fix, outside the unit. Nothing may cost
money. Never weaken the CSP, edit `auto-news.json` or `auto-tools.json`, push,
deploy, merge, send anything, regenerate the lockfile on macOS, or write
editorial content. The site is in no affiliate programme
(`src/config/site.ts:242-246`). AGENTS.md is binding. At most two subagents,
reading only.
