import { NextResponse } from "next/server";
import { getClientIp, parseJsonBody } from "@/lib/request";
import { enforceRateLimitRules, rateLimitIdentifier } from "@/lib/rate-limit";
import { isSafeWebhookTarget, isTrustedMutationRequest } from "@/lib/security";
import { sanitizeTrackPayload } from "@/lib/tracking-schema";
import { isValidEmail, sanitizeEmailInput } from "@/lib/input";

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
    const limiter = await enforceRateLimitRules([
      { key: "track:endpoint", limit: 15000, windowMs: 60 * 1000 },
      { key: `track:ip:${rateLimitIdentifier(ip)}`, limit: 240, windowMs: 60 * 1000 }
    ]);
    if (!limiter.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limiter.retryAfter) } }
      );
    }

    const parsedBody = await parseJsonBody<unknown>(request, { maxBytes: 16 * 1024 });
    if (!parsedBody.ok) {
      return NextResponse.json(
        { ok: false, error: parsedBody.error === "payload_too_large" ? "Payload too large" : "Invalid request body" },
        { status: parsedBody.error === "payload_too_large" ? 413 : 400 }
      );
    }
    const sanitized = sanitizeTrackPayload(parsedBody.data);
    if (!sanitized.ok) {
      return NextResponse.json({ ok: false, error: sanitized.error }, { status: 400 });
    }

    const event = sanitized.data;
    const emailCandidate =
      typeof event.meta.email === "string" && event.meta.email.length <= 254
        ? sanitizeEmailInput(event.meta.email)
        : "";

    if (emailCandidate && isValidEmail(emailCandidate)) {
      const emailLimiter = await enforceRateLimitRules([
        { key: `track:email:${rateLimitIdentifier(emailCandidate)}`, limit: 360, windowMs: 10 * 60 * 1000 }
      ]);
      if (!emailLimiter.allowed) {
        return NextResponse.json(
          { ok: false, error: "Too many requests" },
          { status: 429, headers: { "Retry-After": String(emailLimiter.retryAfter) } }
        );
      }
    }

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
