import { createHash } from "node:crypto";

const DEFAULT_REVOKE_TTL_SECONDS = 60 * 60 * 24 * 30;
const revokedMemory = new Map<string, number>();

function upstashConfig() {
  const baseUrl = (process.env.UPSTASH_REDIS_REST_URL || "").trim().replace(/\/+$/, "");
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  if (!baseUrl || !token) return null;
  return { baseUrl, token };
}

function digestSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function revokedKey(token: string) {
  return `ash:session:revoked:${digestSessionToken(token)}`;
}

function cleanupMemory() {
  const now = Date.now();
  revokedMemory.forEach((expiresAt, key) => {
    if (expiresAt <= now) revokedMemory.delete(key);
  });
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
    return (await response.json()) as Array<{ result?: unknown }>;
  } catch {
    return null;
  }
}

function resolveTtlSeconds(expiryEpochSeconds?: number) {
  if (!Number.isFinite(expiryEpochSeconds)) return DEFAULT_REVOKE_TTL_SECONDS;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const ttl = Math.trunc((expiryEpochSeconds as number) - nowSeconds);
  return Math.max(1, Math.min(ttl, DEFAULT_REVOKE_TTL_SECONDS));
}

export async function revokeSessionToken(token: string, expiryEpochSeconds?: number) {
  const cleanToken = String(token || "").trim();
  if (!cleanToken) return;

  const ttlSeconds = resolveTtlSeconds(expiryEpochSeconds);
  const key = revokedKey(cleanToken);

  const result = await upstashPipeline([["SET", key, "1", "EX", ttlSeconds]]);
  if (result) return;

  cleanupMemory();
  revokedMemory.set(key, Date.now() + ttlSeconds * 1000);
}

export async function isSessionTokenRevoked(token: string) {
  const cleanToken = String(token || "").trim();
  if (!cleanToken) return true;

  const key = revokedKey(cleanToken);
  const upstashResult = await upstashPipeline([["EXISTS", key]]);
  if (upstashResult && upstashResult.length > 0) {
    const exists = Number(upstashResult[0]?.result || 0);
    return exists > 0;
  }

  cleanupMemory();
  const expiresAt = revokedMemory.get(key);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    revokedMemory.delete(key);
    return false;
  }
  return true;
}
