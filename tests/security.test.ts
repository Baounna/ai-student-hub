import { describe, it, expect, afterEach } from "vitest";
import { isSafeWebhookTarget } from "@/lib/security";

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  // NODE_ENV is read at call time inside isSafeWebhookTarget; restore it.
  (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
});

function setProd() {
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";
}

describe("isSafeWebhookTarget (SSRF guard)", () => {
  it("rejects loopback and private IPv4 in production", () => {
    setProd();
    expect(isSafeWebhookTarget("https://127.0.0.1/hook")).toBe(false);
    expect(isSafeWebhookTarget("https://10.0.0.5/hook")).toBe(false);
    expect(isSafeWebhookTarget("https://192.168.1.1/hook")).toBe(false);
    expect(isSafeWebhookTarget("https://169.254.169.254/latest")).toBe(false);
  });

  it("rejects IPv4-mapped IPv6 loopback/link-local in production (regression)", () => {
    setProd();
    // These would bypass the guard before the IPv4-mapped fix.
    expect(isSafeWebhookTarget("https://[::ffff:127.0.0.1]/hook")).toBe(false);
    expect(isSafeWebhookTarget("https://[::ffff:169.254.169.254]/hook")).toBe(false);
    expect(isSafeWebhookTarget("https://[::1]/hook")).toBe(false);
  });

  it("rejects http in production but allows https public hosts", () => {
    setProd();
    expect(isSafeWebhookTarget("http://hooks.example-real.com/x")).toBe(false);
    expect(isSafeWebhookTarget("https://hooks.slack.com/services/x")).toBe(true);
  });

  it("rejects non-http(s) and junk", () => {
    expect(isSafeWebhookTarget("ftp://host/x")).toBe(false);
    expect(isSafeWebhookTarget("not-a-url")).toBe(false);
  });
});
