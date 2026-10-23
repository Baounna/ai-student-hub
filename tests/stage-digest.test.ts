import { describe, it, expect } from "vitest";
import { isoWeekKey, stageDigests } from "@/lib/stage-digest";
import { buildFeed } from "@/lib/feed";
import { locales } from "@/i18n/config";

/**
 * The board belongs in the feed, but not one listing at a time.
 *
 * It is the most valuable and most frequently updated thing on the site and it
 * was absent from the only channel built for people who want updates. The
 * comment above feedItems records what happened when sixty auto-briefs went in:
 * a subscriber's first three items were reprints and the site's own writing
 * started at item sixty-one. Fifteen job rows on a good Thursday would do the
 * same to twenty-seven original pieces.
 */
describe("stage digests", () => {
  it("emits one item per week, not one per listing", () => {
    for (const locale of locales) {
      const digests = stageDigests(locale);
      expect(digests.length).toBeGreaterThan(0);
      // Far fewer items than listings, and every count is at least one.
      const listings = digests.reduce((n, d) => n + d.count, 0);
      expect(digests.length).toBeLessThan(listings);
      for (const d of digests) expect(d.count).toBeGreaterThan(0);
    }
  });

  it("gives each week its own non-permalink guid", () => {
    // Every digest points at the same /stages?added=recent, and the feed uses
    // the link as the guid, so without this two weeks collide and a reader sees
    // one of them.
    const digests = stageDigests("en");
    const guids = new Set(digests.map((d) => d.guid));
    expect(guids.size).toBe(digests.length);
    const links = new Set(digests.map((d) => d.link));
    expect(links.size).toBe(1);
  });

  it("does not reach back to the week the board was seeded", () => {
    // At sixty days this announced "51 new internships, verified" dated 20
    // September. True, and the wrong thing to say: 51 rows arrived that week
    // because the list was being created.
    // The window is the rule, so the window is what this asserts. A count
    // threshold would read as the rule and would fail the day a genuinely busy
    // week arrives, which is not a bug.
    for (const d of stageDigests("en")) {
      const age = (Date.now() - Date.parse(`${d.publishedAt}T12:00:00Z`)) / 86_400_000;
      expect(age).toBeLessThan(22);
    }
  });

  it("counts listings in the title and employers in the sentence, and says which", () => {
    for (const d of stageDigests("en")) {
      expect(d.title).toContain(String(d.count));
      const more = d.description.match(/and (\d+) other employers?/);
      if (more) expect(d.description).toMatch(/other employers?/);
    }
  });

  it("names each employer once", () => {
    // A good Thursday at one company produced "NVIDIA (Santa Clara), NVIDIA
    // (Santa Clara)".
    for (const locale of locales) {
      for (const d of stageDigests(locale)) {
        const names = d.description
          .replace(/^(From|De) /, "")
          .split(/, | and | et /)
          .map((part) => part.split(" (")[0].trim())
          .filter((part) => part && !/other|autre|Each|Chaque/.test(part));
        expect(new Set(names).size).toBe(names.length);
      }
    }
  });

  it("agrees in French, where the count changes the words", () => {
    const fr = stageDigests("fr");
    for (const d of fr) {
      expect(d.title).toMatch(d.count === 1 ? /nouveau stage .*vérifié$/ : /nouveaux stages .*vérifiés$/);
    }
  });

  it("puts a Thursday run and a Saturday addition in the same week", () => {
    // The finder runs Thursdays; a person adds whenever they have time.
    expect(isoWeekKey("2026-10-22")).toBe(isoWeekKey("2026-10-24"));
    expect(isoWeekKey("2026-10-22")).not.toBe(isoWeekKey("2026-10-29"));
    expect(isoWeekKey("not-a-date")).toBe("");
  });

  it("reaches the real feed, in both languages, without colliding guids", () => {
    for (const locale of locales) {
      const xml = buildFeed(locale);
      const guids = [...xml.matchAll(/<guid[^>]*>([\s\S]*?)<\/guid>/g)].map((m) => m[1]);
      expect(new Set(guids).size).toBe(guids.length);
      expect(xml).toMatch(/stages-digest-/);
      expect(xml).toMatch(locale === "fr" ? /nouveaux stages/ : /new AI and cyber/);
    }
  });
});
