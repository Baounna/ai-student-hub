import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE, createSessionToken } from "@/lib/auth-session";
import {
  decodeOAuthContext,
  exchangeOAuthCode,
  fetchOAuthUser,
  isOAuthProvider,
  OAUTH_STATE_COOKIE
} from "@/lib/oauth";
import { isOAuthEnabled } from "@/lib/runtime-config";
import { getClientIp } from "@/lib/request";
import { enforceRateLimitRules, rateLimitIdentifier } from "@/lib/rate-limit";

const SAFE_OAUTH_ERRORS = new Set([
  "oauth_disabled",
  "provider_not_configured",
  "context_encode_failed",
  "missing_context",
  "provider_mismatch",
  "state_mismatch",
  "missing_code",
  "token_exchange_failed",
  "missing_access_token",
  "google_userinfo_failed",
  "google_userinfo_incomplete",
  "github_userinfo_failed",
  "github_userinfo_incomplete",
  "linkedin_userinfo_failed",
  "linkedin_userinfo_incomplete",
  "oauth_failed"
]);

function sanitizeOAuthError(value: string) {
  return SAFE_OAUTH_ERRORS.has(value) ? value : "oauth_failed";
}

function withQuery(path: string, key: string, value: string) {
  const url = new URL(path, "https://local.invalid");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

export async function GET(request: NextRequest, props: { params: Promise<{ provider: string }> }) {
  const params = await props.params;
  const providerRaw = params.provider;
  if (!isOAuthProvider(providerRaw)) {
    return NextResponse.json({ ok: false, error: "Unsupported provider" }, { status: 404 });
  }

  const stateFromProvider = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");
  const ip = getClientIp(request);
  const limiter = await enforceRateLimitRules([
    {
      key: "oauth-callback:endpoint",
      limit: 1200,
      windowMs: 60 * 1000
    },
    {
      key: `oauth-callback:${providerRaw}:ip:${rateLimitIdentifier(ip)}`,
      limit: 40,
      windowMs: 10 * 60 * 1000
    }
  ]);
  if (!limiter.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limiter.retryAfter) } }
    );
  }

  if (stateFromProvider) {
    const stateLimiter = await enforceRateLimitRules([
      {
        key: `oauth-callback:${providerRaw}:state:${rateLimitIdentifier(stateFromProvider)}`,
        limit: 8,
        windowMs: 10 * 60 * 1000
      }
    ]);
    if (!stateLimiter.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(stateLimiter.retryAfter) } }
      );
    }
  }

  if (code) {
    const codeLimiter = await enforceRateLimitRules([
      {
        key: `oauth-callback:${providerRaw}:code:${rateLimitIdentifier(code)}`,
        limit: 5,
        windowMs: 10 * 60 * 1000
      }
    ]);
    if (!codeLimiter.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(codeLimiter.retryAfter) } }
      );
    }
  }

  const statePayload = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const context = decodeOAuthContext(statePayload);

  const fallbackLocale = context?.locale || "en";
  const fallbackMode = context?.mode || "login";
  const fallbackTarget = `/${fallbackLocale}/${fallbackMode}`;

  if (!isOAuthEnabled()) {
    return NextResponse.redirect(new URL(withQuery(fallbackTarget, "oauth_error", "oauth_disabled"), request.url));
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    priority: "high" as const
  };

  function redirectWithError(error: string) {
    const response = NextResponse.redirect(
      new URL(withQuery(fallbackTarget, "oauth_error", sanitizeOAuthError(error)), request.url)
    );
    response.cookies.set(OAUTH_STATE_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return response;
  }

  if (!context) return redirectWithError("missing_context");
  if (context.provider !== providerRaw) return redirectWithError("provider_mismatch");
  if (!stateFromProvider || stateFromProvider !== context.state) return redirectWithError("state_mismatch");
  if (oauthError) return redirectWithError(oauthError);
  if (!code) return redirectWithError("missing_code");

  try {
    const { accessToken } = await exchangeOAuthCode(providerRaw, code);
    const user = await fetchOAuthUser(providerRaw, accessToken);
    const sessionToken = createSessionToken(user);

    const successTarget = withQuery(context.returnTo, "auth", "success");
    const response = NextResponse.redirect(new URL(successTarget, request.url));

    response.cookies.set(OAUTH_STATE_COOKIE, "", { ...cookieOptions, maxAge: 0 });

    response.cookies.set(AUTH_SESSION_COOKIE, sessionToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    const reason = error instanceof Error ? sanitizeOAuthError(error.message) : "oauth_failed";
    return redirectWithError(reason);
  }
}
