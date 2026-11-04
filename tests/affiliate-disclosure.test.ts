import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
// @ts-expect-error - plain .mjs script, no types
import { affiliateDisclosureVerdict, REFERRAL_PARAM } from "../scripts/lib/affiliate-disclosure.mjs";

/**
 * tests/paid-links.test.ts covers the text the reader sees. This covers the
 * preflight that judges it, which used to warn until AFFILIATE_DISCLOSURE_TEXT_*
 * was set -- rewarding the one configuration that cannot follow the links.
 */

const EARNING_LINK = "https://example.com/signup?ref=ai-student-hub";
const PLAIN_LINK = "https://www.digitalocean.com/";

const DENIAL = "These are ordinary links: we are not in any affiliate programme and earn nothing.";
const DENIAL_FR = "Ce sont de simples liens : nous ne participons à aucun programme d'affiliation.";
const DISCLOSURE = "Some of these are referral links that may earn us a commission.";
const DISCLOSURE_FR = "Certains sont des liens de parrainage pouvant nous rapporter une commission.";

describe("affiliate disclosure preflight", () => {
  it("passes with no override, and says which way the text is pointing", () => {
    const verdict = affiliateDisclosureVerdict({ AFFILIATE_1_URL: PLAIN_LINK });
    expect(verdict.level).toBe("ok");
    expect(verdict.message).toMatch(/denies earning/);
  });

  it("passes with no override when a link does earn", () => {
    const verdict = affiliateDisclosureVerdict({ AFFILIATE_1_URL: EARNING_LINK });
    expect(verdict.level).toBe("ok");
    expect(verdict.message).toMatch(/discloses/);
  });

  it("treats a referral code on DigitalOcean as earning", () => {
    const verdict = affiliateDisclosureVerdict({ NEXT_PUBLIC_DIGITALOCEAN_REF: "some-refcode" });
    expect(verdict.message).toMatch(/discloses/);
  });

  it("fails when one language is overridden and the other is not", () => {
    const verdict = affiliateDisclosureVerdict({ AFFILIATE_DISCLOSURE_TEXT_EN: DENIAL });
    expect(verdict.level).toBe("error");
    expect(verdict.message).toMatch(/AFFILIATE_DISCLOSURE_TEXT_FR is missing/);
  });

  it("fails when a frozen override denies earning after a link starts earning", () => {
    const verdict = affiliateDisclosureVerdict({
      AFFILIATE_1_URL: EARNING_LINK,
      AFFILIATE_DISCLOSURE_TEXT_EN: DENIAL,
      AFFILIATE_DISCLOSURE_TEXT_FR: DENIAL_FR
    });
    expect(verdict.level).toBe("error");
    expect(verdict.message).toMatch(/denies earning/);
  });

  it("fails when an override says nothing at all about earning while a link earns", () => {
    // Silence is not disclosure. A text that simply omits it leaves the reader
    // believing the ordinary case, which is the untruth here.
    const verdict = affiliateDisclosureVerdict({
      AFFILIATE_1_URL: EARNING_LINK,
      AFFILIATE_DISCLOSURE_TEXT_EN: "We link to tools we use.",
      AFFILIATE_DISCLOSURE_TEXT_FR: "Nous renvoyons vers des outils que nous utilisons."
    });
    expect(verdict.level).toBe("error");
    expect(verdict.message).toMatch(/never says a link may earn/);
  });

  it("fails when an override promises a commission no link can earn", () => {
    const verdict = affiliateDisclosureVerdict({
      AFFILIATE_1_URL: PLAIN_LINK,
      AFFILIATE_DISCLOSURE_TEXT_EN: DISCLOSURE,
      AFFILIATE_DISCLOSURE_TEXT_FR: DISCLOSURE_FR
    });
    expect(verdict.level).toBe("error");
    expect(verdict.message).toMatch(/promises the reader a commission/);
  });

  it("catches an override whose French half is the one that is wrong", () => {
    const verdict = affiliateDisclosureVerdict({
      AFFILIATE_1_URL: PLAIN_LINK,
      AFFILIATE_DISCLOSURE_TEXT_EN: DENIAL,
      AFFILIATE_DISCLOSURE_TEXT_FR: DISCLOSURE_FR
    });
    expect(verdict.level).toBe("error");
    expect(verdict.message).toMatch(/AFFILIATE_DISCLOSURE_TEXT_FR/);
  });

  it("warns, rather than passing, for a truthful override", () => {
    // It is true today and cannot notice tomorrow, so it is never "OK".
    const verdict = affiliateDisclosureVerdict({
      AFFILIATE_1_URL: PLAIN_LINK,
      AFFILIATE_DISCLOSURE_TEXT_EN: DENIAL,
      AFFILIATE_DISCLOSURE_TEXT_FR: DENIAL_FR
    });
    expect(verdict.level).toBe("warn");
    expect(verdict.message).toMatch(/no longer follows the links/);
  });

  it("keeps its referral-parameter list identical to the one the site renders from", () => {
    // Two copies because one file is TypeScript and the other a plain script.
    // Drift would let the preflight call a disclosure true that the site knows
    // is false, which is worse than having no preflight.
    const source = readFileSync("src/config/site.ts", "utf8");
    const literal = source.match(/const REFERRAL_PARAM =\s*(\/.+\/[a-z]*);/)?.[1];
    expect(literal).toBeTruthy();
    expect(String(REFERRAL_PARAM)).toBe(literal);
  });
});
