import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_SESSION_COOKIE = "ash_session";
const DEV_FALLBACK_SECRET = "dev-auth-session-secret-not-for-production";
const MAX_TOKEN_LENGTH = 4096;
const PROVIDERS = new Set(["google", "github", "linkedin", "email"]);

export type SessionUser = {
  provider: "google" | "github" | "linkedin" | "email";
  providerUserId: string;
  email: string;
  name: string;
  avatarUrl?: string;
};

type SessionPayload = SessionUser & {
  iat: number;
  exp: number;
};

function isStrongSecret(value: string) {
  return Boolean(value) && value !== "change-this-in-production" && value.length >= 32;
}

function getSessionSecret(forSigning: true): string;
function getSessionSecret(forSigning: false): string | null;
function getSessionSecret(forSigning: boolean) {
  const raw = process.env.AUTH_SESSION_SECRET?.trim() || "";
  if (isStrongSecret(raw)) return raw;

  if (process.env.NODE_ENV === "production") {
    if (forSigning) {
      throw new Error("AUTH_SESSION_SECRET is required and must be at least 32 characters in production.");
    }
    return null;
  }

  return DEV_FALLBACK_SECRET;
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  const secret = getSessionSecret(true);
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionToken(user: SessionUser, maxAgeSeconds = 60 * 60 * 24 * 30) {
  if (!PROVIDERS.has(user.provider)) {
    throw new Error("Invalid auth provider.");
  }
  if (!user.email || user.email.length > 254 || !/^\S+@\S+\.\S+$/.test(user.email)) {
    throw new Error("Invalid session email.");
  }
  if (!user.name || user.name.length > 120) {
    throw new Error("Invalid session user name.");
  }
  if (!user.providerUserId || user.providerUserId.length > 200) {
    throw new Error("Invalid provider user id.");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...user,
    iat: now,
    exp: now + maxAgeSeconds
  };

  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function parseSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  if (token.length > MAX_TOKEN_LENGTH) return null;

  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  const secret = getSessionSecret(false);
  if (!secret) return null;

  const expectedSignature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  const sigBuffer = Buffer.from(encodedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    if (!payload?.email || !payload?.provider || !payload?.exp || !payload?.iat) return null;
    if (!PROVIDERS.has(payload.provider)) return null;
    if (payload.email.length > 254 || !/^\S+@\S+\.\S+$/.test(payload.email)) return null;
    if (!payload.name || payload.name.length > 120) return null;
    if (!payload.providerUserId || payload.providerUserId.length > 200) return null;
    if (!Number.isFinite(payload.exp) || !Number.isFinite(payload.iat)) return null;
    if (payload.iat > payload.exp) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
