import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Note on the URLs below: example.com is deliberately refused by
 * isSafeHttpUrl's placeholder-host list, so a test partner needs a host that
 * looks like a real one.
 *
 * Configuring three partners in a dashboard used to DELETE the five
 * hand-written tool cards and replace every one of them with the same
 * generated sentence — "Curated partner resource for home, resources workflows
 * across AI and cybersecurity execution." The accurate copy stayed in the
 * repository looking live, and nothing warned.
 */
async function loadTools() {
  vi.resetModules();
  return (await import("@/content/posts")) as typeof import("@/content/posts");
}

describe("recommended tools", () => {
  beforeEach(() => {
    for (const i of [1, 2, 3, 4, 5]) {
      vi.stubEnv(`AFFILIATE_${i}_NAME`, "");
      vi.stubEnv(`AFFILIATE_${i}_URL`, "");
      vi.stubEnv(`AFFILIATE_${i}_SUMMARY_EN`, "");
      vi.stubEnv(`AFFILIATE_${i}_SUMMARY_FR`, "");
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("keeps the hand-written cards when partners are configured", async () => {
    for (const i of [1, 2, 3]) {
      vi.stubEnv(`AFFILIATE_${i}_NAME`, `Partner ${i}`);
      vi.stubEnv(`AFFILIATE_${i}_URL`, `https://some-real-host.dev/${i}`);
      vi.stubEnv(`AFFILIATE_${i}_SUMMARY_EN`, `What partner ${i} actually does.`);
      vi.stubEnv(`AFFILIATE_${i}_SUMMARY_FR`, `Ce que fait réellement le partenaire ${i}.`);
    }
    const { recommendedTools } = await loadTools();
    const names = recommendedTools.map((tool) => tool.name);

    expect(names).toContain("Grammarly");
    expect(names).toContain("Partner 1");
    expect(recommendedTools.find((t) => t.name === "Grammarly")?.summary.en).toContain(
      "Catches grammar and clarity problems"
    );
  });

  it("does not publish a partner with no description", async () => {
    vi.stubEnv("AFFILIATE_1_NAME", "Nameless Partner");
    vi.stubEnv("AFFILIATE_1_URL", "https://some-real-host.dev/1");
    const { recommendedTools } = await loadTools();

    expect(recommendedTools.map((t) => t.name)).not.toContain("Nameless Partner");
  });

  it("never generates a description nobody wrote", async () => {
    vi.stubEnv("AFFILIATE_1_NAME", "Partner");
    vi.stubEnv("AFFILIATE_1_URL", "https://some-real-host.dev/1");
    vi.stubEnv("AFFILIATE_1_SUMMARY_EN", "A real sentence about this tool.");
    vi.stubEnv("AFFILIATE_1_SUMMARY_FR", "Une vraie phrase sur cet outil.");
    const { recommendedTools } = await loadTools();

    for (const tool of recommendedTools) {
      expect(tool.summary.en).not.toMatch(/Curated partner resource for/);
      expect(tool.summary.fr).not.toMatch(/Ressource partenaire choisie pour/);
    }
  });

  it("does not list the same tool twice", async () => {
    vi.stubEnv("AFFILIATE_1_NAME", "grammarly");
    vi.stubEnv("AFFILIATE_1_URL", "https://some-real-host.dev/g");
    vi.stubEnv("AFFILIATE_1_SUMMARY_EN", "Duplicate of a curated card.");
    vi.stubEnv("AFFILIATE_1_SUMMARY_FR", "Doublon d'une carte existante.");
    const { recommendedTools } = await loadTools();
    const names = recommendedTools.map((t) => t.name.toLowerCase());

    expect(names.length).toBe(new Set(names).size);
  });
});
