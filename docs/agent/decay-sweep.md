# Decay sweep — 8 November 2026

"Old" here is not file age. It is **a statement that was true when written and
has not been checked since.**

Eight categories were swept. Three produced work.

| # | Category | Result |
|---|---|---|
| 1 | Comments asserting a count | **5 fixed.** 57 comments mention a number; 52 are narration of a past bug and are correct as they stand |
| 2 | Frozen constants | **1 found.** `MAX_PER_COMPANY_ON_BOARD` is no longer slack |
| 3 | Names describing an abandoned intention | **Fixed.** `affiliateHref` → `toolHref`, `affiliate_click` → `tool_click`, 11 files |
| 4 | Dead values that look live | None beyond `readTime`, already removed |
| 5 | Rules pinned to someone else's URL shape | **No static work needed** — see below |
| 6 | Checks that cannot fail | None. Invariant 10 measures this and passes on all 16 |
| 7 | Abandoned artifacts | **1 removed.** No orphaned scripts: all 28 are referenced |
| 8 | Config nothing reads | None actionable. 101 env vars read; the gap against `.env.example` is agent configuration |

## The three that mattered

**3 — the names.** `affiliateHref` and `affiliate_click` described an intention
that was abandoned. A session read them, concluded the site took a commission,
and wrote that into a formal letter addressed to a university Dean. The
`/affiliate-disclosure` route keeps its name: that is the standard name for the
page that answers the question, and the honest answer there is "none".

**1 — the counts.** Five comments used a number as the reason for a decision
the code still makes, against a board that has moved from 81–104 rows to 88.
One was not stale but false: `find-stages.mjs` opened by saying every listing
was added by a person, hours after the script itself committed two.

**2 — the cap.** `MAX_PER_COMPANY_ON_BOARD = 12` was chosen as one above the
deepest employer. Wavestone reached twelve this morning, two of them added by
the finder's first successful run. The cap now binds. That is the rule working;
whether to raise it is a judgement about what the board is for, and it is the
owner's.

## Why category 5 needs no sweep

Nineteen `pathAllow` patterns are each a guess about a site nobody here
controls, and auditing them statically would be out of date the next time one
of those sites ships a redesign. The watchdog's per-source freshness check
already catches this dynamically — it is what found Anthropic Engineering
silent for 25 days after the posts moved to `/research/`. A standing alarm
beats a dated audit.

## What was left alone, deliberately

- 52 comments narrating past bugs with the numbers true at the time. Rewriting
  them would destroy the evidence they exist to carry.
- `docs/agent/epoch-*.md` — history, by the same rule.
- `/growth-sprint` literals — instructions on an internal, robots-disallowed page.
- `hasPaidLinks`, and the `/affiliate-disclosure` route.

## A note on method

Six detectors were written for this sweep. **Two of them were wrong on their
first run** — one flagged every script in the repository as orphaned, one
flagged correct code as a false claim — and one of the corrections I wrote
contained a fresh wrong number, "83 of 88" where the measured value is 77.

Each was caught by running it and reading the output rather than trusting it.
That is the whole method, and it is worth more than any single finding in this
file.
