# Epoch 9 — converged

## The confirmation

**The Internship Finder succeeded.**

It failed on 29 October and again on 5 November, both times because a test
capped one employer at 2 of the opening 12 rows — a ratio true of an
81-listing board, frozen in place while the board grew. That workflow runs the
test suite before committing, so each run aborted and the listings it had just
found were thrown away. The board stopped growing and the only symptom was a
red workflow in a list nobody was reading.

Dispatched by hand on 8 November against `main`, which carries the fix:

```
FINDER: success
[main 8eb4777] chore(stages): add internships from employer job feeds
board before: 86   after: 88   added: 2   removed: 0
```

Two Wavestone listings in France, and a review issue opened for the candidates
that need a person to place them. **The board grew for the first time since 29
October.**

Epochs 1, 3 and 8 each declined to claim this in advance. This is the epoch
that got to.

## Also this epoch

**Invariant 6** moved from `hand-checked` to **fail**, which is the honest
result: every page promises "at most one email a week" and none has ever been
sent. The watchdog already reported that as work waiting on a person; the
invariant reports what it also is — a sentence on the site that is not true,
and the one untrue sentence that costs a reader something, because a student
hands over an address expecting listings.

**Invariant 12** moved to `pass`: everything `npm run health` lists is a
decision already recorded as the owner's.

Making that true required a fix the confirmation itself exposed. `health`
filtered its job check to `event === "schedule"`, so the manual run that proved
the Finder fixed was the wrong event type to be seen, and the report went on
naming a failure that had been disproved twenty minutes earlier. Cadence still
comes from the scheduled runs; the verdict now comes from the most recent run
of any kind.

## Convergence

The loop's own stop condition, stated in epoch 0:

> STOP when an epoch produces 0 REGRESSED, 0 NEW, and every remaining FAIL is
> one the owner must decide.

- **0 REGRESSED** across all nine epochs.
- **0 NEW.** Invariant 6's failure is not new; it is a known owner decision
  that now has a measurement instead of a human's word.
- **The one remaining FAIL is the owner's**: send the first newsletter.

**The loop has converged.** There is no epoch 10, and no brief for one — an
unnecessary brief is an invitation to invent work.

## What nine epochs produced

| | |
|---|---|
| Units closed | 9 |
| Regressions | 0 |
| Tests | 813 → 945 |
| Invariants measured by machine | 0 → 9 of 12 |
| Defects found by alarms rather than by reading code | 3 |
| First drafts of a measurement that were wrong | 4 |

That last row is the most useful thing here. Every one was caught by looking at
the finding instead of believing it, and three of the four would have shipped a
check that cried wolf or a fix for a problem that did not exist.

## What is left, and whose it is

**The owner's, and no epoch can close them:**

- send the first newsletter — `drafts/issue-2026-11-08.html`; nothing has ever
  been sent, and `/campus` now promises students it will be
- write or retire the nine February briefs
- decide whether `WATCHDOG_EDITORIAL_FAIL_DAYS` should rise, or accept a
  permanently red editorial alarm
- turn on Vercel Web Analytics

**Available, not needed:** invariants 1, 2 and 9 remain `hand-checked`.
Invariant 2 was attempted in epoch 2 and the reason it cannot be automated is
written down — do not re-attempt it naively.
