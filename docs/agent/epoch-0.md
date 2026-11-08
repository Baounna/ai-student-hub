# Epoch 0 — baseline and batch E

First epoch: no previous state, so every finding is NEW by definition and
nothing can be REGRESSED. What follows is the baseline plus one batch fixed.

## Delta

| | |
|---|---|
| FIXED | invariant 5 (three signup blocks on /resources), invariant 3 for the tools figure, two invariant-9 French defects, one invariant-1 false claim |
| REGRESSED | none — nothing to regress from |
| NEW | invariants 2, 6, 12 recorded as failing |

## Batch E — money and trust

- `/resources` printed **"3 active tools in the shortlist"** above **7**
  rendered tools; the count read one of the two lists the page renders. Now
  counted off both, from the same constant that slices the first.
- **"Use the tools-lab template…"** named a template that does not exist. The
  three buttons beside it are ordinary links; the sentence now says what they do.
- **"30-day learning plan"** sat above three steps that each say *each week* —
  a weekly loop, not a thirty-day course. Renamed to what the list is.
- **Three signup blocks on one page**: footer, in-body and aside, with the
  identical heading. The aside copy is gone; one in-body block plus the global
  footer remains, which is now enforced site-wide by a test.
- **"1. Priorité aux outils qui réduisent temps de delivery."** — missing
  article, untranslated English noun.
- **"convertir l'audience"** in the French subtitle, where English promised
  execution-focused workflows. The French half was making a monetisation claim
  the English half did not, on a page aimed at students.
- **Coursera** described *core cybersecurity* in English and *l'informatique
  fondamentale* in French — two different subjects for one tool.

## Couplings discovered

Two of batch E's defects did not live in batch E's files: the subtitle is in
`src/i18n/dictionaries.ts` (batch F) and the Coursera line is in
`src/content/posts.ts` (batch C). Page copy that lives in a shared data file
belongs to the page for correctness and to the file for ownership, and the
batch table does not express that. **It is not worth merging E with C and F —
that would be half the repo.** Record it instead: a copy fix may reach into a
data file, and that is not a sign the batches are wrong.

The third coupling is live and matters: **B depends on C's state.** The
live-news block sits above the briefs *because* the briefs are nine months old.
If C refreshes them, B's ordering must be re-decided — it is not independently
correct.

## Left

**Engineering**: invariant 2 (/blog prints 72 cited sources over chips summing
106); invariant 12 (Internship Finder's last scheduled run failed; one news
source silent 21+ days).

**Owner**: send the first newsletter; write or retire the February briefs;
decide whether the editorial alarm threshold should be raised.

## Verdict

**Converging.** One batch closed, no regressions, three couplings documented,
two of which are naming problems rather than real coupling and one of which is
a genuine dependency to watch.
