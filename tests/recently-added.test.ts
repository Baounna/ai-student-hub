import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  isRecentlyAdded,
  RECENTLY_ADDED_DAYS,
  getStages,
  getStagesLastCheckedAt,
  getStagesCheckedAgeDays,
  isStagesListStale,
  STALE_AFTER_DAYS,
  unverifiableJudgmentIsCurrent,
  UNVERIFIABLE_RECHECK_DAYS
} from "@/content/stages";
import { matchesAllTerms, searchTerms } from "@/lib/search";

/**
 * postedAt records when a listing was added to this board, not when the
 * employer published it — the field's own comment says so. Anything built on it
 * has to say "added", because telling a student a role was posted on a date we
 * actually imported it would be exactly the kind of small untruth this site
 * spent a fortnight removing.
 */
const NOW = new Date("2026-10-04T12:00:00Z");

describe("isRecentlyAdded", () => {
  it("counts a listing added inside the window", () => {
    expect(isRecentlyAdded({ postedAt: "2026-10-01" } as never, NOW)).toBe(true);
    expect(isRecentlyAdded({ postedAt: "2026-10-04" } as never, NOW)).toBe(true);
  });

  it("does not count one added before it", () => {
    expect(isRecentlyAdded({ postedAt: "2026-09-20" } as never, NOW)).toBe(false);
  });

  it("treats the boundary as inside", () => {
    const boundary = new Date(NOW.getTime() - RECENTLY_ADDED_DAYS * 86_400_000);
    expect(isRecentlyAdded({ postedAt: boundary.toISOString().slice(0, 10) } as never, NOW)).toBe(true);
  });

  it("refuses a future date rather than calling it new", () => {
    // A clock skew or a typo must not promote a listing.
    expect(isRecentlyAdded({ postedAt: "2026-12-01" } as never, NOW)).toBe(false);
  });

  it("says no when there is no date at all", () => {
    expect(isRecentlyAdded({} as never, NOW)).toBe(false);
    expect(isRecentlyAdded({ postedAt: "" } as never, NOW)).toBe(false);
    expect(isRecentlyAdded({ postedAt: "not-a-date" } as never, NOW)).toBe(false);
  });

  it("matches the real board", () => {
    // Every listing carries the field, so this is a real count, not a sample.
    const stages = getStages();
    expect(stages.every((s) => s.postedAt)).toBe(true);
    const recent = stages.filter((s) => isRecentlyAdded(s, NOW));
    expect(recent.length).toBeGreaterThan(0);
    expect(recent.length).toBeLessThan(stages.length);
  });
});

describe("the wording on /stages", () => {
  const source = readFileSync(new URL("../src/app/[lang]/stages/page.tsx", import.meta.url), "utf8");
  // Comments discuss the words we chose not to use, so they have to come out
  // before asking whether the page says them. Without this the file's own
  // explanation of why it avoids "Posted" fails the test that enforces it.
  const prose = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  it("never calls the import date a posting date", () => {
    // The chip and the badge describe postedAt. "Posted 2 days ago" would be a
    // claim about the employer that this data cannot support; "Added" and
    // "New here" are claims about this board, which it can.
    for (const label of ["filterAdded", "filterRecent", "recentBadge"]) {
      expect(source).toContain(label);
    }
    expect(prose).not.toMatch(/\b(Posted|Publiée? le|Posté)\b/);
  });

  it("keeps the badge off closed rows", () => {
    expect(source).toContain("!closed && isRecentlyAdded(stage)");
  });
});

describe("the keyword filter on /stages", () => {
  const stages = getStages();
  const hay = (s: (typeof stages)[number]) => [s.role, s.company, s.city];

  it("folds accents, so a reader without a French keyboard finds French roles", () => {
    const accented = stages.filter((s) => /[éèêëàâçùûôîï]/i.test(`${s.role} ${s.city ?? ""}`));
    expect(accented.length).toBeGreaterThan(0);
    // Every accented listing is reachable by its unaccented spelling.
    for (const s of accented.slice(0, 12)) {
      const plain = `${s.role}`.normalize("NFD").replace(/[̀-ͯ]/g, "");
      const first = plain.split(/\s+/).filter((w) => w.length > 3)[0];
      if (!first) continue;
      expect(matchesAllTerms(searchTerms(first), hay(s))).toBe(true);
    }
  });

  it("requires every term, so two words narrow rather than widen", () => {
    const one = stages.filter((s) => matchesAllTerms(searchTerms("stage"), hay(s))).length;
    const two = stages.filter((s) => matchesAllTerms(searchTerms("stage zzzznope"), hay(s))).length;
    expect(two).toBeLessThanOrEqual(one);
    expect(two).toBe(0);
  });

  it("anchors at a word boundary, so a short term is not a substring hunt", () => {
    // The bug this inherited matcher exists to prevent: "rag" inside "storage".
    expect(matchesAllTerms(searchTerms("rag"), ["Storage Engineer"])).toBe(false);
    expect(matchesAllTerms(searchTerms("rag"), ["RAG Research Intern"])).toBe(true);
  });

  it("returns the whole board for an empty or punctuation-only query", () => {
    for (const q of ["", "   ", "-", "***"]) {
      const n = stages.filter((s) => matchesAllTerms(searchTerms(q), hay(s))).length;
      expect(n).toBe(stages.length);
    }
  });
});

describe("the keyword examples in the placeholder", () => {
  /**
   * A placeholder is an example, and the reader's first query is usually one of
   * them. "NLP" and "Python" were in this list and both return nothing on this
   * board, so the first thing a reader tried would have answered "Nothing
   * matches" and looked like a filter that does not work.
   */
  it("every suggested term actually returns listings", () => {
    const source = readFileSync(new URL("../src/app/[lang]/stages/page.tsx", import.meta.url), "utf8");
    const placeholders = [...source.matchAll(/searchPlaceholder:\s*"([^"]+)"/g)].map((m) => m[1]);
    expect(placeholders.length).toBe(2);
    const stages = getStages();
    for (const line of placeholders) {
      const examples = line
        // Read from source, so the \uXXXX escapes are still literal text.
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
        .replace(/\u2026/g, "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      expect(examples.length).toBeGreaterThan(0);
      for (const example of examples) {
        const hits = stages.filter((s) =>
          matchesAllTerms(searchTerms(example), [s.role, s.company, s.city])
        ).length;
        expect(hits, `placeholder example "${example}" matches nothing`).toBeGreaterThan(0);
      }
    }
  });
});

describe("a listing nobody could verify", () => {
  /**
   * The weekly check cannot read the two BPCE postings: their server returns
   * the same JavaScript shell for every path, a slug that cannot exist
   * included, so a 200 from that host carries no information. Left as a plain
   * "needs a human" they would raise the review issue every week with
   * identical contents, and the week something real changed would look like the
   * fifty notifications before it.
   */
  it("records the judgment on the entries that cannot be verified", () => {
    const stages = getStages();
    const judged = stages.filter((s) => s.unverifiable);
    expect(judged.length).toBeGreaterThan(0);
    for (const s of judged) {
      expect(s.unverifiable).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // A judgment with no stated reason cannot be reviewed by the next person.
      expect(s.unverifiableReason, `${s.id} needs a reason`).toBeTruthy();
      // It must not also claim a fresh check: the two statements contradict.
      expect(s.checkedAt).not.toBe(s.unverifiable);
    }
  });

  it("lets the judgment expire rather than standing forever", () => {
    const judged = { unverifiable: "2026-10-05" } as never;
    expect(unverifiableJudgmentIsCurrent(judged, new Date("2026-11-01T12:00:00Z"))).toBe(true);
    const past = new Date(Date.parse("2026-10-05T12:00:00Z") + (UNVERIFIABLE_RECHECK_DAYS + 1) * 86_400_000);
    expect(unverifiableJudgmentIsCurrent(judged, past)).toBe(false);
  });

  it("refuses a future or malformed judgment date", () => {
    const now = new Date("2026-10-05T12:00:00Z");
    expect(unverifiableJudgmentIsCurrent({ unverifiable: "2027-01-01" } as never, now)).toBe(false);
    expect(unverifiableJudgmentIsCurrent({ unverifiable: "nope" } as never, now)).toBe(false);
    expect(unverifiableJudgmentIsCurrent({} as never, now)).toBe(false);
  });

  it("stops the weekly check asking for a judgment it already has", () => {
    const script = readFileSync(new URL("../scripts/check-stages.mjs", import.meta.url), "utf8");
    // Judged entries go to their own list, so they cannot reach the marker that
    // raises the review issue.
    expect(script).toMatch(/const settled = verdict === "CHECK" && judgmentIsCurrent\(stage\)/);
    expect(script).toMatch(/if \(settled\) known\.push/);
    expect(script).toMatch(/if \(results\.CHECK\.length \|\| results\.GONE\.length\)/);
    // And are still printed, so suppressing the ask never means hiding them.
    expect(script).toContain("Already judged");
  });

  it("shows the reader that the link was not verified, not a frozen date", () => {
    const source = readFileSync(new URL("../src/app/[lang]/stages/page.tsx", import.meta.url), "utf8");
    // The field itself, not the 90-day clock: whether a human owes a second
    // look does not change whether the link could be read.
    expect(source).toMatch(/\{stage\.unverifiable \? \(/);
    expect(source).toContain("notVerified");
    // The two branches are exclusive: never "link checked" and "could not
    // verify" on the same row.
    const block = source.slice(source.indexOf("{stage.unverifiable ? ("));
    expect(block.slice(0, 420)).toMatch(/\) : stage\.checkedAt \?/);
  });
});

describe("the list's freshness claim", () => {
  /**
   * getStagesLastCheckedAt takes the OLDEST check, which is the honest reading:
   * the list is confirmed only as far back as its weakest entry.
   *
   * That broke the moment two entries became permanently unverifiable. Their
   * checkedAt can never advance, so the date pinned to 2026-10-01 and, with
   * STALE_AFTER_DAYS at 14, the page would have shown "this list has not been
   * checked recently" from 2026-10-15 onward, forever, over two rows out of
   * 102. A warning that is always on is not a warning.
   */
  it("ignores entries whose check date can never advance", () => {
    const stages = getStages();
    const judged = stages.filter((s) => s.unverifiable);
    expect(judged.length).toBeGreaterThan(0);
    const floor = getStagesLastCheckedAt();
    for (const s of judged) {
      expect(s.checkedAt, `${s.id} is older than the floor it no longer sets`).not.toBe(floor);
      if (s.checkedAt) expect(s.checkedAt < floor).toBe(true);
    }
  });

  it("does not report the list as stale while the checkable links are fresh", () => {
    expect(getStagesCheckedAgeDays()).toBeLessThanOrEqual(STALE_AFTER_DAYS);
    expect(isStagesListStale()).toBe(false);
  });

  it("still takes the oldest of the checkable entries, not the newest", () => {
    const stages = getStages().filter((s) => !s.unverifiable);
    const dates = stages.map((s) => s.checkedAt).filter(Boolean) as string[];
    const oldest = dates.reduce((a, b) => (b < a ? b : a));
    expect(getStagesLastCheckedAt()).toBe(oldest);
  });

  it("keeps the script's re-ask window and the exported constant in step", () => {
    const script = readFileSync(new URL("../scripts/check-stages.mjs", import.meta.url), "utf8");
    const inScript = Number(script.match(/const UNVERIFIABLE_RECHECK_DAYS = (\d+)/)?.[1]);
    expect(inScript).toBe(UNVERIFIABLE_RECHECK_DAYS);
  });
});

describe("the freshness rule, kept in two places", () => {
  /**
   * getStagesLastCheckedAt decides what the page shows; the watchdog recomputes
   * the same thing from stages.json to warn a few days BEFORE the page would.
   * Two copies of one rule, and they drifted the moment unverifiable entries
   * existed: the page said "Last checked: today" while the watchdog said "4d
   * ago" about identical data, and because the watchdog warns first, the drift
   * was going to show up as a red check about a list that was fresh.
   */
  it("the watchdog excludes the same entries the page does", () => {
    const watchdog = readFileSync(new URL("../scripts/watchdog.mjs", import.meta.url), "utf8");
    expect(watchdog).toMatch(/\.filter\(\(i\) => !i\.unverifiable\)/);
    const source = readFileSync(new URL("../src/content/stages.ts", import.meta.url), "utf8");
    expect(source).toMatch(/filter\(\(item\) => !item\.unverifiable\)/);
  });

  it("both agree on the date for the data as it stands", () => {
    const stages = getStages();
    const watchdogFloor = stages
      .filter((s) => !s.unverifiable)
      .map((s) => s.checkedAt)
      .filter(Boolean)
      .sort()[0];
    expect(getStagesLastCheckedAt()).toBe(watchdogFloor);
  });
});
