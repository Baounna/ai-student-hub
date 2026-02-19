import { sanitizeTrackPayload, type TrackEventName, type TrackMeta } from "@/lib/tracking-schema";

const trackingDebugEnabled =
  process.env.NODE_ENV !== "production" && ["1", "true", "yes"].includes((process.env.NEXT_PUBLIC_TRACKING_DEBUG || "").toLowerCase());

type GtagFn = (command: "event", event: string, params?: Record<string, string | number | boolean>) => void;

function getClientGtag() {
  if (typeof window === "undefined") return null;
  const maybeGtag = (window as Window & { gtag?: GtagFn }).gtag;
  return typeof maybeGtag === "function" ? maybeGtag : null;
}

function debugLog(label: string, payload: unknown) {
  if (!trackingDebugEnabled) return;
  // Local debug mode to verify analytics wiring without polluting production logs.
  console.info(`[track:${label}]`, payload);
}

export function trackEvent(event: TrackEventName, meta: TrackMeta = {}) {
  const sanitized = sanitizeTrackPayload({ event, meta, ts: new Date().toISOString() });
  if (!sanitized.ok) {
    debugLog("drop", sanitized.error);
    return;
  }

  const payload = sanitized.data;
  const serializedPayload = JSON.stringify(payload);

  const gtag = getClientGtag();
  if (gtag) {
    gtag("event", payload.event, payload.meta);
    debugLog("ga4", payload);
  }

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([serializedPayload], { type: "application/json" });
    navigator.sendBeacon("/api/track", blob);
    debugLog("beacon", payload);
    return;
  }

  void fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: serializedPayload,
    keepalive: true
  })
    .then(() => {
      debugLog("fetch", payload);
    })
    .catch(() => {
      debugLog("fetch_error", payload.event);
    });
}
