# Epoch 5 — unit LOOP-2, measuring invariant 7

## Delta against epoch 4

| | |
|---|---|
| MEASURED | invariant 7 moved from `hand-checked` to `pass`. Six hand-checked remain, down from seven. |
| FIXED | none — nothing was broken |
| REGRESSED | none |
| NEW | one false positive found and narrowed; one finding recorded outside the unit |

## Why this invariant first

It is the claim that the site is in no affiliate programme and earns no
commission. The cost of getting it wrong is not hypothetical: a session working
on this repository read the names `affiliateHref` and `affiliate_click`,
concluded the site took a commission — it does not, and `site.ts:242-246`
records the commission wording being removed for exactly that reason — and
wrote the claim into a formal letter addressed to a university Dean.

## What the measurement does

Both gates, read from their definitions rather than from copies:

- `hasPaidLinks` is evaluated with the same `REFERRAL_PARAM` regex and the same
  environment variables the gate itself uses, lifted out of `site.ts` source.
- Both canonical disclosure wordings are read out of the ternary that chooses
  between them, and the **effective** text — which an environment override can
  replace at runtime — must be the one belonging to the gate's value.
- `GUIDE_EXISTS` must still govern `getGuideCtaHref`, and no reader-facing page
  may link the product route directly.

Result: `hasPaidLinks=false, and both disclosures are the wording that belongs
to it; GUIDE_EXISTS=false, every reader-facing CTA routed through the gate`.

## The false positive, and what was done with it

First run: `GUIDE_EXISTS=false but 1 page(s) link the product route directly:
/growth-sprint`.

Looked at rather than believed. The link is a button labelled "Optimize product
page" on the internal growth checklist — the owner's own shortcut to a page he
goes to work on, not a claim to a reader that a guide is for sale.
`/growth-sprint` is robots-disallowed and already excluded from invariant 3 for
the same stated reason, so it is excluded here from the same documented set
rather than by loosening the rule until it stops noticing.

That is the second epoch running in which the first version of a measurement
was wrong. Epoch 2's invariant 2 was demoted for it; this one was narrowed with
a reason. The difference is whether a narrowing can be stated — and the four
tests that flip each gate exist so the narrowing cannot quietly become
uselessness.

## Recorded, not fixed

`src/app/[lang]/growth-sprint/page.tsx:359` bypasses `getGuideCtaHref`. It is
defensible where it is, but it is the only place in the repo that reaches the
product route without passing the gate, and if that page ever stops being
internal it becomes a live claim. Outside this unit's scope — the brief said
read-only over the pages — so it is written down here instead.

## Left

**Engineering**: six invariants still hand-checked (1, 2, 6, 9, 10, 12).

**Owner**: push — the Internship Finder runs Thursday 12 November against
`origin/main` and its fix is in 17 unpushed commits; send the first newsletter;
write or retire the February briefs; decide the editorial alarm threshold.

## Verdict

**Converging.** Five units, five epochs, no regressions. The hand-checked count
is falling, which is the only metric in this loop that measures the loop itself.
