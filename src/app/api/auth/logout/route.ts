import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE, parseSessionTokenUnsafe } from "@/lib/auth-session";
import { revokeSessionToken } from "@/lib/session-revocation";

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") === "fr" ? "fr" : "en";
  const redirectTo = request.nextUrl.searchParams.get("returnTo");
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : `/${locale}/login?logged_out=1`;
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;

  const response = NextResponse.redirect(new URL(safeRedirect, request.url));

  // Block cross-site CSRF (e.g. <img src="/api/auth/logout">) from forcing a
  // logout. Same-origin link clicks send "same-origin"; direct navigations /
  // bookmarks send "none" — both are legitimate and still allowed.
  const fetchSite = (request.headers.get("sec-fetch-site") || "").trim().toLowerCase();
  if (fetchSite === "cross-site") {
    return response;
  }

  if (token) {
    const payload = parseSessionTokenUnsafe(token);
    await revokeSessionToken(token, payload?.exp);
  }

  response.cookies.set(AUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    priority: "high"
  });

  return response;
}
