# Epoch 7 — unit WATCHDOG-1, and a bug of my own

## Delta against epoch 6

| | |
|---|---|
| CONFIRMED | Anthropic Engineering is back: 1 item → **11**, all discovered 2026-11-08, all under `/research/`. `npm run health` now reads "every source produced within 10 days". |
| FIXED | six checks recorded a skip as a pass; three checks returned an advisory that printed as a tick |
| REGRESSED | none |
| NEW | none |

## The confirmation epoch 4 would not claim

The news job ran at 13:18 UTC, minutes after the push, and picked up the
widened path rule. The source that had been silent for twenty-five days now
carries eleven articles. `npm run health` went from four items needing
attention to three, and the remaining three are two owner decisions and the
Finder, which runs Thursday.

That is what a fix looks like when it is allowed to prove itself rather than be
announced.

## Unit WATCHDOG-1

Six `record()` sites reported "I could not look" as a pass:

```
Stages list          no entries yet
Employer boards      no board report to read yet
Employer boards      the last board report predates this check
Scheduled workflows  could not read .github/workflows
Workflow health      gh CLI unavailable here
Affiliate links      not configured in this environment
```

Each printed ✔ and counted toward "Watchdog: all checks passed". A run in which
three checks never executed was indistinguishable from one in which they all
succeeded. The two workflow ones are the dangerous pair — they are how the
watchdog would report a machine that cannot see GitHub as a healthy site.

There is now a fourth status. `skip()` records `ok: true` so a missing gh CLI
does not turn a run red — it is not a failure, it is simply not a pass — and
the table, the headline and the console line all say which. The headline can no
longer read "All checks passed" over a run that skipped three.

This is the same distinction `npm run invariants` draws with `hand-checked`,
and the one this file already argues for elsewhere: `checkDegradedSources`
refuses to read a missing field as health.

## The bug that was mine

Reading the summary logic to add the fourth status, I found a third: this
file's advisory convention is `ok: false, advisory: true`, and the three checks
I added in epochs 0–1 — newsletter cadence, editorial freshness, quiet news
sources — returned `ok: true, advisory: true`. That prints a tick and lands in
neither bucket of the summary, so **three things waiting on a person were
counted toward "all checks passed"** for seven epochs.

Running it now: `Watchdog: 2 check(s) failed. 2 waiting on you`. The phrase "2
waiting on you" had never appeared before, because the checks that produce it
were being counted as passes.

Two tests asserted the wrong convention and failed when it was corrected, which
is what they are for. They now carry the reasoning rather than the number.

## Left

**Engineering**: five invariants hand-checked (1, 2, 6, 9, 12). Nothing
reader-visible is known to be wrong.

**Owner**: send the newsletter (Cnexia, Rabat closes 10 November); write or
retire the February briefs; decide the editorial alarm threshold.

**Pending**: the Internship Finder, Thursday 12 November.

## Verdict

**Converging.** Seven units, seven epochs, zero regressions. One of the two
pending confirmations has landed. The loop is one scheduled run from its own
stop condition.
