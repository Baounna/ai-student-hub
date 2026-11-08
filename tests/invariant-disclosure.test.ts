import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
// @ts-expect-error - plain .mjs script, no types
import { disclosureVerdict, guideVerdict } from "../scripts/invariants.mjs";

/**
 * Invariant 7, and why it is the one worth measuring first.
 *
 * Two gates govern reader-facing claims on four pages: `hasPaidLinks` decides
 * whether the site says it earns a commission, `GUIDE_EXISTS` whether it
 * offers a guide for sale. Both are false. Nothing checked that the copy still
 * agreed with them.
 *
 * The cost is not hypothetical. A session working on this repository read the
 * names `affiliateHref` and `affiliate_click`, concluded the site took a
 * commission — it does not, and src/config/site.ts:242-246 records the
 * commission wording being removed for that exact reason — and wrote the claim
 * into a formal letter addressed to a university Dean.
 *
 * A derived check is easy to derive into uselessness, so each gate is flipped
 * here and the verdict must go red. A check that cannot fail is the bug this
 * repo has now fixed three times.
 */
const canonical = {
  paid: { en: "…may earn us a commission…", fr: "…pouvant nous rapporter une commission…" },
  unpaid: { en: "…we are not in any affiliate programme…", fr: "…aucun programme d'affiliation…" }
};

describe("disclosureVerdict", () => {
  it("passes when the wording belongs to the gate", () => {
    expect(disclosureVerdict({ hasPaidLinks: false, effective: canonical.unpaid, canonical }).ok).toBe(true);
    expect(disclosureVerdict({ hasPaidLinks: true, effective: canonical.paid, canonical }).ok).toBe(true);
  });

  it("fails when the site claims a commission no link can earn", () => {
    // The direction that matters most: claiming revenue that does not exist.
    const v = disclosureVerdict({ hasPaidLinks: false, effective: canonical.paid, canonical });
    expect(v.ok).toBe(false);
    expect(v.why).toContain("hasPaidLinks=false");
  });

  it("fails when a link can earn and the site does not say so", () => {
    const v = disclosureVerdict({ hasPaidLinks: true, effective: canonical.unpaid, canonical });
    expect(v.ok).toBe(false);
  });

  it("fails on an environment override that contradicts the gate", () => {
    // AFFILIATE_DISCLOSURE_TEXT_EN can replace the copy at runtime, which is
    // the one way the ternary in site.ts can be bypassed.
    const v = disclosureVerdict({
      hasPaidLinks: false,
      effective: { en: "We earn a commission on every link.", fr: canonical.unpaid.fr },
      canonical
    });
    expect(v.ok).toBe(false);
    expect(v.why).toContain("EN");
  });

  it("notices a single-locale drift, not just an English one", () => {
    const v = disclosureVerdict({
      hasPaidLinks: false,
      effective: { en: canonical.unpaid.en, fr: canonical.paid.fr },
      canonical
    });
    expect(v.ok).toBe(false);
    expect(v.why).toContain("FR");
  });
});

describe("guideVerdict", () => {
  it("passes when no reader-facing page bypasses the gate", () => {
    expect(guideVerdict({ guideExists: false, gateIsWired: true, directLinks: [] }).ok).toBe(true);
  });

  it("fails when a page links a product that does not exist", () => {
    const v = guideVerdict({ guideExists: false, gateIsWired: true, directLinks: ["/blog"] });
    expect(v.ok).toBe(false);
    expect(v.why).toContain("/blog");
  });

  it("fails when the gate stops governing the CTA at all", () => {
    // Unwiring the gate is the quiet way this breaks: the copy stays correct
    // while nothing enforces it.
    expect(guideVerdict({ guideExists: false, gateIsWired: false, directLinks: [] }).ok).toBe(false);
  });

  it("allows the direct link once the guide actually exists", () => {
    expect(guideVerdict({ guideExists: true, gateIsWired: true, directLinks: ["/blog"] }).ok).toBe(true);
  });
});

describe("invariant 7 is wired into the measurement", () => {
  it("is called, and is no longer declared hand-checked", () => {
    const script = readFileSync("scripts/invariants.mjs", "utf8");
    expect(script).toMatch(/await invariant7\(\);/);
    expect(script).not.toMatch(/record\(7, "hand-checked", "grep hasPaidLinks/);
  });

  it("reads the gate from its definition rather than a copy", () => {
    // A second copy of REFERRAL_PARAM would drift from the real one silently.
    const script = readFileSync("scripts/invariants.mjs", "utf8");
    expect(script).toMatch(/const REFERRAL_PARAM = /);
    expect(script).toMatch(/GUIDE_EXISTS = \(true\|false\)/);
  });
});
