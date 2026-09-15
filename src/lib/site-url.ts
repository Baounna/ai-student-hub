// Must be a host that actually resolves. This is what canonical URLs, the
// sitemap and every og:image fall back to when the env var is missing, so a
// domain nobody owns yet would quietly point search engines at NXDOMAIN.
// Change this the day the real domain is bought, not before.
const FALLBACK_SITE_URL = "https://ai-student-hub-navy.vercel.app";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function normalize(url: string) {
  return url.replace(/\/+$/, "");
}

function isLocalHost(hostname: string) {
  const host = hostname.toLowerCase();
  return LOCAL_HOSTS.has(host) || host.endsWith(".local");
}

function normalizeSiteCandidate(value: string | undefined) {
  const raw = (value || "").trim();
  if (!raw) return null;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${normalize(raw)}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

    if (process.env.NODE_ENV === "production") {
      if (parsed.protocol !== "https:") return null;
      if (isLocalHost(parsed.hostname)) return null;
    }

    return normalize(parsed.origin);
  } catch {
    return null;
  }
}

export function getSiteUrl() {
  const candidates = [process.env.NEXT_PUBLIC_SITE_URL, process.env.SITE_URL];

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeSiteCandidate(candidate);
    if (normalizedCandidate) return normalizedCandidate;
  }

  return FALLBACK_SITE_URL;
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
