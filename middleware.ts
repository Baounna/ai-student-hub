import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isGa4Enabled } from "@/lib/runtime-config";

// Exported for tests: the analytics gate below has two paths, and the one that
// keeps working when someone finally sets a GA id is the one no live response
// exercises today.
export function buildContentSecurityPolicy(nonce: string) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const botMode = (process.env.BOT_PROTECTION_MODE || "").trim().toLowerCase();
  const turnstileEnabled = botMode === "turnstile";
  /**
   * Turnstile's origin was already gated on whether Turnstile is on. Google's
   * was not: script-src named googletagmanager.com on every response, while the
   * site ships no gtag at all -- analytics is off, and isGa4Enabled additionally
   * rejects placeholder ids. So the policy stood permanently ready to execute a
   * third-party script that is never loaded. A CSP is a list of what may run;
   * an entry nothing uses only widens it.
   */
  const analyticsEnabled = isGa4Enabled();
  const google = analyticsEnabled ? " https://www.googletagmanager.com" : "";
  const googleConnect = analyticsEnabled
    ? " https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com"
    : "";

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${google}${isDevelopment ? " 'unsafe-eval'" : ""}${turnstileEnabled ? " https://challenges.cloudflare.com" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${googleConnect}${turnstileEnabled ? " https://challenges.cloudflare.com" : ""}${isDevelopment ? " ws: wss:" : ""}`,
    `frame-src 'self'${turnstileEnabled ? " https://challenges.cloudflare.com" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];

  if (!isDevelopment) directives.push("upgrade-insecure-requests");

  return directives.join("; ");
}

/**
 * A path Next can decode.
 *
 * Next decodes dynamic route segments itself, and a malformed percent-escape
 * makes that throw before any handler runs: "/%zz", "/en/blog/100%" and
 * "/api/search-suggest/%zz" each answered 500 with an empty body and nothing in
 * the application log -- so the failure was invisible from inside the app while
 * still costing a billed invocation and an error-rate alarm per request. Anyone
 * could generate them in a loop.
 *
 * Catching it here answers every matched route at once, and 400 is the honest
 * status: the request never named a resource, so it is malformed rather than
 * missing.
 */
function hasDecodablePath(pathname: string) {
  try {
    decodeURIComponent(pathname);
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  if (!hasDecodablePath(request.nextUrl.pathname)) {
    return new NextResponse("Bad Request", {
      status: 400,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" }
    });
  }

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
  // Skip Next's own build output and anything under public/. The previous list
  // named each static asset individually, so a new one -- the IndexNow key at
  // /<key>.txt -- fell through to the [lang] route and 404'd.
  //
  // "Has a dot" was the shortcut for "is a file", and it cost the CSP: no
  // Content-Security-Policy header was sent for any URL containing one, so
  // /en/blog/no-such.page came back with no policy at all. Harmless while no
  // real page has a dot in its path, and a hole the day one does -- a post slug
  // with a version number is all it takes. Only extensions that actually exist
  // in public/ are skipped now, so every HTML route keeps its policy.
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|avif|txt|xml|json|webmanifest|woff|woff2|ttf|otf|eot|pdf|css|js|map|mp4|webm)$).*)"
  ]
};

