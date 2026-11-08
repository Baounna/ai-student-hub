# Epoch 10 — invariant 9, after convergence

The loop converged at epoch 9 and `next-epoch.md` said not to start another one
to find work. The owner asked for one anyway, which is his to decide. This is
therefore **available work, not needed work**, and it is recorded as such.

Phase 1 found nothing new failing: invariant 6 is the owner's, and invariants
1, 2 and 9 were the three still resting on a human's word.

## Unit LOOP-5 — the half of "French is French" that was read by eye

`tests/french-typography.test.ts` has held the U+00A0 before `:` `;` `!` `?`
for a while, and learned to decode `\uXXXX` escapes and read the French half of
a ternary by position after missing twelve colons that way. Articles and
elision had no check at all, which is how both of these reached a rendered page
**in this project**:

```
"un service de Université Ibn Tofaïl"
"Pour les étudiants de Agadir"
```

Both were caught by looking at the page. That is not a method.

## Narrow on purpose

Only `de` and `que` before a vowel. Those elide in essentially every context.
`le` and `la` are left alone: *"la une"*, *"le onze"* and every h-aspiré are
real exceptions, and after invariant 2 had to be demoted for crying wolf, a
rule that flags correct French is a rule somebody switches off — which is the
thing this whole script exists to prevent.

Probed against the whole of `src/` **before** being written into the invariant:
**zero hits**. So it starts from a clean codebase rather than a backlog, and
the ten tests are what prove it can fail — including both sentences that
actually shipped, and the escaped-accent case that once hid a whole page of
French from the typography test.

Result: `774 French strings: elision checked here, U+00A0 spacing by
tests/french-typography.test.ts`. Both halves of the invariant are now
measured, one by the suite and one by the script.

## Also in this epoch

The newsletter sender was built and committed before this unit, at the owner's
request: `npm run send:issue`, six guards, dry-run by default, and a workflow
that sends only on an explicit "send" or an explicitly armed repository
variable. It is parked pending a Kit v4 API key.

## Left

**Engineering**: invariants 1 and 2 remain `hand-checked`. Invariant 2 cannot
be automated and the reason is written down; invariant 1 — "no sentence
outlives its evidence" — is the hardest of the twelve and has no obvious
measurement.

**Owner**: add `KIT_API_KEY` and send the first issue, which is the only thing
that clears invariant 6; write or retire the February briefs; decide the
editorial alarm threshold; turn on Vercel Web Analytics.

## Verdict

**Still converged.** Ten units, ten epochs, zero regressions. 10 of 12
invariants measured by machine, up from 0.
