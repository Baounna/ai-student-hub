const PLACEHOLDER_HOSTS = new Set([
  "example.com",
  "www.example.com",
  "example.org",
  "www.example.org",
  "your-domain.com",
  "www.your-domain.com"
]);

const PLACEHOLDER_FRAGMENTS = ["your-link", "placeholder", "replace-me", "changeme", "your-domain"];

export function parseHttpUrl(value: string) {
  const input = value.trim();
  if (!input) return null;

  try {
    const parsed = new URL(input);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed;
  } catch {
    return null;
  }
}

function hasPlaceholderValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  return PLACEHOLDER_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

export function isSafeHttpUrl(value: string) {
  const parsed = parseHttpUrl(value);
  if (!parsed) return false;
  if (PLACEHOLDER_HOSTS.has(parsed.hostname.toLowerCase())) return false;
  if (hasPlaceholderValue(value)) return false;
  return true;
}

export function normalizeHttpUrl(value: string) {
  const parsed = parseHttpUrl(value);
  if (!parsed) return "";
  parsed.hash = "";
  return parsed.toString();
}
