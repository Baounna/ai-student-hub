# Epoch 3 — unit B-2, the interleave

## Delta against epoch 2

| | |
|---|---|
| FIXED | `orderStages` gave the deepest employer the top of the page; it now gets its share |
| REGRESSED | none — 0 failing invariants, 903 tests |
| NEW | none from the code. One fact from the measurement, below, which is not a code defect |

## The unit

Epoch 1 measured the old interleave and recorded what it did rather than
guessing. Epoch 3 replaced it and measured the same four concentrations again:

| employer share | fair share of 12 rows | before | after |
|---|---|---|---|
| 10 of 86 | 1.40 | 2 | **1** |
| 15 of 100 | 1.80 | 3 | **2** |
| 25 of 100 | 3.00 | 4 | **3** |
| 40 of 120 | 4.00 | **7** | **4** |

Why the old one failed is worth keeping. Giving each posting a fractional
position within its own employer's run — `(index + 0.5) / count` — spreads each
employer evenly over *its own run*, which is not the same as spreading it over
the page. An employer with 40 of 120 postings has its first seven at 0.0125
through 0.1625, every one of them below 0.1667, the earliest position any
three-posting employer can reach. So the top of the page belonged to whoever
had the most listings, and an employer with a single posting could not appear
in the first half of the list at all.

What a reader is owed is proportionality at every depth: in any first k rows,
an employer with n of N postings should hold about k·n/N. That is a
**placement**, not a sort key — sorting by target position just bunches every
employer that shares one. Each row now goes to whoever is furthest below the
share they should have had by then. An employer that has just been placed drops
below the others by construction, which is what keeps two of the same name
apart without a rule saying so.

On the live board: 11 distinct employers in the opening 12, worst Capgemini ×2
against a share of 1.40. The first rows read Rabat, Lyon, Puteaux, Sunnyvale,
Munich, Mont-de-Marsan, San Francisco, Santa Clara, Grenoble.

The test that pinned the old behaviour has been **inverted**, as epoch 2's
brief required: it asserted the ceiling was exceeded at 40 of 120; it now
asserts the ceiling holds, pins all four counts exactly so a later change
cannot drift back while staying under the ceiling, and re-checks on every case
that no two consecutive rows share an employer and that every listing survives.

## The fact the measurement surfaced

**The Internship Finder has not run since epoch 1 and will fail again.** Its
last run was Thursday 5 November; it runs Thursdays. Epoch 1 fixed the cause —
but that fix is in the local repository, 14 commits ahead of `origin/main`. The
workflow runs against `main`. Unless the branch is pushed before Thursday 12
November, the job fails a third time and the listings it finds are thrown away
again.

This is not an epoch finding and no code change can close it. It is recorded
here because epoch 1 deliberately declined to claim the fix worked before the
job had run, and the job cannot run on a fix it cannot see.

## Left

**Engineering**: one news source silent 21+ days; seven invariants still
hand-checked.

**Owner**: push (see above); send the first newsletter; write or retire the
February briefs; decide the editorial alarm threshold.

## Verdict

**Converging.** Three units closed across three epochs, zero regressions, and
the one weakness epoch 1 recorded rather than fixed is now fixed and measured
against the numbers epoch 1 wrote down.
