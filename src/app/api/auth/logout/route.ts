import { NextResponse, type NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") === "fr" ? "fr" : "en";
  const redirectTo = request.nextUrl.searchParams.get("returnTo");
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : `/${locale}/login?logged_out=1`;

  const response = NextResponse.redirect(new URL(safeRedirect, request.url));
  response.cookies.set(AUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });

  return response;
}
