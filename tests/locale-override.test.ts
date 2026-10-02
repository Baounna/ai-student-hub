import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * /fr/about introduced the author as "Etudiant en derniere annee d IA, ... j
 * aide les etudiants a transformer" — the accents and the apostrophes both
 * gone, under the heading "Fondateur". The copy in the repository is correct;
 * FOUNDER_BIO_FR in the environment held the mangled version and won.
 *
 * "d IA" and "j aide" are not French spellings. French elision always carries
 * an apostrophe, so text in that state has been through something lossy, and
 * publishing it is worse than ignoring it.
 */
async function loadConfig() {
  vi.resetModules();
  return (await import("@/config/site")) as typeof import("@/config/site");
}

describe("French text supplied from the environment", () => {
  beforeEach(() => {
    vi.stubEnv("FOUNDER_BIO_FR", "");
    vi.stubEnv("FOUNDER_BIO_EN", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("ignores an override whose elisions lost their apostrophes", async () => {
    vi.stubEnv("FOUNDER_BIO_FR", "Etudiant en derniere annee d IA, j aide les etudiants.");
    const { siteConfig } = await loadConfig();

    expect(siteConfig.founderBio.fr).not.toContain("d IA");
    expect(siteConfig.founderBio.fr).toContain("d'IA");
  });

  it("accepts a correctly written French override", async () => {
    const good = "Étudiant en dernière année d'IA, je construis des projets concrets.";
    vi.stubEnv("FOUNDER_BIO_FR", good);
    const { siteConfig } = await loadConfig();

    expect(siteConfig.founderBio.fr).toBe(good);
  });

  it("does not interfere with English, where a bare letter is ordinary", async () => {
    // "a a", "l a" and so on are not errors in English; the rule is French-only.
    const english = "I build ML projects and help students a lot.";
    vi.stubEnv("FOUNDER_BIO_EN", english);
    const { siteConfig } = await loadConfig();

    expect(siteConfig.founderBio.en).toBe(english);
  });

  it("falls back rather than rendering nothing", async () => {
    vi.stubEnv("FOUNDER_BIO_FR", "j ai casse ce texte");
    const { siteConfig } = await loadConfig();

    expect(siteConfig.founderBio.fr.length).toBeGreaterThan(20);
  });
});
