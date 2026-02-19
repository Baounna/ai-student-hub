import { isIP } from "node:net";
import { getSiteUrl } from "@/lib/site-url";
import { parseHttpUrl } from "@/lib/url";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const LOW_TRUST_FETCH_SITES = new Set(["cross-site", "none"]);

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function collectTrustedOrigins() {
  const origins = new Set<string>();
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    getSiteUrl()
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const origin = normalizeOrigin(candidate);
    if (origin) origins.add(origin);
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://localhost:3001");
    origins.add("http://127.0.0.1:3001");
  }

  return origins;
}

function isPrivateNetworkHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (LOCALHOST_HOSTS.has(host) || host.endsWith(".local")) return true;

  const ipVersion = isIP(host);
  if (ipVersion === 4) {
    const parts = host.split(".").map((part) => Number.parseInt(part, 10));
    if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return false;

    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    return false;
  }

  if (ipVersion === 6) {
    if (host === "::1") return true;
    if (host.startsWith("fe80:")) return true;
    if (host.startsWith("fc") || host.startsWith("fd")) return true;
    return false;
  }

  return false;
}

const TRUSTED_ORIGINS = collectTrustedOrigins();

export function isTrustedMutationRequest(request: Request) {
  if (!MUTATION_METHODS.has(request.method.toUpperCase())) return true;
  const allowedOrigins = TRUSTED_ORIGINS;

  const originHeader = normalizeOrigin(request.headers.get("origin"));
  if (originHeader) return allowedOrigins.has(originHeader);

  const refererOrigin = normalizeOrigin(request.headers.get("referer"));
  if (refererOrigin) return allowedOrigins.has(refererOrigin);

  const fetchSite = (request.headers.get("sec-fetch-site") || "").trim().toLowerCase();
  if (LOW_TRUST_FETCH_SITES.has(fetchSite)) return false;

  // Non-browser/server requests may not send origin hints; allow them.
  return true;
}

export function isSafeWebhookTarget(value: string) {
  const parsed = parseHttpUrl(value);
  if (!parsed) return false;

  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    return false;
  }

  if (isPrivateNetworkHost(parsed.hostname)) {
    return process.env.NODE_ENV !== "production";
  }

  return true;
}
