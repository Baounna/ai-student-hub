# Epoch 3 — brief

Written at the end of epoch 2, while the evidence was fresh. Read
`docs/agent/convergence.json` and `docs/agent/epoch-2.md` first.

## Phase 1 — MEASURE

```
npm run invariants        # 0 failing, 7 hand-checked as of epoch 2
npm run health            # 1 engineering item expected: a quiet news source
git fetch && git status -sb
```

Diff against `convergence.json`. A `pass` that was `hand-checked` is
**MEASURED**, not FIXED.

Expect one change you did not make: the Internship Finder runs Thursdays. If it
has run since epoch 1 and succeeded, that is the confirmation epoch 1
deliberately did not claim.

## Phase 2 — ACT (one unit)

**Unit B-2: the interleave that puts one employer at the top.**

- *Trigger*: measured in epoch 1 against `orderStages` directly — the deepest
  employer takes 2 of the opening 12 where 1.40 is its share (10 of 86), 3
  where 1.80 is fair (15 of 100), and **7 where 4.00 is fair** (40 of 120). A
  deep employer's fractional positions all start near zero, while an employer
  with one posting sits at the midpoint and cannot appear early at all.
- *Scope*: `oneEmployerAtATime` and `orderStages` in `src/content/stages.ts`;
  `tests/stages-order.test.ts`.
- *Exit condition*: at every share measured above, the deepest employer holds
  no more than `ceil(fair share) + 1` of the opening twelve — and no two
  consecutive rows share an employer, which is the property the current
  interleave was written to get and must not lose.
- *Test*: the existing "still catches an employer that actually owns the top"
  test asserts the ceiling is **exceeded** at 40 of 120. When the interleave is
  fixed, that test must be inverted to assert the ceiling now holds, and the
  table of four shares measured as a regression guard.

**Do not** touch `readTime` literals, post dates, or article text. One unit per
epoch.

## Phase 3 — PROVE

Re-run `npm run invariants` and `npm run health`. Four checks clean, tests
never below **903**. Verify `/fr/stages` and `/en/stages` on a production
server. Write `epoch-3.md`, update the ledger, and **write the epoch 4 brief**.
Separate commits for separate concerns.

## Standing rules

Evidence before theory — anything involving a scheduled job starts with
`gh run view <id> --log`. Record, don't fix, when a finding is outside the
unit. Nothing may cost money. Never weaken the CSP, edit `auto-news.json`,
push, deploy, merge, send, regenerate the lockfile on macOS, or write editorial
content. The site is in no affiliate programme. AGENTS.md is binding: read
`node_modules/next/dist/docs/` before using a framework API.

At most two subagents, reading only.
