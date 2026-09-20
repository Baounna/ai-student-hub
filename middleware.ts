import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function buildContentSecurityPolicy(nonce: string) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const botMode = (process.env.BOT_PROTECTION_MODE || "").trim().toLowerCase();
  const turnstileEnabled = botMode === "turnstile";

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com${isDevelopment ? " 'unsafe-eval'" : ""}${turnstileEnabled ? " https://challenges.cloudflare.com" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com${turnstileEnabled ? " https://challenges.cloudflare.com" : ""}${isDevelopment ? " ws: wss:" : ""}`,
    `frame-src 'self'${turnstileEnabled ? " https://challenges.cloudflare.com" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];

  if (!isDevelopment) directives.push("upgrade-insecure-requests");

  return directives.join("; ");
}

export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-csp-nonce", nonce);
  // The layout needs the current path to build the other language's URL for the
  // same page. A server component cannot read the pathname on its own, and
  // sending a reader who switches language back to the homepage loses whatever
  // they were reading.
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(nonce));
  return response;
}

export const config = {
  // Skip anything that looks like a file. The previous list named each static
  // asset individually, so a new one — the IndexNow key at /<key>.txt — fell
  // through to the [lang] route and 404'd. Matching on "has an extension"
  // covers every file in public/ without needing to be kept in step with it.
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"]
};

