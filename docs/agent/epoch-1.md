# Epoch 1 — batch A (listings)

## Delta against epoch 0

| | |
|---|---|
| FIXED | invariant 12's Internship Finder failure, at the cause |
| REGRESSED | none |
| NEW | one weakness recorded, not introduced: `orderStages` over-represents the deepest employer near the top |

## What was actually wrong

`npm run health` reported "Internship Finder — last 2d ago, failure". It had
also failed on 29 October. The job did not crash: **a test failed**, and the
workflow runs the suite before committing, so the run aborted and the listings
it had just found were thrown away. The board stops growing, and the only
symptom is a red workflow in a list nobody reads.

The test:

```
FAIL tests/stages-order.test.ts > does not let one employer own the opening rows
AssertionError: expected 3 to be less than or equal to 2
```

The `2` was derived, in the test's own comment, from "the largest employer
holds 10 of the 81 listings". A true ratio — frozen. The board is 86 now and
the finder adds more of the deepest employers every Thursday, so the day one of
them legitimately earned a third row in the opening twelve, the board stopped
growing.

Measured against `orderStages` directly, at four concentrations:

| employer share | fair share of 12 rows | actually in top 12 |
|---|---|---|
| 10 of 86 (today) | 1.40 | 2 |
| 15 of 100 | 1.80 | 3 |
| 25 of 100 | 3.00 | 4 |
| 40 of 120 | 4.00 | **7** |

So two separate things. The constant was stale — fixed, by deriving the ceiling
from the board as the comment always meant. And the interleave genuinely
over-concentrates: a deep employer's fractional positions all start near zero,
while a single-posting employer sits at the midpoint and cannot appear early at
all. The ceiling is its share rounded up, plus the one row of rounding slack
the interleave needs — which permits every legitimate case above and still
fails the 40-of-120 one. A second test pins that, so the guard cannot be
derived into uselessness.

The interleave weakness is **recorded, not fixed**: unblocking the finder and
rewriting the ordering are different changes and should not share a commit.

## Coupling discovered — A ↔ G

A guard and the data it guards are coupled. The finder's workflow runs the test
suite before committing, so a test carrying a frozen ratio does not fail
loudly — it silently stops the data growing. This is the same shape as the
batch B ↔ C coupling: a decision justified by a snapshot of the data, left in
place while the data moved.

## Left

**Engineering**: invariant 2 (`/blog` prints "72 cited sources" over per-card
chips summing to 106); one news source silent 21+ days; the `orderStages`
top-bias above.

**Owner**: unchanged — send the first newsletter, write or retire the February
briefs, decide the editorial alarm threshold.

## Verdict

**Converging.** One batch, one real cause fixed, no regressions, one coupling
documented. The finder will read green after its next scheduled run on
Thursday; until then invariant 12 stays amber by design, because claiming it
fixed before the job has actually run would be the same mistake this repo keeps
finding.
