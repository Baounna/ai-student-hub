import { NextResponse } from "next/server";
import { getClientIp, parseJsonBody } from "@/lib/request";
import { enforceRateLimitRules, rateLimitIdentifier } from "@/lib/rate-limit";
import { normalizeLocale, normalizeSource, subscribeConvertKit } from "@/lib/convertkit";
import { isTrustedMutationRequest } from "@/lib/security";
import { isValidEmail, sanitizeEmailInput, sanitizeSourceInput, sanitizeTextInput } from "@/lib/input";
import { verifyBotChallenge } from "@/lib/bot-protection";

type NewsletterPayload = {
  email?: string;
  name?: string;
  locale?: string;
  source?: string;
  company?: string;
  botToken?: string;
};

export async function POST(request: Request) {
  try {
    if (!isTrustedMutationRequest(request)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const ip = getClientIp(request);
    const ipRateGate = await enforceRateLimitRules([
      { key: "newsletter:endpoint", limit: 1200, windowMs: 60 * 1000 },
      { key: `newsletter:ip:${rateLimitIdentifier(ip)}`, limit: 8, windowMs: 10 * 60 * 1000 }
    ]);
    if (!ipRateGate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(ipRateGate.retryAfter) } }
      );
    }

    const parsedBody = await parseJsonBody<NewsletterPayload>(request, { maxBytes: 10 * 1024 });
    if (!parsedBody.ok) {
      return NextResponse.json(
        { ok: false, error: parsedBody.error === "payload_too_large" ? "Payload too large" : "Invalid request body" },
        { status: parsedBody.error === "payload_too_large" ? 413 : 400 }
      );
    }
    const body = parsedBody.data;

    // Honeypot: bots often fill hidden fields.
    if (body.company?.trim()) {
      return NextResponse.json({ ok: true });
    }

    const email = sanitizeEmailInput(body.email);

    if (!email || email.length > 254 || !isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const principalRateGate = await enforceRateLimitRules([
      { key: `newsletter:email:${rateLimitIdentifier(email)}`, limit: 6, windowMs: 30 * 60 * 1000 },
      { key: `newsletter:combo:${rateLimitIdentifier(`${email}:${ip}`)}`, limit: 4, windowMs: 30 * 60 * 1000 }
    ]);
    if (!principalRateGate.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(principalRateGate.retryAfter) } }
      );
    }

    const botResult = await verifyBotChallenge(body.botToken, ip);
    if (!botResult.ok) {
      const status = botResult.reason === "provider_unavailable" ? 503 : 403;
      return NextResponse.json({ ok: false, error: "Request verification failed" }, { status });
    }

    const locale = normalizeLocale(body.locale);
    const source = normalizeSource(sanitizeSourceInput(body.source, "newsletter"), "newsletter");
    const firstName = sanitizeTextInput(body.name, { maxLength: 80 });
    const subscribeResult = await subscribeConvertKit({
      email,
      firstName: firstName || undefined,
      locale,
      source
    });
    const emailForwarded = subscribeResult.ok && !subscribeResult.skipped;
    const deliveryStatus = emailForwarded ? "sent" : subscribeResult.ok ? "queued" : "failed";
    return NextResponse.json({
      ok: true,
      forwarded: emailForwarded,
      deliveryStatus,
      emailDeliveryFailed: !subscribeResult.ok,
      message: emailForwarded ? "Subscription confirmed. Check your inbox." : "Subscription received."
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}
