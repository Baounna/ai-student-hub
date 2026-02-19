import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { normalizeLocale, normalizeSource, subscribeConvertKit } from "@/lib/convertkit";
import { AUTH_SESSION_COOKIE, createSessionToken } from "@/lib/auth-session";

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
    const normalizedName = accountName || displayNameFromEmail(email);
    const sessionToken = createSessionToken({
      provider: "email",
      providerUserId: email,
      email,
      name: normalizedName
    });

    const locale = normalizeLocale(body.locale);
    const source = normalizeSource(body.source, `auth_${mode}`);
    const subscribeResult = await subscribeConvertKit({
      email,
      firstName: mode === "register" ? body.name?.trim() || undefined : undefined,
      locale,
      source,
      extraTags: [`account_${mode}`]
    });
    const emailForwarded = subscribeResult.ok && !subscribeResult.skipped;

    const response = NextResponse.json({
      ok: true,
      mode,
      forwarded: emailForwarded,
      emailDeliveryFailed: !subscribeResult.ok,
      authenticated: true,
      redirectTo: `/${locale}/account?auth=success`,
      message: emailForwarded
        ? mode === "register"
          ? "Account request received. Check your inbox."
          : "Login request received. Check your inbox."
        : "Signed in successfully."
    });

    response.cookies.set(AUTH_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}
