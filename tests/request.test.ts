import { describe, it, expect, afterEach } from "vitest";
import { getClientIp, parseJsonBody } from "@/lib/request";

const originalEnv = process.env.NODE_ENV;
afterEach(() => {
  (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
});

function req(headers: Record<string, string>, body?: string) {
  return new Request("https://site.test/api", {
    method: body === undefined ? "GET" : "POST",
    headers,
    body
  });
}

describe("getClientIp", () => {
  it("reads the trusted edge header and takes the first segment", () => {
    expect(getClientIp(req({ "cf-connecting-ip": "203.0.113.7" }))).toBe("203.0.113.7");
    expect(getClientIp(req({ "x-vercel-forwarded-for": "203.0.113.9, 70.1.1.1" }))).toBe("203.0.113.9");
  });

  it("accepts a valid IPv6 but rejects malformed ones (regression)", () => {
    expect(getClientIp(req({ "cf-connecting-ip": "2001:db8::1" }))).toBe("2001:db8::1");
    // "::::" passed the old loose regex; isIP rejects it -> fallback.
    expect(getClientIp(req({ "cf-connecting-ip": "::::" }))).toBe("0.0.0.0");
  });

  it("falls back when no trusted header is present", () => {
    expect(getClientIp(req({}))).toBe("0.0.0.0");
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
