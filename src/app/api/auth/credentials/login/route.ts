import { NextResponse } from "next/server";
import { getClientIp, parseJsonBody } from "@/lib/request";
import {
  clearFailedLoginAttempts,
  enforceRateLimitRules,
  getLoginLockStatus,
  rateLimitIdentifier,
  recordFailedLoginAttempt
} from "@/lib/rate-limit";
import { AUTH_SESSION_COOKIE, createSessionToken } from "@/lib/auth-session";
import { isTrustedMutationRequest } from "@/lib/security";
import { normalizeLocale, normalizeSource, subscribeConvertKit } from "@/lib/convertkit";
import { authenticateCredentialUser, ensureCredentialStoreReady } from "@/lib/auth-users";
import { isCredentialsAuthEnabled } from "@/lib/runtime-config";
import { isValidEmail, sanitizeEmailInput, sanitizeSourceInput } from "@/lib/input";
import { verifyBotChallenge } from "@/lib/bot-protection";

type Payload = {
  email?: string;
  password?: string;
  locale?: string;
  source?: string;
  company?: string;
  botToken?: string;
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
      { key: "credentials-login:endpoint", limit: 1200, windowMs: 60 * 1000 },
      { key: `credentials-login:ip:${rateLimitIdentifier(ip)}`, limit: 12, windowMs: 10 * 60 * 1000 }
    ]);
    if (!ipRateGate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(ipRateGate.retryAfter) } }
      );
    }

    const parsedBody = await parseJsonBody<Payload>(request, { maxBytes: 10 * 1024 });
    if (!parsedBody.ok) {
      return NextResponse.json(
        { ok: false, error: parsedBody.error === "payload_too_large" ? "Payload too large" : "Invalid request body" },
        { status: parsedBody.error === "payload_too_large" ? 413 : 400 }
      );
    }
    const body = parsedBody.data;

    if (body.company?.trim()) {
      return NextResponse.json({ ok: true });
    }

    const email = sanitizeEmailInput(body.email);
    const password = body.password || "";

    if (!email || email.length > 254 || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    const principalRateGate = await enforceRateLimitRules([
      { key: `credentials-login:email:${rateLimitIdentifier(email)}`, limit: 12, windowMs: 10 * 60 * 1000 },
      {
        key: `credentials-login:combo:${rateLimitIdentifier(`${email}:${ip}`)}`,
        limit: 8,
        windowMs: 10 * 60 * 1000
      }
    ]);
    if (!principalRateGate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(principalRateGate.retryAfter) } }
      );
    }

    const lockStatus = await getLoginLockStatus(email, ip);
    if (lockStatus.locked) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(lockStatus.retryAfter) } }
      );
    }

    const botResult = await verifyBotChallenge(body.botToken, ip);
    if (!botResult.ok) {
      const status = botResult.reason === "provider_unavailable" ? 503 : 403;
      return NextResponse.json({ ok: false, error: "Request verification failed" }, { status });
    }

    if (!password || password.length > 128) {
      await recordFailedLoginAttempt(email, ip);
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    try {
      await ensureCredentialStoreReady();
    } catch {
      return NextResponse.json({ ok: false, error: "Service unavailable" }, { status: 503 });
    }

    const authResult = await authenticateCredentialUser({ email, password });
    if (!authResult.ok) {
      const failure = await recordFailedLoginAttempt(email, ip);
      if (failure.lockSeconds > 0) {
        return NextResponse.json(
          { ok: false, error: "Too many requests" },
          { status: 429, headers: { "Retry-After": String(failure.lockSeconds) } }
        );
      }
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }
    await clearFailedLoginAttempts(email, ip);

    const locale = normalizeLocale(body.locale);
    const source = normalizeSource(sanitizeSourceInput(body.source, "auth_login_credentials"), "auth_login_credentials");
    await subscribeConvertKit({
      email,
      firstName: authResult.user.name,
      locale,
      source,
      extraTags: ["account_login", "auth_credentials"]
    });

    const response = NextResponse.json({
      ok: true,
      authenticated: true,
      redirectTo: `/${locale}/account?auth=success`,
      message: "Signed in successfully."
    });

    const sessionToken = createSessionToken({
      provider: "credentials",
      providerUserId: authResult.user.id,
      email: authResult.user.email,
      name: authResult.user.name
    });

    response.cookies.set(AUTH_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      priority: "high"
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}
