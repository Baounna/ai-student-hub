# There is no epoch 10

The convergence loop finished at epoch 9 on 8 November 2026. See
`docs/agent/epoch-9.md`.

The stop condition was met: no regressions in nine epochs, nothing new, and the
one remaining failing invariant is the owner's decision to make — the first
newsletter has never been sent while every page promises one a week.

**Do not start another epoch to find work.** Eight of the nine found something
real because each began from a measurement that had changed. Start one again
when a measurement changes:

```
npm run invariants        # 9 of 12 measured; 1 failing is the owner's
npm run health            # everything it lists should be an owner decision
node scripts/watchdog.mjs # runs daily in CI and opens one issue
```

If any of those reports something that is not already written down in
`docs/agent/convergence.json`, that is a reason. Write a brief for it in the
shape the earlier ones use — trigger, scope, exit condition, test — and run it.

Nothing else is.
