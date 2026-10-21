import { describe, it, expect } from "vitest";
import { formatTier, tierHref } from "../src/lib/donation-tiers";
import { siteConfig } from "../src/config/site";

/**
 * This file used to hold a hand-copied mirror of the page's own tierHref, which
 * meant it tested a second implementation and would have gone on passing while
 * the real one changed underneath it. It imports the real function now.
 *
 * The behaviour is a money path: a tier that drops its amount looks like it
 * works and costs the reader an extra step at exactly the wrong moment, and a
 * tier whose label and link disagree on the currency costs them the difference.
 */
describe("donation tier links", () => {
  const base = "https://paypal.me/baounna";

  it("passes the amount AND the currency through to PayPal", () => {
    // paypal.me/name/3 charges 3 in the receiving account's own currency, so a
    // page printing "$3" beside it was only right by accident. The code makes
    // the currency explicit so the two cannot disagree.
    expect(tierHref(base, 3, "USD")).toBe("https://paypal.me/baounna/3USD");
    expect(tierHref(base, 25, "EUR")).toBe("https://paypal.me/baounna/25EUR");
    expect(tierHref(base, 10, "MAD")).toBe("https://paypal.me/baounna/10MAD");
  });

  it("gives each tier a different destination", () => {
    const hrefs = [3, 10, 25].map((a) => tierHref(base, a, "USD"));
    expect(new Set(hrefs).size).toBe(3);
  });

  it("tolerates a trailing slash on the configured link", () => {
    expect(tierHref("https://paypal.me/baounna/", 10, "USD")).toBe("https://paypal.me/baounna/10USD");
  });

  it("leaves providers it does not understand alone", () => {
    // Guessing a format would drop the amount silently, which is worse than
    // sending the reader to a page where they type it themselves.
    for (const other of ["https://ko-fi.com/someone", "https://www.buymeacoffee.com/someone"]) {
      expect(tierHref(other, 10, "USD")).toBe(other);
    }
  });

  it("never produces a broken URL from odd input", () => {
    expect(tierHref(base, Number.NaN, "USD")).toBe(base);
    expect(tierHref(base, 0, "USD")).toBe(base);
    expect(tierHref(base, -5, "USD")).toBe(base);
    expect(tierHref("not-a-url", 10, "USD")).toBe("not-a-url");
    expect(tierHref(undefined, 10, "USD")).toBeUndefined();
  });
});

describe("donation tier labels", () => {
  it("renders the configured currency, not a hardcoded dollar sign", () => {
    expect(formatTier(3, "EUR", "en")).toContain("3");
    expect(formatTier(3, "EUR", "en")).not.toContain("$");
    expect(formatTier(3, "MAD", "en")).not.toContain("$");
  });

  it("puts the symbol where each language expects it", () => {
    expect(formatTier(10, "USD", "en")).toBe("$10");
    // French writes the symbol after the number, with a non-breaking space.
    expect(formatTier(10, "EUR", "fr")).toMatch(/^10\s.*€$/);
  });

  it("falls back to a readable string rather than throwing on a bad code", () => {
    expect(formatTier(10, "NOTACURRENCY", "en")).toBe("10 NOTACURRENCY");
  });

  it("ships a currency the label and the link can both use", () => {
    expect(siteConfig.donation.currency).toMatch(/^[A-Z]{3}$/);
  });
});
