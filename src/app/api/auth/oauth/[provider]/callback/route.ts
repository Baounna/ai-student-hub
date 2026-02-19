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

function withQuery(path: string, key: string, value: string) {
  const url = new URL(path, "https://local.invalid");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const providerRaw = params.provider;
  if (!isOAuthProvider(providerRaw)) {
    return NextResponse.json({ ok: false, error: "Unsupported provider" }, { status: 404 });
  }

  const statePayload = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const context = decodeOAuthContext(statePayload);
  const stateFromProvider = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");

  const fallbackLocale = context?.locale || "en";
  const fallbackMode = context?.mode || "login";
  const fallbackTarget = `/${fallbackLocale}/${fallbackMode}`;

  if (!isOAuthEnabled()) {
    return NextResponse.redirect(new URL(withQuery(fallbackTarget, "oauth_error", "oauth_disabled"), request.url));
  }

  function redirectWithError(error: string) {
    const response = NextResponse.redirect(new URL(withQuery(fallbackTarget, "oauth_error", error), request.url));
    response.cookies.set(OAUTH_STATE_COOKIE, "", {
      path: "/",
      maxAge: 0
    });
    return response;
  }

  if (!context) return redirectWithError("missing_context");
  if (context.provider !== providerRaw) return redirectWithError("provider_mismatch");
  if (!stateFromProvider || stateFromProvider !== context.state) return redirectWithError("state_mismatch");
  if (oauthError) return redirectWithError(oauthError);
  if (!code) return redirectWithError("missing_code");

  try {
    const { accessToken } = await exchangeOAuthCode(providerRaw, code, context.origin);
    const user = await fetchOAuthUser(providerRaw, accessToken);
    const sessionToken = createSessionToken(user);

    const successTarget = withQuery(context.returnTo, "auth", "success");
    const response = NextResponse.redirect(new URL(successTarget, request.url));

    response.cookies.set(OAUTH_STATE_COOKIE, "", {
      path: "/",
      maxAge: 0
    });

    response.cookies.set(AUTH_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "oauth_failed";
    return redirectWithError(reason);
  }
}
