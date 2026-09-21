import { isIP } from "node:net";

const FALLBACK_IP = "0.0.0.0";
const IPV4_SEGMENT = "(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)";
const IPV4_REGEX = new RegExp(`^${IPV4_SEGMENT}(?:\\.${IPV4_SEGMENT}){3}$`);
const MAX_HEADER_IP_LENGTH = 64;
// Only headers the hosting edge sets ITSELF may be trusted. Vercel overwrites
// x-vercel-forwarded-for and x-real-ip on every request, so a client cannot
// forge them — verified against production by rotating the header and watching
// the rate limiter still count the real caller.
//
// cf-connecting-ip used to lead this list, and that was a live rate-limit
// bypass: this site is on Vercel, not behind Cloudflare, so nothing sets or
// strips that header and the attacker's own value was passed straight through
// to us. Sending a fresh cf-connecting-ip on each request reset every per-IP
// counter to zero. Trust it again only when Cloudflare genuinely sits in front,
// by setting TRUSTED_CLIENT_IP_HEADER=cf-connecting-ip.
const PLATFORM_IP_HEADERS = ["x-vercel-forwarded-for", "x-real-ip"] as const;
const DEV_ONLY_IP_HEADERS = ["x-forwarded-for"] as const;

/**
 * An extra header to trust ahead of the platform ones.
 *
 * Deliberately opt-in: a proxy header is only trustworthy when a proxy you
 * control is guaranteed to overwrite it, which is a deployment fact the code
 * cannot detect on its own.
 */
function configuredIpHeader() {
  const name = (process.env.TRUSTED_CLIENT_IP_HEADER || "").trim().toLowerCase();
  return /^[a-z0-9-]{1,64}$/.test(name) ? name : "";
}

function normalizeIpCandidate(value: string | null | undefined) {
  const raw = (value || "").split(",")[0]?.trim() || "";
  if (!raw || raw.length > MAX_HEADER_IP_LENGTH) return "";

  const withoutPort = raw.includes(":") && raw.includes(".") ? raw.split(":")[0] : raw;
  if (IPV4_REGEX.test(withoutPort)) return withoutPort;
  if (withoutPort.includes(":") && isIP(withoutPort) === 6) return withoutPort.toLowerCase();
  return "";
}

export function getClientIp(request: Request) {
  const configured = configuredIpHeader();
  const headerNames = [
    ...(configured ? [configured] : []),
    ...PLATFORM_IP_HEADERS,
    // x-forwarded-for is client-settable, so it is a convenience for local
    // testing only and must never be consulted in production.
    ...(process.env.NODE_ENV === "production" ? [] : DEV_ONLY_IP_HEADERS)
  ];
  const candidates = headerNames.map((headerName) => request.headers.get(headerName));

  for (const candidate of candidates) {
    const ip = normalizeIpCandidate(candidate);
    if (ip) return ip;
  }

  return FALLBACK_IP;
}

/**
 * The bucket a per-IP rate limit should actually count against.
 *
 * Spoofing is already closed off above — only headers the platform overwrites
 * are read — but an honest, unspoofed address is not the same thing as one
 * caller. An IPv6 client is normally handed a whole /64: a residential router
 * delegates one to the LAN, a VPS gets one per instance, and privacy extensions
 * rotate through it by design. So counting the full 128-bit address gives a
 * single machine 2^64 free buckets, and the newsletter's 8-per-10-minutes
 * becomes unlimited for anyone on IPv6 — no forged header needed, just a new
 * source address per request.
 *
 * Collapsing to the /64 is the smallest unit an operator cannot subdivide for
 * free, and it is what every serious limiter keys on. IPv4 is returned whole:
 * addresses there are scarce enough to be meaningful on their own, and
 * truncating would sweep up unrelated customers behind one NAT.
 *
 * Only for rate-limit keys. getClientIp() stays exact, because Turnstile's
 * remoteip check and anything else that wants the caller wants the real one.
 */
export function rateLimitClientKey(ip: string) {
  const value = String(ip || "").trim().toLowerCase();
  if (!value || !value.includes(":") || isIP(value) !== 6) return value || FALLBACK_IP;
  // IPv4-mapped form (::ffff:1.2.3.4) carries its identity in the low 32 bits,
  // so a /64 of it is the same prefix for every address on the internet. Leave
  // it whole. getClientIp never emits this shape today; the guard is here so the
  // helper stays correct for any caller that does.
  if (value.includes(".")) return value;

  // Expand the "::" run so the first four groups are the real high 64 bits.
  const [head, tail] = value.split("::", 2);
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail === undefined ? [] : tail ? tail.split(":") : [];
  const groups =
    tail === undefined
      ? headGroups
      : [...headGroups, ...Array(Math.max(0, 8 - headGroups.length - tailGroups.length)).fill("0"), ...tailGroups];

  const prefix = groups.slice(0, 4).map((group) => (group || "0").padStart(4, "0"));
  while (prefix.length < 4) prefix.push("0000");
  return `${prefix.join(":")}::/64`;
}

export type JsonBodyParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: "invalid_json" | "payload_too_large" };

type ParseJsonBodyOptions = {
  maxBytes?: number;
};

export async function parseJsonBody<T>(
  request: Request,
  options: ParseJsonBodyOptions = {}
): Promise<JsonBodyParseResult<T>> {
  const maxBytes = Number.isFinite(options.maxBytes) ? Math.max(256, Number(options.maxBytes)) : 24 * 1024;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > maxBytes) {
      return { ok: false, error: "payload_too_large" };
    }
    return { ok: true, data: JSON.parse(raw) as T };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}
