import { NextResponse } from "next/server";
import { getClientIp, parseJsonBody } from "@/lib/request";
import { enforceRateLimitRules, rateLimitIdentifier } from "@/lib/rate-limit";
import { isTrustedMutationRequest } from "@/lib/security";
import { credentialEmailExists, ensureCredentialStoreReady } from "@/lib/auth-users";
import { isCredentialsAuthEnabled } from "@/lib/runtime-config";
import { isValidEmail, sanitizeEmailInput } from "@/lib/input";

type Payload = {
  email?: string;
  company?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isTrustedMutationRequest(request)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    if (!isCredentialsAuthEnabled()) {
      return NextResponse.json({ ok: false, error: "Credentials auth is disabled" }, { status: 404 });
    }

    const ip = getClientIp(request);
    const ipRateGate = await enforceRateLimitRules([
      { key: "credentials-check-email:endpoint", limit: 900, windowMs: 60 * 1000 },
      { key: `credentials-check-email:ip:${rateLimitIdentifier(ip)}`, limit: 20, windowMs: 10 * 60 * 1000 }
    ]);
    if (!ipRateGate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(ipRateGate.retryAfter) } }
      );
    }

    const parsedBody = await parseJsonBody<Payload>(request, { maxBytes: 4 * 1024 });
    if (!parsedBody.ok) {
      return NextResponse.json(
        { ok: false, error: parsedBody.error === "payload_too_large" ? "Payload too large" : "Invalid request body" },
        { status: parsedBody.error === "payload_too_large" ? 413 : 400 }
      );
    }

    const body = parsedBody.data;

    // Honeypot for bots.
    if (body.company?.trim()) {
      return NextResponse.json({ ok: true, exists: false });
    }

    const email = sanitizeEmailInput(body.email);
    if (!email || email.length > 254 || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const principalRateGate = await enforceRateLimitRules([
      { key: `credentials-check-email:email:${rateLimitIdentifier(email)}`, limit: 8, windowMs: 10 * 60 * 1000 },
      {
        key: `credentials-check-email:combo:${rateLimitIdentifier(`${email}:${ip}`)}`,
        limit: 6,
        windowMs: 10 * 60 * 1000
      }
    ]);
    if (!principalRateGate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(principalRateGate.retryAfter) } }
      );
    }

    try {
      await ensureCredentialStoreReady();
    } catch {
      return NextResponse.json({ ok: false, error: "Service unavailable" }, { status: 503 });
    }

    const result = await credentialEmailExists({ email });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: "Service unavailable" }, { status: 503 });
    }

    return NextResponse.json({ ok: true, exists: result.exists });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}
