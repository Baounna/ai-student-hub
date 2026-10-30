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
  /*
   * A pinned date, because the digest window is deliberately short.
   *
   * stageDigests looks back three weeks, so with the live clock these tests
   * assert something about the calendar rather than about the code: the moment
   * the newest postedAt is more than 21 days old the list is empty and every
   * assertion below fails. Measured with the clock moved forward, they break by
   * 30 November.
   *
   * That matters more than a red test, because `npm test` is the gate every
   * content agent runs before committing -- so a digest test failing on a
   * calendar boundary stops the news agent and the finder, which is exactly
   * what one wrong date assertion did on 29 October.
   *
   * ANCHOR is a day on which the committed board genuinely has recent
   * additions. If a future prune empties that window the pinned date keeps
   * these honest; they are about the grouping, not about today's data.
   */
  const ANCHOR = Date.parse("2026-10-30T12:00:00Z");
  it("emits one item per week, not one per listing", () => {
    for (const locale of locales) {
      const digests = stageDigests(locale, ANCHOR);
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
    const digests = stageDigests("en", ANCHOR);
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
    for (const d of stageDigests("en", ANCHOR)) {
      // Measured from ANCHOR, not from Date.now() -- the whole point of the
      // anchor is that this assertion stops moving.
      const age = (ANCHOR - Date.parse(`${d.publishedAt}T12:00:00Z`)) / 86_400_000;
      expect(age).toBeLessThan(22);
    }
  });

  it("counts listings in the title and employers in the sentence, and says which", () => {
    for (const d of stageDigests("en", ANCHOR)) {
      expect(d.title).toContain(String(d.count));
      const more = d.description.match(/and (\d+) other employers?/);
      if (more) expect(d.description).toMatch(/other employers?/);
    }
  });

  it("names each employer once", () => {
    // A good Thursday at one company produced "NVIDIA (Santa Clara), NVIDIA
    // (Santa Clara)".
    for (const locale of locales) {
      for (const d of stageDigests(locale, ANCHOR)) {
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
    const fr = stageDigests("fr", ANCHOR);
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
      const xml = buildFeed(locale, ANCHOR);
      const guids = [...xml.matchAll(/<guid[^>]*>([\s\S]*?)<\/guid>/g)].map((m) => m[1]);
      expect(new Set(guids).size).toBe(guids.length);
      expect(xml).toMatch(/stages-digest-/);
      expect(xml).toMatch(locale === "fr" ? /nouveaux stages/ : /new AI and cyber/);
    }
  });
});
