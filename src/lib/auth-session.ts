import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_SESSION_COOKIE = "ash_session";

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

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET?.trim() || "change-this-in-production";
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(user: SessionUser, maxAgeSeconds = 60 * 60 * 24 * 30) {
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

  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  const expectedSignature = sign(encodedPayload);
  const sigBuffer = Buffer.from(encodedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    if (!payload?.email || !payload?.provider || !payload?.exp) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
