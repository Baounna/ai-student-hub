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
const ttlFlags = new Map<string, number>();
const MAX_MEMORY_KEYS = 10_000;
const LOGIN_FAILURE_WINDOW_MS = 60 * 60 * 1000;

function nowMs() {
  return Date.now();
}

function trimExpiredMaps(now: number) {
  if (counterBuckets.size > MAX_MEMORY_KEYS) {
    counterBuckets.forEach((bucket, key) => {
      if (bucket.resetAt <= now) counterBuckets.delete(key);
    });
  }

  if (ttlFlags.size > MAX_MEMORY_KEYS) {
    ttlFlags.forEach((expiresAt, key) => {
      if (expiresAt <= now) ttlFlags.delete(key);
    });
  }
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

async function upstashSetFlagTtl(key: string, ttlMs: number) {
  const ttl = Math.max(1, Math.trunc(ttlMs));
  await upstashPipeline([["SET", key, "1", "PX", ttl]]);
}

async function upstashGetFlagTtl(key: string) {
  const data = await upstashPipeline([["PTTL", key]]);
  if (!data || !data.length) return null;
  return Math.max(0, safeInt(data[0]?.result, 0));
}

async function upstashDeleteKeys(keys: string[]) {
  if (!keys.length) return;
  await upstashPipeline([["DEL", ...keys]]);
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

function memorySetFlagTtl(key: string, ttlMs: number) {
  const now = nowMs();
  trimExpiredMaps(now);
  ttlFlags.set(key, now + Math.max(1, Math.trunc(ttlMs)));
}

function memoryGetFlagTtl(key: string) {
  const now = nowMs();
  const expiresAt = ttlFlags.get(key);
  if (!expiresAt) return 0;
  if (expiresAt <= now) {
    ttlFlags.delete(key);
    return 0;
  }
  return Math.max(1, expiresAt - now);
}

function memoryDeleteKeys(keys: string[]) {
  for (const key of keys) {
    counterBuckets.delete(key);
    ttlFlags.delete(key);
  }
}

async function bumpCounter(key: string, windowMs: number): Promise<CounterState> {
  const scoped = ns(key);

  if (hasUpstash()) {
    const state = await upstashIncrWithWindow(scoped, windowMs);
    if (state) return state;
  }

  return memoryIncrWithWindow(scoped, windowMs);
}

async function setFlagTtl(key: string, ttlMs: number) {
  const scoped = ns(key);
  if (hasUpstash()) {
    await upstashSetFlagTtl(scoped, ttlMs);
    return;
  }
  memorySetFlagTtl(scoped, ttlMs);
}

async function getFlagTtl(key: string) {
  const scoped = ns(key);
  if (hasUpstash()) {
    const ttl = await upstashGetFlagTtl(scoped);
    if (ttl !== null) return ttl;
  }
  return memoryGetFlagTtl(scoped);
}

async function deleteKeys(keys: string[]) {
  const scoped = keys.map((key) => ns(key));
  if (!scoped.length) return;
  if (hasUpstash()) {
    await upstashDeleteKeys(scoped);
    return;
  }
  memoryDeleteKeys(scoped);
}

export function rateLimitIdentifier(value: string) {
  return createHash("sha256").update(String(value || "").trim().toLowerCase()).digest("hex").slice(0, 24);
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
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

function lockDurationSecondsFromFailures(failures: number) {
  if (failures >= 12) return 30 * 60;
  if (failures >= 10) return 10 * 60;
  if (failures >= 8) return 5 * 60;
  if (failures >= 6) return 60;
  if (failures >= 5) return 15;
  return 0;
}

function lockKeys(emailHash: string, ipHash: string) {
  return {
    email: `auth_lock:email:${emailHash}`,
    combo: `auth_lock:combo:${emailHash}:${ipHash}`
  };
}

function failKeys(emailHash: string, ipHash: string) {
  return {
    email: `auth_fail:email:${emailHash}`,
    combo: `auth_fail:combo:${emailHash}:${ipHash}`
  };
}

export async function getLoginLockStatus(email: string, ip: string): Promise<{ locked: boolean; retryAfter: number }> {
  const emailHash = rateLimitIdentifier(email);
  const ipHash = rateLimitIdentifier(ip);
  const keys = lockKeys(emailHash, ipHash);

  const [emailTtl, comboTtl] = await Promise.all([getFlagTtl(keys.email), getFlagTtl(keys.combo)]);
  const ttlMs = Math.max(emailTtl, comboTtl);
  if (ttlMs <= 0) return { locked: false, retryAfter: 0 };

  return { locked: true, retryAfter: toRetrySeconds(ttlMs) };
}

export async function recordFailedLoginAttempt(email: string, ip: string) {
  const emailHash = rateLimitIdentifier(email);
  const ipHash = rateLimitIdentifier(ip);
  const fail = failKeys(emailHash, ipHash);
  const lock = lockKeys(emailHash, ipHash);

  const [emailFailState, comboFailState] = await Promise.all([
    bumpCounter(fail.email, LOGIN_FAILURE_WINDOW_MS),
    bumpCounter(fail.combo, LOGIN_FAILURE_WINDOW_MS)
  ]);

  const failures = Math.max(emailFailState.count, comboFailState.count);
  const lockSeconds = lockDurationSecondsFromFailures(failures);

  if (lockSeconds > 0) {
    const lockMs = lockSeconds * 1000;
    await Promise.all([setFlagTtl(lock.email, lockMs), setFlagTtl(lock.combo, lockMs)]);
  }

  return {
    failures,
    lockSeconds
  };
}

export async function clearFailedLoginAttempts(email: string, ip: string) {
  const emailHash = rateLimitIdentifier(email);
  const ipHash = rateLimitIdentifier(ip);
  const fail = failKeys(emailHash, ipHash);
  const lock = lockKeys(emailHash, ipHash);
  await deleteKeys([fail.email, fail.combo, lock.email, lock.combo]);
}
