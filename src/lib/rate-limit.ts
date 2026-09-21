import { createHash } from "node:crypto";

export type RateLimitResult = {
  allowed: boolean;
  retryAfter: number;
};

export type RateLimitRule = {
  key: string;
  limit: number;
  windowMs: number;
};

type CounterState = {
  count: number;
  ttlMs: number;
};

type MemoryBucket = {
  count: number;
  resetAt: number;
};

const counterBuckets = new Map<string, MemoryBucket>();
const MAX_MEMORY_KEYS = 10_000;
/** Sweeps evict down to here, so the next sweep is thousands of requests away. */
const TARGET_MEMORY_KEYS = 8_000;

function nowMs() {
  return Date.now();
}

/**
 * MAX_MEMORY_KEYS used to be a threshold for sweeping expired entries, not a
 * cap. If every key was still inside its window nothing was deleted and the map
 * grew without limit, which is the opposite of what the name promised. Worse,
 * once past the threshold every single request walked the whole map, so the
 * more distinct keys an attacker created the more work each later request did.
 *
 * Now it evicts down to a low-water mark, so a sweep buys headroom for the next
 * few thousand inserts instead of running again on the very next request.
 *
 * Evicting a live counter does reset someone's limit, so the order matters:
 * soonest-to-expire goes first, since those were about to reset anyway. This is
 * still a best-effort fallback. A serverless instance holds its own map, so a
 * limit of N allows up to N per instance. Upstash is the real answer, and the
 * code already prefers it whenever the environment supplies it.
 */
export function evictToBound(
  buckets: Map<string, { resetAt: number }>,
  now: number,
  max: number,
  target: number
) {
  if (buckets.size <= max) return;

  // forEach rather than for..of: the TS target here predates Map iteration.
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) buckets.delete(key);
  });

  if (buckets.size <= target) return;

  const byExpiry: Array<{ key: string; resetAt: number }> = [];
  buckets.forEach((bucket, key) => {
    byExpiry.push({ key, resetAt: bucket.resetAt });
  });
  byExpiry.sort((a, b) => a.resetAt - b.resetAt);

  for (let i = 0; i < byExpiry.length && buckets.size > target; i += 1) {
    buckets.delete(byExpiry[i].key);
  }
}

function trimExpiredMaps(now: number) {
  evictToBound(counterBuckets, now, MAX_MEMORY_KEYS, TARGET_MEMORY_KEYS);
}

function safeInt(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return Number.parseInt(value, 10);
  return fallback;
}

function toRetrySeconds(ttlMs: number) {
  return Math.max(1, Math.ceil(Math.max(0, ttlMs) / 1000));
}

function normalizeKey(raw: string) {
  return raw.trim().replace(/\s+/g, "_").toLowerCase().slice(0, 220);
}

function ns(key: string) {
  return `ash:${normalizeKey(key)}`;
}

function upstashConfig() {
  const baseUrl = (process.env.UPSTASH_REDIS_REST_URL || "").trim().replace(/\/+$/, "");
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  if (!baseUrl || !token) return null;
  return { baseUrl, token };
}

function hasUpstash() {
  return Boolean(upstashConfig());
}

async function upstashPipeline(commands: Array<Array<string | number>>) {
  const config = upstashConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.baseUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(4_000)
    });

    if (!response.ok) return null;
    const data = (await response.json()) as Array<{ result?: unknown }>;
    return data;
  } catch {
    return null;
  }
}

async function upstashIncrWithWindow(key: string, windowMs: number): Promise<CounterState | null> {
  const data = await upstashPipeline([
    ["INCR", key],
    ["PEXPIRE", key, Math.max(1, Math.trunc(windowMs)), "NX"],
    ["PTTL", key]
  ]);
  if (!data || data.length < 3) return null;

  const count = safeInt(data[0]?.result, 1);
  const ttlMs = Math.max(1, safeInt(data[2]?.result, windowMs));
  return { count, ttlMs };
}




function memoryIncrWithWindow(key: string, windowMs: number): CounterState {
  const now = nowMs();
  trimExpiredMaps(now);
  const existing = counterBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + Math.max(1, Math.trunc(windowMs));
    counterBuckets.set(key, { count: 1, resetAt });
    return { count: 1, ttlMs: resetAt - now };
  }

  existing.count += 1;
  counterBuckets.set(key, existing);
  return { count: existing.count, ttlMs: Math.max(1, existing.resetAt - now) };
}




async function bumpCounter(key: string, windowMs: number): Promise<CounterState> {
  const scoped = ns(key);

  if (hasUpstash()) {
    const state = await upstashIncrWithWindow(scoped, windowMs);
    if (state) return state;
  }

  return memoryIncrWithWindow(scoped, windowMs);
}




export function rateLimitIdentifier(value: string) {
  return createHash("sha256").update(String(value || "").trim().toLowerCase()).digest("hex").slice(0, 24);
}

async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const safeLimit = Math.max(1, Math.trunc(limit));
  const safeWindow = Math.max(500, Math.trunc(windowMs));
  const state = await bumpCounter(`rate:${key}`, safeWindow);

  if (state.count > safeLimit) {
    return {
      allowed: false,
      retryAfter: toRetrySeconds(state.ttlMs)
    };
  }

  return {
    allowed: true,
    retryAfter: 0
  };
}

export async function enforceRateLimitRules(rules: RateLimitRule[]): Promise<RateLimitResult> {
  for (const rule of rules) {
    const result = await rateLimit(rule.key, rule.limit, rule.windowMs);
    if (!result.allowed) return result;
  }

  return { allowed: true, retryAfter: 0 };
}






