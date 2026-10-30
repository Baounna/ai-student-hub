/**
 * Moves the suite's clock to FAKE_TODAY, for `npm run test:clock`.
 *
 * Loaded as a vitest setupFile, so it applies in-process only. A test that
 * spawns a subprocess still sees the real clock in that child -- which is why
 * tests/draft-issue.test.ts reports a failure under the sweep and is NOT a real
 * time bomb: it builds a filename from the faked date and compares it to a file
 * the child wrote under the real one. Known false positive; do not "fix" it.
 */
const target = Date.parse(`${process.env.FAKE_TODAY}T12:00:00Z`);
if (!Number.isFinite(target)) throw new Error("FAKE_TODAY must be set to YYYY-MM-DD");

const RealDate = Date;
const offset = target - RealDate.now();

class ShiftedDate extends RealDate {
  constructor(...args: unknown[]) {
    // `as []` is what forwards the real constructor's overloads; no suppression
    // is needed, and an unused @ts-expect-error is itself a typecheck error.
    if (args.length === 0) super(RealDate.now() + offset);
    else super(...(args as []));
  }
  static now() {
    return RealDate.now() + offset;
  }
}

// @ts-expect-error - deliberate global override, scoped to this run
globalThis.Date = ShiftedDate;
