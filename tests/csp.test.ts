import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildContentSecurityPolicy } from "../middleware";

const NONCE = "a".repeat(32);

function directive(csp: string, name: string) {
  return csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) || "";
}

describe("Content-Security-Policy", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    process.env.ANALYTICS_MODE = "none";
    delete process.env.GA4_MEASUREMENT_ID;
    process.env.BOT_PROTECTION_MODE = "none";
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  // The headline guarantee: scripts run by nonce, never by being inline.
  it("never allows unsafe-inline scripts", () => {
    expect(directive(buildContentSecurityPolicy(NONCE), "script-src")).not.toContain("unsafe-inline");
  });

  it("carries the request's nonce", () => {
    expect(directive(buildContentSecurityPolicy(NONCE), "script-src")).toContain(`'nonce-${NONCE}'`);
  });

  /**
   * Google's origins used to be listed unconditionally while the site shipped no
   * gtag at all, leaving the policy permanently ready to execute a third-party
   * script nothing loads.
   */
  it("omits Google's origins when analytics is off", () => {
    const csp = buildContentSecurityPolicy(NONCE);
    expect(csp).not.toContain("googletagmanager.com");
    expect(csp).not.toContain("google-analytics.com");
  });

  it("still allows them when analytics is genuinely configured", () => {
    process.env.ANALYTICS_MODE = "ga4";
    process.env.GA4_MEASUREMENT_ID = "G-ABC1234567";
    const csp = buildContentSecurityPolicy(NONCE);
    expect(directive(csp, "script-src")).toContain("https://www.googletagmanager.com");
    expect(directive(csp, "connect-src")).toContain("https://www.google-analytics.com");
  });

  // A placeholder id is not configuration. It used to be enough to load 148 KB
  // of gtag that could never report anywhere.
  it("treats a placeholder measurement id as not configured", () => {
    process.env.ANALYTICS_MODE = "ga4";
    process.env.GA4_MEASUREMENT_ID = "G-REPLACE1234";
    expect(buildContentSecurityPolicy(NONCE)).not.toContain("googletagmanager.com");
  });

  it("keeps the clickjacking and injection guards", () => {
    const csp = buildContentSecurityPolicy(NONCE);
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it("gates Turnstile on Turnstile being on", () => {
    expect(buildContentSecurityPolicy(NONCE)).not.toContain("challenges.cloudflare.com");
    process.env.BOT_PROTECTION_MODE = "turnstile";
    expect(buildContentSecurityPolicy(NONCE)).toContain("challenges.cloudflare.com");
  });
});
