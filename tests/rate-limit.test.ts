import { describe, it, expect } from "vitest";
import { evictToBound } from "@/lib/rate-limit";

// The TS target here predates Map iteration, so keys are collected the long way.
function keysOf(m: Map<string, { resetAt: number }>) {
  const out: string[] = [];
  m.forEach((_v, k) => out.push(k));
  return out;
}

function fill(n: number, resetAt: (i: number) => number) {
  const m = new Map<string, { resetAt: number }>();
  for (let i = 0; i < n; i += 1) m.set(`k${i}`, { resetAt: resetAt(i) });
  return m;
}

// The bug this covers: the old code only deleted *expired* entries, and only
// once the map was already over the threshold. A flood of keys that were all
// still inside their window deleted nothing, so the "max" was not a max and
// memory grew without limit.
describe("memory bucket eviction", () => {
  const NOW = 1_000_000;

  it("leaves the map alone while it is under the cap", () => {
    const m = fill(50, () => NOW + 60_000);
    evictToBound(m, NOW, 100, 80);
    expect(m.size).toBe(50);
  });

  it("bounds a map whose entries have all expired", () => {
    const m = fill(500, () => NOW - 1);
    evictToBound(m, NOW, 100, 80);
    expect(m.size).toBe(0);
  });

  it("bounds a map where nothing has expired yet", () => {
    const m = fill(500, (i) => NOW + 60_000 + i);
    evictToBound(m, NOW, 100, 80);
    expect(m.size).toBe(80);
  });

  it("evicts the soonest-to-expire first, keeping the longest-lived limits", () => {
    const m = fill(10, (i) => NOW + (i + 1) * 1_000);
    evictToBound(m, NOW, 5, 3);
    // k0..k6 expire soonest and go; the three with the most time left survive.
    expect(keysOf(m).sort()).toEqual(["k7", "k8", "k9"]);
  });

  it("prefers dropping expired entries over live ones", () => {
    const m = new Map<string, { resetAt: number }>();
    for (let i = 0; i < 90; i += 1) m.set(`dead${i}`, { resetAt: NOW - 1 });
    for (let i = 0; i < 20; i += 1) m.set(`live${i}`, { resetAt: NOW + 60_000 });
    evictToBound(m, NOW, 100, 80);
    // Clearing the 90 expired entries alone drops it to 20, under the target,
    // so every live counter survives and nobody's limit is silently reset.
    expect(m.size).toBe(20);
    expect(keysOf(m).every((k) => k.startsWith("live"))).toBe(true);
  });

  it("leaves the map at or below the target whatever the input", () => {
    for (const n of [101, 1_000, 5_000]) {
      const m = fill(n, (i) => (i % 2 ? NOW - 1 : NOW + 60_000));
      evictToBound(m, NOW, 100, 80);
      expect(m.size).toBeLessThanOrEqual(80);
    }
  });
});
