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

// Session cookies were part of the account system, which was removed: it could
// never work on a read-only serverless filesystem and the site has no logged-in
// features. Restore these checks alongside any future auth.

const rateLimitedRoutes = ["src/app/api/newsletter/route.ts", "src/app/api/track/route.ts"];

for (const routePath of rateLimitedRoutes) {
  const text = readText(routePath);
  if (text.includes("enforceRateLimitRules(")) {
    ok(`${routePath} has rate limiting.`);
  } else {
    fail(`${routePath} is missing enforceRateLimitRules.`);
  }
}

const jsonPostRoutes = ["src/app/api/newsletter/route.ts", "src/app/api/track/route.ts"];
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

// Session revocation went with the account system. Nothing issues a session
// token now, so there is no denylist to verify.

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

// The workflows are part of the attack surface, not just the build. They hold
// write tokens, and a push to main deploys — so an action reference that can be
// repointed by its author is a deploy someone else controls. A version tag is a
// mutable pointer; only a commit SHA names fixed code. Dependabot still updates
// these, it just does it through a reviewable pull request.
const WORKFLOW_DIR = ".github/workflows";
const SHA_PINNED = /^[0-9a-f]{40}$/;
// Triggers that run with repository secrets and a write token against code the
// event's author controls. None are used here; the check is what keeps it true.
const FORK_WRITABLE_TRIGGERS = ["pull_request_target", "workflow_run", "issue_comment"];

const workflowFiles = fs.existsSync(path.join(ROOT, WORKFLOW_DIR))
  ? fs.readdirSync(path.join(ROOT, WORKFLOW_DIR)).filter((name) => /\.ya?ml$/.test(name)).sort()
  : [];

if (!workflowFiles.length) {
  warn("No workflow files found to verify.");
} else {
  const unpinned = [];
  const unscoped = [];
  const risky = [];

  for (const fileName of workflowFiles) {
    const text = readText(path.join(WORKFLOW_DIR, fileName));

    for (const match of text.matchAll(/^\s*(?:-\s*)?uses:\s*(\S+)/gm)) {
      const reference = match[1];
      // A local action (./path) is this repository's own code, already reviewed.
      if (reference.startsWith("./")) continue;
      const ref = reference.split("@")[1] || "";
      if (!SHA_PINNED.test(ref)) unpinned.push(`${fileName}: ${reference}`);
    }

    // Without a permissions block the job inherits the repository default,
    // which is a setting in the web UI rather than something review can see.
    if (!/^permissions:/m.test(text) && !/^\s{4,}permissions:/m.test(text)) {
      unscoped.push(fileName);
    }

    for (const trigger of FORK_WRITABLE_TRIGGERS) {
      if (new RegExp(`^\\s{2}${trigger}:`, "m").test(text)) risky.push(`${fileName}: ${trigger}`);
    }
  }

  if (unpinned.length) {
    fail(`Workflow actions not pinned to a commit SHA: ${unpinned.join(", ")}`);
  } else {
    ok(`All workflow actions are pinned to a commit SHA (${workflowFiles.length} workflows).`);
  }

  if (unscoped.length) {
    fail(`Workflows without an explicit permissions block: ${unscoped.join(", ")}`);
  } else {
    ok("Every workflow declares its own permissions.");
  }

  if (risky.length) {
    fail(`Workflow uses a fork-writable trigger — review before keeping: ${risky.join(", ")}`);
  } else {
    ok("No workflow runs on pull_request_target, workflow_run or issue_comment.");
  }
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
