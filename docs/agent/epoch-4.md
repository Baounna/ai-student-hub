# Epoch 4 — unit B-3, the source that went quiet

## Delta against epoch 3

| | |
|---|---|
| FIXED | Anthropic Engineering had produced nothing since 13 October; diagnosed and corrected |
| REGRESSED | none — 0 failing invariants, 908 tests |
| NEW | none |

## What was wrong

Anthropic moved its engineering posts from `/engineering/<slug>` to
`/research/<slug>`.

The section page is still at `/engineering` and still answers 200, so nothing
looked broken. The fetch succeeded. The anchors were read. Every one of them
was rejected for not beginning with `/engineering/`. `parsePageItems` returned
an empty array, the run printed a success line, and the entries already in
`auto-news.json` went on being served under a source that had stopped
producing.

Measured against the live page on 2026-11-08:

```
total anchors          : 60
match /engineering/... :  0
match the new rule     : 21
```

Twenty-one real articles, invisible for twenty-five days.

The fix accepts both prefixes — the old URLs still resolve and the items
already in the file carry them — and requires a hyphen in the slug, because
`/research/team` is a staff page and is the only `/research/` link on that page
without one.

## Why this epoch was possible at all

The brief written at the end of epoch 3 said `anthropic.com` is unreachable
from this machine and instructed closing the unit as network-blocked rather
than inferring the cause from the parser. **It was reachable this time** — the
earlier failure was transient. So the diagnosis is measured, not deduced: the
numbers above come from running the parser's own logic over the page it reads
in production.

Had it not been reachable, the honest outcome would have been a closed unit and
a written diagnosis, not a guess presented as a finding.

## What found it

The per-source freshness check added to the watchdog in an earlier epoch. The
file-level "Content freshness" check was green throughout, because eighteen
other sources kept `updatedAt` moving. This is the first time that check has
paid for itself, and it is the exact failure it was written for.

## Left

**Engineering**: seven invariants still hand-checked.

**Owner**: push — the Internship Finder runs Thursday 12 November against
`origin/main`, and its fix is in 16 unpushed commits; send the first
newsletter; write or retire the February briefs; decide the editorial alarm
threshold.

## Verdict

**Converging.** Four units closed in four epochs, no regressions in any of
them, and the alarms built in epoch 0 are now the things finding the defects.
