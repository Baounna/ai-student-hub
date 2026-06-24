import { NextResponse } from "next/server";
import { getClientIp, parseJsonBody } from "@/lib/request";
import { enforceRateLimitRules, rateLimitIdentifier } from "@/lib/rate-limit";
import { normalizeLocale, normalizeSource, subscribeConvertKit } from "@/lib/convertkit";
import { AUTH_SESSION_COOKIE, createSessionToken } from "@/lib/auth-session";
import { isInsecureEmailAuthAllowed } from "@/lib/runtime-config";
import { isTrustedMutationRequest } from "@/lib/security";
import { isValidEmail, sanitizeEmailInput, sanitizeSourceInput, sanitizeTextInput } from "@/lib/input";
import { verifyBotChallenge } from "@/lib/bot-protection";

type AccountPayload = {
  email?: string;
  name?: string;
  mode?: "register" | "login";
  locale?: string;
  source?: string;
  company?: string;
  botToken?: string;
};

function displayNameFromEmail(email: string) {
  const localPart = email.split("@")[0] || "student";
  const clean = localPart.replace(/[^a-z0-9._-]/gi, " ").trim();
  const normalized = clean
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return normalized || "Student";
}

export async function POST(request: Request) {
  try {
    if (!isTrustedMutationRequest(request)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const ip = getClientIp(request);
    const ipRateGate = await enforceRateLimitRules([
      { key: "account-access:endpoint", limit: 1200, windowMs: 60 * 1000 },
      { key: `account-access:ip:${rateLimitIdentifier(ip)}`, limit: 8, windowMs: 10 * 60 * 1000 }
    ]);
    if (!ipRateGate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(ipRateGate.retryAfter) } }
      );
    }

    const parsedBody = await parseJsonBody<AccountPayload>(request, { maxBytes: 10 * 1024 });
    if (!parsedBody.ok) {
      return NextResponse.json(
        { ok: false, error: parsedBody.error === "payload_too_large" ? "Payload too large" : "Invalid request body" },
        { status: parsedBody.error === "payload_too_large" ? 413 : 400 }
      );
    }
    const body = parsedBody.data;

    // Honeypot for bots.
    if (body.company?.trim()) {
      return NextResponse.json({ ok: true });
    }

    const email = sanitizeEmailInput(body.email);
    const mode = body.mode === "login" ? "login" : "register";

    if (!email || email.length > 254 || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const principalRateGate = await enforceRateLimitRules([
      { key: `account-access:email:${rateLimitIdentifier(email)}`, limit: 6, windowMs: 30 * 60 * 1000 },
      {
        key: `account-access:combo:${rateLimitIdentifier(`${email}:${ip}`)}`,
        limit: 4,
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

    const accountName = mode === "register" ? sanitizeTextInput(body.name, { maxLength: 80 }) : "";
    if (accountName.length > 80) {
      return NextResponse.json({ ok: false, error: "Invalid name" }, { status: 400 });
    }

    const normalizedName = accountName || displayNameFromEmail(email);

    const locale = normalizeLocale(body.locale);
    const source = normalizeSource(sanitizeSourceInput(body.source, `auth_${mode}`), `auth_${mode}`);
    const subscribeResult = await subscribeConvertKit({
      email,
      firstName: mode === "register" ? accountName || undefined : undefined,
      locale,
      source,
      extraTags: [`account_${mode}`]
    });
    const emailForwarded = subscribeResult.ok && !subscribeResult.skipped;
    const canIssueEmailSession = isInsecureEmailAuthAllowed();
    const deliveryStatus = emailForwarded ? "sent" : subscribeResult.ok ? "queued" : "failed";

    const message = canIssueEmailSession
      ? emailForwarded
        ? mode === "register"
          ? "Account request received. Check your inbox."
          : "Login request received. Check your inbox."
        : "Signed in successfully."
      : emailForwarded
        ? "Access request received. Check your inbox to continue."
        : mode === "register"
          ? "Account request received. We will send your access updates soon."
          : "Login request received. We will send your access instructions soon.";

    const response = NextResponse.json({
      ok: true,
      mode,
      forwarded: emailForwarded,
      deliveryStatus,
      emailDeliveryFailed: !subscribeResult.ok,
      authenticated: canIssueEmailSession,
      redirectTo: canIssueEmailSession ? `/${locale}/account?auth=success` : null,
      message
    });

    if (canIssueEmailSession) {
      const sessionToken = createSessionToken({
        provider: "email",
        providerUserId: email,
        email,
        name: normalizedName
      });

      response.cookies.set(AUTH_SESSION_COOKIE, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        priority: "high"
      });
    }

    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}
