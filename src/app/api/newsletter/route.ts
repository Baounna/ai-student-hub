import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { normalizeLocale, normalizeSource, subscribeConvertKit } from "@/lib/convertkit";

type NewsletterPayload = {
  email?: string;
  name?: string;
  locale?: string;
  source?: string;
  company?: string;
};

export async function POST(request: Request) {
  try {
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

    if (!subscribeResult.ok) {
      return NextResponse.json({ ok: false, error: "Provider error" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, forwarded: !subscribeResult.skipped });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}
