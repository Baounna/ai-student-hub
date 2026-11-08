# Epoch 6 — unit LOOP-3, measuring invariant 10

## Delta against epoch 5

| | |
|---|---|
| MEASURED | invariant 10 moved from `hand-checked` to `pass`. Five hand-checked remain, down from six. |
| FIXED | none — the alarms were sound |
| REGRESSED | none |
| NEW | one finding recorded: a skip reported as a pass |

## Why this one

Invariant 10 is "every alarm can go red" — the bug this repository has fixed
three times under three names, one of whose commits is called exactly that. It
was recorded as hand-checked with the evidence "checks added in epochs 0–1 have
tests proving they can fail; **older checks unaudited**". That last word was
the whole problem, and it guarded the alarms that found the Internship Finder
failure, the dead Anthropic feed and the /blog double count.

Result: **all 16 watchdog checks have a path to red.**

## The measurement was wrong first, for the third epoch running

A first version matched only `record("Literal name", …)` sites and reported
**"Affiliate links" as unable to fail.** That is wrong. The check routes
through `checkVerifyScript(label, script)`, which records under its own
parameter — `record(label, true, …)` on success, `record(label, false, …)` on
failure. Four of the watchdog's checks never appear beside a literal name at
all.

So the measurement resolves helpers: a name handed to a function that records
under an identifier inherits that function's red-ability. A fixture proves this
cannot become laundering — a helper that is itself always green still reports
its callers as stuck.

Three epochs, three first-draft measurements that were wrong, each caught by
looking at the finding instead of believing it. That is now the most reliable
pattern in this loop, and it is worth more than any individual fix in it.

## Recorded, not fixed

`scripts/watchdog.mjs:1175` records **"Affiliate links" as green when the check
is skipped**: `record("Affiliate links", true, "not configured in this
environment — skipped")`. The alarm can fire, so invariant 10 passes honestly.
But a skip is not a pass, and this file's own comments argue that elsewhere —
"absence of evidence is not evidence" is the reason `checkDegradedSources`
refuses to read a missing field as health.

This is the same distinction `npm run invariants` already makes with its third
status. The watchdog has only green, red and advisory; a skipped check takes
green. Fixing it means either recording the skip as advisory, or giving the
watchdog the third status the invariants script has.

Outside this unit — the brief said record and stop.

## Left

**Engineering**: five invariants hand-checked (1, 2, 6, 9, 12); the skip-as-pass
above.

**Owner**: send the first newsletter; write or retire the February briefs;
decide the editorial alarm threshold; turn on Vercel Web Analytics.

## Verdict

**Converging, and close to converged.** Six units, six epochs, zero
regressions. Every reader-visible defect the loop has found is fixed and
deployed. What remains is either the owner's to decide or waiting on a
scheduled run — which is this loop's own stop condition.
