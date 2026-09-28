import { describe, it, expect } from "vitest";
import { enforceRateLimitRules, evictToBound } from "@/lib/rate-limit";

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


/**
 * The bug this covers: every rule increments its own counter as it is checked,
 * so checking a wide shared rule before a narrow per-client one let a client
 * that was about to be rejected spend the shared budget first. Measured against
 * the real endpoint: one client sending 1300 newsletter requests in two seconds
 * got 1296 of its own rejected and still exhausted the shared bucket, so an
 * unrelated visitor got 429 for the rest of the minute. After the fix that
 * visitor gets 200.
 *
 * These drive the exported function rather than re-deriving the ordering, so
 * they fail if the sort is removed.
 */
describe("enforceRateLimitRules ordering", () => {
  const unique = () => Math.random().toString(36).slice(2);

  it("does not let a throttled client drain the shared budget", async () => {
    const shared = `shared:${unique()}`;
    const attacker = `ip:${unique()}`;
    const bystander = `ip:${unique()}`;
    const wide = { key: shared, limit: 5, windowMs: 60_000 };

    // Deliberately wide-first: this is the order the newsletter route used.
    let attackerAllowed = 0;
    for (let i = 0; i < 20; i += 1) {
      const result = await enforceRateLimitRules([wide, { key: attacker, limit: 2, windowMs: 60_000 }]);
      if (result.allowed) attackerAllowed += 1;
    }
    expect(attackerAllowed).toBe(2);

    // The shared bucket should have taken 2 hits, not 20, so someone else can
    // still get through. Before the fix this was false and they were locked out.
    let bystanderAllowed = 0;
    for (let i = 0; i < 3; i += 1) {
      const result = await enforceRateLimitRules([wide, { key: bystander, limit: 2, windowMs: 60_000 }]);
      if (result.allowed) bystanderAllowed += 1;
    }
    expect(bystanderAllowed).toBeGreaterThan(0);
  });

  it("still enforces the shared rule once genuine traffic reaches it", async () => {
    const shared = `shared:${unique()}`;
    const wide = { key: shared, limit: 3, windowMs: 60_000 };

    let allowed = 0;
    for (let i = 0; i < 6; i += 1) {
      // A fresh per-client key each time: nothing is throttled per client, so
      // the shared limit is the only thing that can stop this.
      const result = await enforceRateLimitRules([wide, { key: `ip:${unique()}`, limit: 50, windowMs: 60_000 }]);
      if (result.allowed) allowed += 1;
    }

    expect(allowed).toBe(3);
  });

  it("reports the retry window of the rule that actually rejected", async () => {
    const client = `ip:${unique()}`;
    const rules = [
      { key: `shared:${unique()}`, limit: 100, windowMs: 60_000 },
      { key: client, limit: 1, windowMs: 600_000 }
    ];

    await enforceRateLimitRules(rules);
    const rejected = await enforceRateLimitRules(rules);

    expect(rejected.allowed).toBe(false);
    // The old order answered with the 60s shared window while the client was
    // actually blocked for ten minutes.
    expect(rejected.retryAfter).toBeGreaterThan(60);
  });
});
