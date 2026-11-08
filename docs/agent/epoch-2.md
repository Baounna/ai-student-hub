# Epoch 2 — harden the loop, then unit C-1

## Delta against epoch 1

| | |
|---|---|
| MEASURED | invariants 3, 4, 5, 8, 11 now have automation. They were prose "pass" written from audits that predated the fixes. |
| FIXED | C-1: /blog printed two different numbers for one article on one page |
| REGRESSED | none |
| NEW | invariant 2 cannot be automated the way it was specified — demoted to hand-checked with its procedure |

## Phase 1 — the thing that measures

`npm run invariants` runs six of the twelve and prints JSON the ledger eats.
Three statuses, and the third is the point: `hand-checked` is visibly not
`pass`, so an invariant nobody measured cannot sit among the ones that were.
Seven are marked that way today, each naming the command a human would run.

It found C-1 independently of being told: `en/blog|sources = 72 and 4`.

**Then it was wrong, and that mattered more.** Pointed at a local build with
C-1 already fixed, invariant 2 returned `sources = 72 and 4 and 3 and 1 and 2
and 6` and `campus|listings = 2 and 3`. Those are per-item counts — twenty-four
articles legitimately cite different numbers of sources. The heuristic cannot
tell a page aggregate from a per-row figure, and every value after the first
was noise.

So invariant 2 is **hand-checked**, with the procedure written down and the
failed approach recorded so nobody re-attempts it naively. A check that reports
six values where one is real is a check somebody switches off, and the
switching off is what this script exists to prevent. The vocabulary did its job
twice in one epoch: it stopped a false `pass` in phase 1 and a false `fail` in
phase 3.

One more thing the run taught: invariants 2 and 4 measure a **deployed** site.
A fix committed locally reads as still failing until it ships. The origin is
now named in the evidence, because an epoch that did not know which it had
measured would record its own fix as having had no effect.

## Phase 2 — unit C-1

/blog printed "72 cited sources" in its Evidence tile while the per-card chips
summed to 106, and the same article read **6 sources** in the stream and **4
cited sources** in the picks. Two numbers for one post, on one screen.

`src/lib/citations.ts` had distinguished the two since it was written — a
reference a paragraph points at is a citation, one that is only listed is a
reading list, and `referenceCountLabel` says which. The "Editor's picks" cards
already used it. The featured card and the stream cards did not: they printed
`post.references.length` under the bare word "sources", through a ternary whose
two arms were the same string.

All three now use one expression and one label. Rendered, both locales:

```
/en/blog  tile 72 cited sources   labels {cited sources: 25, sources consulted: 3}   bare "sources": 0
/fr/blog  tile 72 sources citées  labels {sources citées: 25, sources consultées: 3} bare "sources": 0
```

The tile remains the sum of exactly the cards labelled cited, so the two
reconcile.

## Left

**Engineering**: `orderStages` top-bias (recorded, with measurements); one news
source silent 21+ days; six invariants still hand-checked.

**Owner**: send the first newsletter; write or retire the February briefs;
decide the editorial alarm threshold.

## Verdict

**Converging.** 0 failing invariants, 0 regressions, and the one thing that
went backwards was a measurement I had written badly, caught by its own run.
