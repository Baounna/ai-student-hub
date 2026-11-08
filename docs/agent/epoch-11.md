# Epoch 11 — claims that outlived their evidence

## Trigger

Not invented. Kit's broadcast list, opened to check the first send had worked,
showed **two** issues: one on 21 September 2026 and one on 8 November. Four
source comments in this repository assert that none has ever gone out.

Each was true when written. None was true by the time it was read.

## The unit

```
scripts/draft-issue.mjs:5     "Zero have ever been sent."
scripts/draft-issue.mjs:257   "no issue has ever gone out"
scripts/watchdog.mjs:261      "no issue has ever been sent"
src/i18n/dictionaries.ts:165  "nothing sends one — the sending does not"
```

That last one also carried an instruction — *"Restore the cadence the week
something actually sends on a schedule"* — which has now come due and is
answered in place: sending exists, and the ceiling stays anyway, because a
weekly floor is only honest once the weekly job has kept it for a while.

No reader-facing copy made the claim. All four were prose in source.

## Why this counts

This project holds its pages to "no sentence outlives its evidence" and has
built four measurements around it. Source comments were the last place in the
repository where that rule did not apply, and they are the place a future
reader trusts most, because a comment is written by someone who knew.

A test now ties the claim to the record: if `drafts/.last-issue.json` has a
`sentAt`, no comment may say nothing has ever been sent.

## The measurement was wrong first, for the fifth time

The first version scanned whole files and flagged `watchdog.mjs` returning the
string `"no issue has ever been sent"` as the detail for its no-ledger branch.
That is correct code — the right message when the fact is true — not a claim
about history. Narrowed to comments, which is where the defect always was.

Fifth epoch running in which the first draft of a check was wrong, and fifth
caught by reading the finding instead of believing it.

## Deliberately untouched

`docs/agent/epoch-*.md` are excluded from the scan. They are history: each
records what was true on the day it was written, and rewriting them to match
today would destroy the only thing that makes the ledger worth keeping.

`mark-issue-sent.mjs` keeps "a draft that was generated and never sent still
retired its listings" — a description of a past bug, which is still accurate.

## Left

**Engineering**: invariants 1 and 2 remain hand-checked, both for recorded
reasons.

**Owner**: the newsletter has **one subscriber**. Everything built here —
board, guards, ledger, weekly automation — currently delivers to one person.
That is not an engineering problem and no epoch can close it.

## Verdict

**Converged, and this was a real finding rather than invented work.** Eleven
units, eleven epochs, zero regressions.
