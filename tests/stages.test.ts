import { describe, it, expect } from "vitest";
import rawFile from "@/content/stages.json";
import {
  getStages,
  isClosed,
  isStagesListStale,
  getStagesAgeDays,
  getStagesCheckedAgeDays,
  getStagesLastCheckedAt,
  STALE_AFTER_DAYS
} from "@/content/stages";

const raw = rawFile as { version: number; updatedAt: string; items: Array<Record<string, unknown>> };

describe("stages data", () => {
  it("has a readable updatedAt", () => {
    expect(Number.isFinite(Date.parse(raw.updatedAt))).toBe(true);
  });

  it("every entry has the fields the page renders", () => {
    for (const item of raw.items) {
      for (const field of ["id", "role", "company", "city", "country", "kind", "href"]) {
        expect(item[field], `${String(item.id)} is missing ${field}`).toBeTruthy();
      }
    }
  });

  // A deadline is optional because most postings publish none. When one is
  // present it has to be a real date; when absent the field must be absent
  // rather than an empty string or a placeholder standing in for a fact.
  it("deadlines, where present, are real dates in YYYY-MM-DD", () => {
    for (const item of raw.items) {
      if (item.deadline === undefined) continue;
      const d = String(item.deadline);
      expect(d, `${String(item.id)} has a malformed deadline`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isFinite(Date.parse(`${d}T12:00:00Z`))).toBe(true);
    }
  });

  it("never stores an empty deadline instead of omitting it", () => {
    for (const item of raw.items) {
      expect(item.deadline, `${String(item.id)} has a blank deadline`).not.toBe("");
      expect(item.deadline).not.toBeNull();
    }
  });

  it("records when each link was last checked", () => {
    for (const item of raw.items) {
      const checked = String(item.checkedAt ?? "");
      expect(checked, `${String(item.id)} has no checkedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
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

// The page used to headline updatedAt, which moves whenever anything writes the
// file, so it announced "last checked: today" above rows that each said they
// were checked the day before. The headline has to be something every row can
// support, which is the oldest per-entry check.
describe("freshness headline", () => {
  it("reports the oldest per-entry check, not the file's own timestamp", () => {
    const oldest = raw.items
      .map((i) => String(i.checkedAt))
      .reduce((a, b) => (b < a ? b : a));
    expect(getStagesLastCheckedAt()).toBe(oldest);
  });

  it("never claims to be fresher than its stalest entry", () => {
    const checkedMs = Date.parse(`${getStagesLastCheckedAt()}T12:00:00Z`);
    const updatedMs = Date.parse(raw.updatedAt);
    const now = updatedMs + 5 * 86_400_000;
    expect(getStagesCheckedAgeDays(now)).toBeGreaterThanOrEqual(
      Math.floor((now - Math.max(checkedMs, updatedMs)) / 86_400_000)
    );
  });

  it("counts the check age in whole days from a supplied clock", () => {
    const base = Date.parse(`${getStagesLastCheckedAt()}T12:00:00Z`);
    expect(getStagesCheckedAgeDays(base)).toBe(0);
    expect(getStagesCheckedAgeDays(base + 3 * 86_400_000)).toBe(3);
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

  // Marking a rolling posting "Closed" costs a student the application they
  // would have sent. Not knowing the cutoff is not the same as knowing it passed.
  it("never calls a posting with no stated deadline closed", () => {
    const rolling = {} as Parameters<typeof isClosed>[0];
    expect(isClosed(rolling, Date.parse("2030-01-01T00:00:00Z"))).toBe(false);
  });

  it("shows dated openings before rolling ones", () => {
    const now = Date.parse("2026-10-01T00:00:00Z");
    const sample = getStages(now).filter((s) => !isClosed(s, now));
    let seenRolling = false;
    for (const stage of sample) {
      if (!stage.deadline) seenRolling = true;
      else expect(seenRolling, `${stage.id} is dated but follows a rolling entry`).toBe(false);
    }
  });
});
