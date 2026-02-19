import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { isSafeWebhookTarget, isTrustedMutationRequest } from "@/lib/security";
import { sanitizeTrackPayload } from "@/lib/tracking-schema";

const isTrackingDebugEnabled =
  process.env.NODE_ENV !== "production" &&
  ["1", "true", "yes"].includes(((process.env.TRACKING_DEBUG || process.env.NEXT_PUBLIC_TRACKING_DEBUG) || "").toLowerCase());

function debugLog(payload: unknown) {
  if (!isTrackingDebugEnabled) return;
  console.info("[track:event]", payload);
}

export async function POST(request: Request) {
  try {
    if (!isTrustedMutationRequest(request)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const ip = getClientIp(request);
    const limiter = rateLimit(`track:${ip}`, 240, 60 * 1000);
    if (!limiter.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limiter.retryAfter) } }
      );
    }

    const rawPayload = (await request.json()) as unknown;
    const sanitized = sanitizeTrackPayload(rawPayload);
    if (!sanitized.ok) {
      return NextResponse.json({ ok: false, error: sanitized.error }, { status: 400 });
    }

    const event = sanitized.data;
    const webhook = (process.env.TRACKING_WEBHOOK_URL || "").trim();
    const shouldSendWebhook = isSafeWebhookTarget(webhook);

    if (shouldSendWebhook) {
      try {
        await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(8_000),
          body: JSON.stringify(event)
        });
      } catch {
        debugLog({ webhook: "failed", event: event.event });
      }
    }

    debugLog(event);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}
