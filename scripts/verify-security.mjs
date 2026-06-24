#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { loadScriptEnv } from "./lib/load-env.mjs";

const ROOT = process.cwd();
loadScriptEnv(ROOT);

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function hasAll(text, values) {
  return values.every((value) => text.includes(value));
}

function isHttpsNonLocal(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return !LOCAL_HOSTS.has(host) && !host.endsWith(".local");
  } catch {
    return false;
  }
}

function print(type, message) {
  const icon = type === "ERROR" ? "✖" : type === "WARN" ? "▲" : "✔";
  console.log(`${icon} [${type}] ${message}`);
}

let errors = 0;
let warns = 0;

function ok(message) {
  print("OK", message);
}

function warn(message) {
  warns += 1;
  print("WARN", message);
}

function fail(message) {
  errors += 1;
  print("ERROR", message);
}

console.log("Security verification");
console.log("---------------------");

const middlewarePath = "middleware.ts";
const nextConfigPath = "next.config.mjs";
const middlewareText = readText(middlewarePath);
const nextConfigText = readText(nextConfigPath);

if (middlewareText.includes("Content-Security-Policy")) {
  ok("CSP header is set in middleware.");
} else {
  fail("Missing CSP header in middleware.ts.");
}

if (middlewareText.includes("script-src 'self' 'nonce-${nonce}'")) {
  ok("Nonce-based CSP script-src is configured.");
} else {
  fail("CSP is missing nonce-based script-src.");
}

if (/script-src[^\n]*'unsafe-inline'/i.test(middlewareText)) {
  fail("CSP script-src includes unsafe-inline. Keep script policy nonce-based.");
} else {
  ok("CSP script-src does not include unsafe-inline.");
}

if (middlewareText.includes("frame-ancestors 'none'") && middlewareText.includes("object-src 'none'")) {
  ok("CSP includes framing/object hardening directives.");
} else {
  fail("CSP missing frame-ancestors/object-src hardening.");
}

if (nextConfigText.includes("Content-Security-Policy")) {
  fail("next.config.mjs still sets CSP. Keep middleware as the single CSP source.");
} else {
  ok("No conflicting static CSP in next.config.mjs.");
}

const requiredHeaderKeys = [
  "Referrer-Policy",
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Permissions-Policy",
  "Strict-Transport-Security"
];
for (const headerKey of requiredHeaderKeys) {
  if (nextConfigText.includes(headerKey)) {
    ok(`Header configured: ${headerKey}`);
  } else {
    fail(`Missing security header in next.config.mjs: ${headerKey}`);
  }
}

const cookieRoutes = [
  "src/app/api/auth/credentials/login/route.ts",
  "src/app/api/auth/credentials/register/route.ts",
  "src/app/api/account-access/route.ts",
  "src/app/api/auth/oauth/[provider]/callback/route.ts",
  "src/app/api/auth/logout/route.ts"
];

for (const file of cookieRoutes) {
  const text = readText(file);
  const checks = [
    ['httpOnly: true', "httpOnly flag"],
    ['secure: process.env.NODE_ENV === "production"', "secure flag in production"],
    ['sameSite: "lax"', "sameSite=lax"],
    ["priority: \"high\"", "priority=high"]
  ];

  for (const [needle, label] of checks) {
    if (text.includes(needle)) {
      ok(`${path.basename(file)} has ${label}.`);
    } else {
      fail(`${file} is missing cookie ${label}.`);
    }
  }
}

const rateLimitedRoutes = [
  "src/app/api/auth/credentials/login/route.ts",
  "src/app/api/auth/credentials/register/route.ts",
  "src/app/api/newsletter/route.ts",
  "src/app/api/account-access/route.ts",
  "src/app/api/track/route.ts",
  "src/app/api/auth/oauth/[provider]/route.ts",
  "src/app/api/auth/oauth/[provider]/callback/route.ts"
];

for (const routePath of rateLimitedRoutes) {
  const text = readText(routePath);
  if (text.includes("enforceRateLimitRules(")) {
    ok(`${routePath} has rate limiting.`);
  } else {
    fail(`${routePath} is missing enforceRateLimitRules.`);
  }
}

const loginRouteText = readText("src/app/api/auth/credentials/login/route.ts");
if (hasAll(loginRouteText, ["getLoginLockStatus", "recordFailedLoginAttempt", "clearFailedLoginAttempts"])) {
  ok("Login lockout + progressive backoff helpers are wired.");
} else {
  fail("Login lockout/backoff logic is incomplete in credentials login route.");
}

const jsonPostRoutes = [
  "src/app/api/auth/credentials/login/route.ts",
  "src/app/api/auth/credentials/register/route.ts",
  "src/app/api/newsletter/route.ts",
  "src/app/api/account-access/route.ts",
  "src/app/api/track/route.ts"
];
for (const routePath of jsonPostRoutes) {
  const text = readText(routePath);
  if (!text.includes("parseJsonBody<")) {
    fail(`${routePath} is missing parseJsonBody payload parser.`);
    continue;
  }
  if (!text.includes("maxBytes:")) {
    fail(`${routePath} does not set a request body size limit.`);
    continue;
  }
  if (!text.includes("payload_too_large")) {
    fail(`${routePath} does not return a payload_too_large guard response.`);
    continue;
  }
  ok(`${routePath} enforces JSON body size guards.`);
}

const rateLimitLib = readText("src/lib/rate-limit.ts");
if (rateLimitLib.includes("UPSTASH_REDIS_REST_URL") && rateLimitLib.includes("UPSTASH_REDIS_REST_TOKEN")) {
  ok("Rate limiter supports distributed Upstash backend.");
} else {
  fail("Distributed rate limiting env wiring is missing in src/lib/rate-limit.ts.");
}

const revocationLib = readText("src/lib/session-revocation.ts");
if (revocationLib.includes("revokeSessionToken") && revocationLib.includes("isSessionTokenRevoked")) {
  ok("Session revocation denylist utilities are present.");
} else {
  fail("Session revocation utilities are missing.");
}

const parseSessionText = readText("src/lib/auth-session.ts");
if (parseSessionText.includes("isSessionTokenRevoked")) {
  ok("Session parse path checks revocation denylist.");
} else {
  fail("Session parser is not checking token revocation.");
}

const siteUrl = (process.env.SITE_URL || "").trim();
const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();

if (siteUrl) {
  if (isHttpsNonLocal(siteUrl)) {
    ok("SITE_URL is a valid HTTPS non-localhost origin.");
  } else {
    fail("SITE_URL must be HTTPS and non-localhost.");
  }
} else {
  warn("SITE_URL is not set in local env.");
}

if (publicSiteUrl) {
  if (isHttpsNonLocal(publicSiteUrl)) {
    ok("NEXT_PUBLIC_SITE_URL is a valid HTTPS non-localhost origin.");
  } else {
    fail("NEXT_PUBLIC_SITE_URL must be HTTPS and non-localhost.");
  }
} else {
  warn("NEXT_PUBLIC_SITE_URL is not set in local env.");
}

const siteUrlLib = readText("src/lib/site-url.ts");
if (siteUrlLib.includes("http://localhost")) {
  fail("src/lib/site-url.ts contains localhost production fallback.");
} else {
  ok("Site URL helper does not hardcode localhost production fallback.");
}

console.log("---------------------");
if (errors > 0) {
  console.log(`Security verification failed: ${errors} error(s), ${warns} warning(s).`);
  process.exitCode = 1;
} else {
  console.log(`Security verification passed with ${warns} warning(s).`);
}
