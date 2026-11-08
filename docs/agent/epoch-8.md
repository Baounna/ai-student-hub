# Epoch 8 — unit C-2, reading times that were never read

## Delta against epoch 7

| | |
|---|---|
| FIXED | 24 hand-typed `readTime` literals removed; the authored type can no longer carry one |
| REGRESSED | none |
| NEW | none |
| STILL PENDING | the Internship Finder. Today is **Sunday 8 November**; it runs Thursday 12 November. |

## The loop did not converge today, and could not

Epoch 7's brief expected this to be the last epoch, on the assumption it would
run on or after Thursday. It is Sunday. The one outstanding confirmation is
four days away, so declaring convergence now would be claiming something
unobserved — which is the one thing this loop has refused to do since epoch 1.

So phase 2 took a ranked candidate instead, as the brief allows.

## The brief described this unit wrongly, and the description mattered

It said: *"Deleting the field is mechanical and touches ~24 objects."*

It is not. `post.readTime` is read in **eight** render sites across the home
page, the blog index, the category pages and the article pages. Deleting the
field would have broken every one of them.

What is dead is the authored *value*, not the field. `posts` and
`getLocalizedPosts` both overwrite it with `measureReadTime` before any page
sees it, so a post declaring `"18 min read"` rendered `"5 min read"` — wrong by
a factor of three, invisible to a reader, and misleading to the next person to
edit the file.

The fourth time in this loop that the first description of a problem was wrong,
and the fourth time that looking before acting is what saved it.

## What was done

`AuthoredPost = Omit<BlogPost, "readTime">`. The two authored arrays were typed
`BlogPost[]`, which is precisely what let a hand-typed value sit in the file
contradicting the page; they are `AuthoredPost[]` now, the 24 literals are
gone, and the field remains on the rendered type so all eight sites are
untouched.

Verified on a production server: `/en/blog` renders 2–6 min, `/fr/blog` 2–7
min, the same measured values as before. Nothing changed for a reader, which is
the correct outcome for removing something a reader never saw.

## Left

**Engineering**: five invariants hand-checked (1, 2, 6, 9, 12). No known
reader-visible defect.

**Owner**: send the newsletter — Cnexia, Rabat closes 10 November, two days
from today; write or retire the February briefs; decide the editorial alarm
threshold.

**Pending**: the Internship Finder, Thursday 12 November.

## Verdict

**Converging, one observation short.** Eight units, eight epochs, zero
regressions.
