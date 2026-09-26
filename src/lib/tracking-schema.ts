const TRACKED_EVENTS = [
  "lead_magnet_click",
  "newsletter_submit_success",
  "newsletter_submit_error",
  "affiliate_click",
  "product_checkout_click",
  "auth_login_attempt",
  "auth_register_attempt",
  "account_access_submit_success",
  "account_access_submit_error",
  "article_share"
] as const;

const trackedEventSet = new Set<string>(TRACKED_EVENTS);
const EVENT_PATTERN = /^[a-z0-9_:-]{2,80}$/i;
const META_KEY_PATTERN = /^[a-z0-9_.:-]{1,40}$/i;
const MAX_META_KEYS = 20;
const MAX_META_STRING_LENGTH = 280;

export type TrackEventName = (typeof TRACKED_EVENTS)[number];
export type TrackPrimitive = string | number | boolean;
export type TrackMetaValue = TrackPrimitive | null | undefined;
export type TrackMeta = Record<string, TrackMetaValue>;
export type SanitizedTrackPayload = {
  event: TrackEventName;
  meta: Record<string, TrackPrimitive>;
  ts: string;
};

function sanitizeMeta(metaInput: unknown) {
  if (!metaInput || typeof metaInput !== "object") return {};

  const metaEntries = Object.entries(metaInput).slice(0, MAX_META_KEYS);
  const sanitized: Record<string, TrackPrimitive> = {};

  for (const [rawKey, rawValue] of metaEntries) {
    const key = rawKey.trim();
    if (!META_KEY_PATTERN.test(key)) continue;

    if (typeof rawValue === "string") {
      const value = rawValue.trim();
      if (!value) continue;
      sanitized[key] = value.slice(0, MAX_META_STRING_LENGTH);
      continue;
    }

    if (typeof rawValue === "number") {
      if (!Number.isFinite(rawValue)) continue;
      sanitized[key] = rawValue;
      continue;
    }

    if (typeof rawValue === "boolean") {
      sanitized[key] = rawValue;
    }
  }

  return sanitized;
}

function sanitizeTimestamp(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

export function isTrackEventName(value: string): value is TrackEventName {
  return EVENT_PATTERN.test(value) && trackedEventSet.has(value);
}

export function sanitizeTrackPayload(input: unknown): { ok: true; data: SanitizedTrackPayload } | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Invalid payload" };
  }

  const payload = input as { event?: unknown; meta?: unknown; ts?: unknown };
  const rawEvent = typeof payload.event === "string" ? payload.event.trim() : "";

  if (!rawEvent) {
    return { ok: false, error: "Missing event" };
  }

  if (!isTrackEventName(rawEvent)) {
    return { ok: false, error: "Unsupported event" };
  }

  return {
    ok: true,
    data: {
      event: rawEvent,
      meta: sanitizeMeta(payload.meta),
      ts: sanitizeTimestamp(payload.ts)
    }
  };
}

