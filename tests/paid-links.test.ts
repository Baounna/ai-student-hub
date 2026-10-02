import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * The site tells the reader, in the place a reader goes to check, that it is in
 * no affiliate programme and earns nothing from its links. That sentence was a
 * constant, while two environment variables could add a referral code to every
 * DigitalOcean link and publish a partner card. Production sets neither, so the
 * claim was true -- by luck.
 *
 * These load src/config/site.ts fresh under each environment, because the
 * disclosure is resolved once at module load.
 */
const DENIES_AFFILIATION = {
  en: /not in any affiliate programme/i,
  fr: /aucun programme d'affiliation/i
};

async function loadConfig() {
  vi.resetModules();
  return (await import("@/config/site")) as typeof import("@/config/site");
}

describe("paid-link disclosure", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DIGITALOCEAN_REF", "");
    for (const index of [1, 2, 3, 4, 5]) {
      vi.stubEnv(`AFFILIATE_${index}_NAME`, "");
      vi.stubEnv(`AFFILIATE_${index}_URL`, "");
    }
    vi.stubEnv("AFFILIATE_DISCLOSURE_TEXT_EN", "");
    vi.stubEnv("AFFILIATE_DISCLOSURE_TEXT_FR", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("denies affiliation only when there is none", async () => {
    const { hasPaidLinks, siteConfig } = await loadConfig();

    expect(hasPaidLinks).toBe(false);
    expect(siteConfig.affiliateDisclosureText.en).toMatch(DENIES_AFFILIATION.en);
    expect(siteConfig.affiliateDisclosureText.fr).toMatch(DENIES_AFFILIATION.fr);
  });

  it("stops denying affiliation the moment a referral code is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_DIGITALOCEAN_REF", "some-refcode");
    const { hasPaidLinks, siteConfig } = await loadConfig();

    expect(hasPaidLinks).toBe(true);
    expect(siteConfig.affiliateDisclosureText.en).not.toMatch(DENIES_AFFILIATION.en);
    expect(siteConfig.affiliateDisclosureText.fr).not.toMatch(DENIES_AFFILIATION.fr);
    // Silence is not disclosure: it has to say what is happening.
    expect(siteConfig.affiliateDisclosureText.en).toMatch(/referral links/i);
    expect(siteConfig.affiliateDisclosureText.fr).toMatch(/liens de parrainage/i);
  });

  it("stops denying affiliation when a partner link carries a referral code", async () => {
    vi.stubEnv("AFFILIATE_1_NAME", "Some Host");
    vi.stubEnv("AFFILIATE_1_URL", "https://example.com/signup?ref=ai-student-hub");
    const { hasPaidLinks, siteConfig } = await loadConfig();

    expect(hasPaidLinks).toBe(true);
    expect(siteConfig.affiliateDisclosureText.en).not.toMatch(DENIES_AFFILIATION.en);
  });

  it("keeps denying affiliation for a partner link that earns nothing", async () => {
    // The first version of the gate counted any configured partner as a paid
    // link, which is the wrong direction to be wrong in: every partner URL on
    // the site is a bare homepage with no referral parameter, so claiming a
    // commission would have been the untruth. A card is not a commission.
    vi.stubEnv("AFFILIATE_1_NAME", "Some Host");
    vi.stubEnv("AFFILIATE_1_URL", "https://www.digitalocean.com/");
    const { hasPaidLinks, siteConfig } = await loadConfig();

    expect(hasPaidLinks).toBe(false);
    expect(siteConfig.affiliateDisclosureText.en).toMatch(DENIES_AFFILIATION.en);
  });

  it("still lets an explicit disclosure text override both", async () => {
    vi.stubEnv("NEXT_PUBLIC_DIGITALOCEAN_REF", "some-refcode");
    vi.stubEnv("AFFILIATE_DISCLOSURE_TEXT_EN", "Our own wording.");
    const { siteConfig } = await loadConfig();

    expect(siteConfig.affiliateDisclosureText.en).toBe("Our own wording.");
  });
});
