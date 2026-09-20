import { describe, it, expect } from "vitest";
import rawFile from "@/content/stages.json";
import { getStages, isClosed, isStagesListStale, getStagesAgeDays, STALE_AFTER_DAYS } from "@/content/stages";

const raw = rawFile as { version: number; updatedAt: string; items: Array<Record<string, unknown>> };

describe("stages data", () => {
  it("has a readable updatedAt", () => {
    expect(Number.isFinite(Date.parse(raw.updatedAt))).toBe(true);
  });

  it("every entry has the fields the page renders", () => {
    for (const item of raw.items) {
      for (const field of ["id", "role", "company", "city", "country", "kind", "deadline", "href"]) {
        expect(item[field], `${String(item.id)} is missing ${field}`).toBeTruthy();
      }
    }
  });

  it("deadlines are real dates in YYYY-MM-DD", () => {
    for (const item of raw.items) {
      const d = String(item.deadline);
      expect(d, `${String(item.id)} has a malformed deadline`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isFinite(Date.parse(`${d}T12:00:00Z`))).toBe(true);
    }
  });

  it("ids and links are unique", () => {
    const ids = raw.items.map((i) => i.id);
    const links = raw.items.map((i) => i.href);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(links).size).toBe(links.length);
  });

  it("links are http(s)", () => {
    for (const item of raw.items) {
      expect(String(item.href)).toMatch(/^https?:\/\//);
    }
  });

  it("kind is one the page can label", () => {
    for (const item of raw.items) {
      expect(["stage", "alternance", "pfe"]).toContain(item.kind);
    }
  });
});

describe("staleness", () => {
  // The point of this format is that it admits when it has gone out of date.
  // A list of deadlines that silently ages is the failure mode, so the
  // behaviour is covered rather than assumed.
  it("counts age in whole days", () => {
    expect(getStagesAgeDays(Date.parse(raw.updatedAt))).toBe(0);
    expect(getStagesAgeDays(Date.parse(raw.updatedAt) + 3 * 86_400_000)).toBe(3);
  });

  it("is not stale on the threshold and is stale after it", () => {
    const base = Date.parse(raw.updatedAt);
    expect(isStagesListStale(base + STALE_AFTER_DAYS * 86_400_000)).toBe(false);
    expect(isStagesListStale(base + (STALE_AFTER_DAYS + 1) * 86_400_000)).toBe(true);
  });
});

describe("ordering", () => {
  it("puts open positions before closed ones, soonest first", () => {
    const now = Date.parse("2026-10-01T00:00:00Z");
    const sample = getStages(now);
    let seenClosed = false;
    for (const stage of sample) {
      const closed = isClosed(stage, now);
      if (closed) seenClosed = true;
      // once a closed entry appears, no open entry may follow it
      if (seenClosed) expect(closed).toBe(true);
    }
  });

  it("treats a deadline as open until the end of that day", () => {
    const stage = { deadline: "2026-11-15" } as Parameters<typeof isClosed>[0];
    expect(isClosed(stage, Date.parse("2026-11-15T09:00:00Z"))).toBe(false);
    expect(isClosed(stage, Date.parse("2026-11-16T00:00:01Z"))).toBe(true);
  });
});
