import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { normalizeLocale, normalizeSource, subscribeConvertKit } from "@/lib/convertkit";
import { AUTH_SESSION_COOKIE, createSessionToken } from "@/lib/auth-session";
import { isInsecureEmailAuthAllowed } from "@/lib/runtime-config";
import { isTrustedMutationRequest } from "@/lib/security";

type AccountPayload = {
  email?: string;
  name?: string;
  mode?: "register" | "login";
  locale?: string;
  source?: string;
  company?: string;
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

    const body = (await request.json()) as AccountPayload;
    const ip = getClientIp(request);
    const key = `account-access:${ip}`;
    const limiter = rateLimit(key, 8, 10 * 60 * 1000);

    if (!limiter.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limiter.retryAfter) } }
      );
    }

    // Honeypot for bots.
    if (body.company?.trim()) {
      return NextResponse.json({ ok: true });
    }

    const email = body.email?.trim().toLowerCase();
    const mode = body.mode === "login" ? "login" : "register";

    if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const accountName = mode === "register" ? body.name?.trim() || "" : "";
    if (accountName.length > 80) {
      return NextResponse.json({ ok: false, error: "Invalid name" }, { status: 400 });
    }

    const normalizedName = accountName || displayNameFromEmail(email);

    const locale = normalizeLocale(body.locale);
    const source = normalizeSource(body.source, `auth_${mode}`);
    const subscribeResult = await subscribeConvertKit({
      email,
      firstName: mode === "register" ? accountName || undefined : undefined,
      locale,
      source,
      extraTags: [`account_${mode}`]
    });
    const emailForwarded = subscribeResult.ok && !subscribeResult.skipped;
    const canIssueEmailSession = isInsecureEmailAuthAllowed();

    const response = NextResponse.json({
      ok: true,
      mode,
      forwarded: emailForwarded,
      emailDeliveryFailed: !subscribeResult.ok,
      authenticated: canIssueEmailSession,
      redirectTo: canIssueEmailSession ? `/${locale}/account?auth=success` : null,
      message: canIssueEmailSession
        ? emailForwarded
          ? mode === "register"
            ? "Account request received. Check your inbox."
            : "Login request received. Check your inbox."
          : "Signed in successfully."
        : emailForwarded
          ? "Access request received. Check your inbox to continue."
          : "Access request saved. Email delivery is not active yet."
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
