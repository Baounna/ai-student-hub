const FALLBACK_SITE_URL = "https://aistudenthub.ai";

function normalize(url: string) {
  return url.replace(/\/+$/, "");
}

export function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();

  if (!envUrl) return FALLBACK_SITE_URL;

  if (!/^https?:\/\//.test(envUrl)) {
    return `https://${normalize(envUrl)}`;
  }

  return normalize(envUrl);
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
