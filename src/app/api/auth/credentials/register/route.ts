import { NextResponse } from "next/server";
import { getClientIp, parseJsonBody } from "@/lib/request";
import { enforceRateLimitRules, rateLimitIdentifier } from "@/lib/rate-limit";
import { AUTH_SESSION_COOKIE, createSessionToken } from "@/lib/auth-session";
import { isTrustedMutationRequest } from "@/lib/security";
import { normalizeLocale, normalizeSource, subscribeConvertKit } from "@/lib/convertkit";
import { ensureCredentialStoreReady, registerCredentialUser } from "@/lib/auth-users";
import { validatePassword } from "@/lib/password";
import { isCredentialsAuthEnabled } from "@/lib/runtime-config";
import { isValidEmail, sanitizeEmailInput, sanitizeSourceInput, sanitizeTextInput } from "@/lib/input";
import { verifyBotChallenge } from "@/lib/bot-protection";

type Payload = {
  email?: string;
  name?: string;
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
      { key: "credentials-register:endpoint", limit: 600, windowMs: 60 * 1000 },
      { key: `credentials-register:ip:${rateLimitIdentifier(ip)}`, limit: 6, windowMs: 10 * 60 * 1000 }
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
    const name = sanitizeTextInput(body.name, { maxLength: 80 });
    const password = body.password || "";

    if (!email || email.length > 254 || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const principalRateGate = await enforceRateLimitRules([
      { key: `credentials-register:email:${rateLimitIdentifier(email)}`, limit: 4, windowMs: 60 * 60 * 1000 },
      {
        key: `credentials-register:combo:${rateLimitIdentifier(`${email}:${ip}`)}`,
        limit: 3,
        windowMs: 30 * 60 * 1000
      }
    ]);
    if (!principalRateGate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(principalRateGate.retryAfter) } }
      );
    }

    const botResult = await verifyBotChallenge(body.botToken, ip);
    if (!botResult.ok) {
      const status = botResult.reason === "provider_unavailable" ? 503 : 403;
      return NextResponse.json({ ok: false, error: "Request verification failed" }, { status });
    }

    if (!name || name.length > 80) {
      return NextResponse.json({ ok: false, error: "Invalid name" }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ ok: false, error: passwordError }, { status: 400 });
    }

    try {
      await ensureCredentialStoreReady();
    } catch {
      return NextResponse.json({ ok: false, error: "Service unavailable" }, { status: 503 });
    }

    const createResult = await registerCredentialUser({ email, name, password });
    if (!createResult.ok) {
      return NextResponse.json({ ok: false, error: "Unable to create account" }, { status: 400 });
    }

    const locale = normalizeLocale(body.locale);
    const source = normalizeSource(sanitizeSourceInput(body.source, "auth_register_credentials"), "auth_register_credentials");
    await subscribeConvertKit({
      email,
      firstName: name,
      locale,
      source,
      extraTags: ["account_register", "auth_credentials"]
    });

    const response = NextResponse.json({
      ok: true,
      authenticated: true,
      redirectTo: `/${locale}/account?auth=success`,
      message: "Account created successfully."
    });

    const sessionToken = createSessionToken({
      provider: "credentials",
      providerUserId: createResult.user.id,
      email: createResult.user.email,
      name: createResult.user.name
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
