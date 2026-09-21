import { describe, it, expect, afterEach } from "vitest";
import { getClientIp, parseJsonBody, rateLimitClientKey } from "@/lib/request";

const originalEnv = process.env.NODE_ENV;
afterEach(() => {
  (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  delete (process.env as Record<string, string | undefined>).TRUSTED_CLIENT_IP_HEADER;
});

function req(headers: Record<string, string>, body?: string) {
  return new Request("https://site.test/api", {
    method: body === undefined ? "GET" : "POST",
    headers,
    body
  });
}

describe("getClientIp", () => {
  it("reads the platform header and takes the first segment", () => {
    expect(getClientIp(req({ "x-real-ip": "203.0.113.7" }))).toBe("203.0.113.7");
    expect(getClientIp(req({ "x-vercel-forwarded-for": "203.0.113.9, 70.1.1.1" }))).toBe("203.0.113.9");
  });

  it("accepts a valid IPv6 but rejects malformed ones (regression)", () => {
    expect(getClientIp(req({ "x-real-ip": "2001:db8::1" }))).toBe("2001:db8::1");
    // "::::" passed the old loose regex; isIP rejects it -> fallback.
    expect(getClientIp(req({ "x-real-ip": "::::" }))).toBe("0.0.0.0");
  });

  it("ignores cf-connecting-ip unless Cloudflare is declared (regression)", () => {
    // This header led the trusted list while the site ran on Vercel alone, so
    // nothing overwrote it and a caller could reset every per-IP rate limit by
    // sending a new value each request. Confirmed against production before the
    // fix; keep it untrusted by default.
    delete (process.env as Record<string, string | undefined>).TRUSTED_CLIENT_IP_HEADER;
    expect(getClientIp(req({ "cf-connecting-ip": "203.0.113.7" }))).toBe("0.0.0.0");

    // A spoofed value must not win over the header the platform controls.
    expect(
      getClientIp(req({ "cf-connecting-ip": "203.0.113.7", "x-real-ip": "198.51.100.4" }))
    ).toBe("198.51.100.4");
  });

  it("trusts a proxy header only when it is explicitly configured", () => {
    (process.env as Record<string, string | undefined>).TRUSTED_CLIENT_IP_HEADER = "cf-connecting-ip";
    expect(getClientIp(req({ "cf-connecting-ip": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("never trusts client-settable x-forwarded-for in production", () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    expect(getClientIp(req({ "x-forwarded-for": "203.0.113.7" }))).toBe("0.0.0.0");
  });

  it("falls back when no trusted header is present", () => {
    expect(getClientIp(req({}))).toBe("0.0.0.0");
  });
});

describe("rateLimitClientKey", () => {
  // The bug: per-IP limits counted the full 128-bit IPv6 address. One machine
  // is normally handed a whole /64 and can pick any address in it, so the
  // newsletter's 8-per-10-minutes was 8 per address — effectively unlimited,
  // with no header forgery involved at all.
  it("collapses an IPv6 address to its /64", () => {
    const first = rateLimitClientKey("2001:db8:1:2:3:4:5:6");
    const second = rateLimitClientKey("2001:db8:1:2:dead:beef:cafe:1");
    expect(first).toBe(second);
    expect(first).toBe("2001:0db8:0001:0002::/64");
  });

  it("keeps different /64s apart", () => {
    expect(rateLimitClientKey("2001:db8:1:2::1")).not.toBe(rateLimitClientKey("2001:db8:1:3::1"));
  });

  it("expands a compressed run before taking the prefix", () => {
    // "2001:db8::1" is 2001:0db8:0000:0000:...; naively splitting on ":" would
    // read the trailing "1" as the fourth group and bucket it with unrelated
    // addresses.
    expect(rateLimitClientKey("2001:db8::1")).toBe("2001:0db8:0000:0000::/64");
    expect(rateLimitClientKey("::1")).toBe("0000:0000:0000:0000::/64");
  });

  it("leaves IPv4 whole", () => {
    expect(rateLimitClientKey("203.0.113.7")).toBe("203.0.113.7");
    expect(rateLimitClientKey("0.0.0.0")).toBe("0.0.0.0");
  });

  it("leaves an IPv4-mapped address whole rather than bucketing the world together", () => {
    expect(rateLimitClientKey("::ffff:203.0.113.7")).toBe("::ffff:203.0.113.7");
  });

  it("falls back rather than returning an empty bucket key", () => {
    expect(rateLimitClientKey("")).toBe("0.0.0.0");
  });
});

describe("parseJsonBody", () => {
  it("parses valid JSON", async () => {
    const result = await parseJsonBody<{ a: number }>(req({ "content-type": "application/json" }, '{"a":1}'));
    expect(result).toEqual({ ok: true, data: { a: 1 } });
  });

  it("rejects invalid JSON", async () => {
    const result = await parseJsonBody(req({}, "{not json"));
    expect(result.ok).toBe(false);
  });

  it("rejects oversized payloads", async () => {
    const big = JSON.stringify({ a: "x".repeat(2000) });
    const result = await parseJsonBody(req({}, big), { maxBytes: 256 });
    expect(result).toEqual({ ok: false, error: "payload_too_large" });
  });
});
