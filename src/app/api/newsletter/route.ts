import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { normalizeLocale, normalizeSource, subscribeConvertKit } from "@/lib/convertkit";
import { isTrustedMutationRequest } from "@/lib/security";

type NewsletterPayload = {
  email?: string;
  name?: string;
  locale?: string;
  source?: string;
  company?: string;
};

export async function POST(request: Request) {
  try {
    if (!isTrustedMutationRequest(request)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as NewsletterPayload;
    const ip = getClientIp(request);
    const key = `newsletter:${ip}`;
    const limiter = rateLimit(key, 8, 10 * 60 * 1000);

    if (!limiter.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limiter.retryAfter) } }
      );
    }

    // Honeypot: bots often fill hidden fields.
    if (body.company?.trim()) {
      return NextResponse.json({ ok: true });
    }

    const email = body.email?.trim().toLowerCase();

    if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const locale = normalizeLocale(body.locale);
    const source = normalizeSource(body.source, "newsletter");
    const subscribeResult = await subscribeConvertKit({
      email,
      firstName: body.name?.trim() || undefined,
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
