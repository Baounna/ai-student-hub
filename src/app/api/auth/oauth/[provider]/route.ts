import { NextResponse, type NextRequest } from "next/server";
import {
  buildProviderAuthorizeUrl,
  createOAuthState,
  decodeOAuthContext,
  encodeOAuthContext,
  isOAuthProvider,
  OAUTH_STATE_COOKIE,
  parseOAuthLocale,
  parseOAuthMode,
  sanitizeReturnTo
} from "@/lib/oauth";
import { isOAuthEnabled } from "@/lib/runtime-config";
import { getClientIp } from "@/lib/request";
import { enforceRateLimitRules, rateLimitIdentifier } from "@/lib/rate-limit";

export async function GET(request: NextRequest, props: { params: Promise<{ provider: string }> }) {
  const params = await props.params;
  const providerRaw = params.provider;
  if (!isOAuthProvider(providerRaw)) {
    return NextResponse.json({ ok: false, error: "Unsupported provider" }, { status: 404 });
  }

  const ip = getClientIp(request);
  const limiter = await enforceRateLimitRules([
    {
      key: "oauth-start:endpoint",
      limit: 900,
      windowMs: 60 * 1000
    },
    {
      key: `oauth-start:${providerRaw}:ip:${rateLimitIdentifier(ip)}`,
      limit: 30,
      windowMs: 10 * 60 * 1000
    }
  ]);
  if (!limiter.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limiter.retryAfter) } }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const locale = parseOAuthLocale(searchParams.get("locale"));
  const mode = parseOAuthMode(searchParams.get("mode"));
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"), locale);

  if (!isOAuthEnabled()) {
    return NextResponse.redirect(new URL(`/${locale}/${mode}?oauth_error=oauth_disabled`, request.url));
  }

  const state = createOAuthState();

  const authorizeUrl = buildProviderAuthorizeUrl(providerRaw, state);
  if (!authorizeUrl) {
    return NextResponse.redirect(new URL(`/${locale}/${mode}?oauth_error=provider_not_configured`, request.url));
  }

  const context = encodeOAuthContext({
    provider: providerRaw,
    locale,
    mode,
    returnTo,
    state
  });

  // decode function imported to keep context format in one module and avoid drift in callback route.
  if (!decodeOAuthContext(context)) {
    return NextResponse.redirect(new URL(`/${locale}/${mode}?oauth_error=context_encode_failed`, request.url));
  }

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, context, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
    priority: "high"
  });

  return response;
}
