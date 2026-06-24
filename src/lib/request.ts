import { isIP } from "node:net";

const FALLBACK_IP = "0.0.0.0";
const IPV4_SEGMENT = "(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)";
const IPV4_REGEX = new RegExp(`^${IPV4_SEGMENT}(?:\\.${IPV4_SEGMENT}){3}$`);
const MAX_HEADER_IP_LENGTH = 64;
const TRUSTED_EDGE_IP_HEADERS = ["cf-connecting-ip", "x-vercel-forwarded-for", "x-real-ip"] as const;
const DEV_ONLY_IP_HEADERS = ["x-forwarded-for"] as const;

function normalizeIpCandidate(value: string | null | undefined) {
  const raw = (value || "").split(",")[0]?.trim() || "";
  if (!raw || raw.length > MAX_HEADER_IP_LENGTH) return "";

  const withoutPort = raw.includes(":") && raw.includes(".") ? raw.split(":")[0] : raw;
  if (IPV4_REGEX.test(withoutPort)) return withoutPort;
  if (withoutPort.includes(":") && isIP(withoutPort) === 6) return withoutPort.toLowerCase();
  return "";
}

export function getClientIp(request: Request) {
  const headerNames =
    process.env.NODE_ENV === "production"
      ? TRUSTED_EDGE_IP_HEADERS
      : [...TRUSTED_EDGE_IP_HEADERS, ...DEV_ONLY_IP_HEADERS];
  const candidates = headerNames.map((headerName) => request.headers.get(headerName));

  for (const candidate of candidates) {
    const ip = normalizeIpCandidate(candidate);
    if (ip) return ip;
  }

  return FALLBACK_IP;
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
