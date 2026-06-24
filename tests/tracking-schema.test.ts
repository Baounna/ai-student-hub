import { describe, it, expect } from "vitest";
import { sanitizeTrackPayload, isTrackEventName } from "@/lib/tracking-schema";

describe("isTrackEventName", () => {
  it("accepts allowlisted events only", () => {
    expect(isTrackEventName("affiliate_click")).toBe(true);
    expect(isTrackEventName("auth_login_attempt")).toBe(true);
    expect(isTrackEventName("not_a_real_event")).toBe(false);
    expect(isTrackEventName("")).toBe(false);
  });
});

describe("sanitizeTrackPayload", () => {
  it("rejects non-objects and unknown events", () => {
    expect(sanitizeTrackPayload(null).ok).toBe(false);
    expect(sanitizeTrackPayload("x").ok).toBe(false);
    expect(sanitizeTrackPayload({ event: "evil_event" }).ok).toBe(false);
    expect(sanitizeTrackPayload({}).ok).toBe(false);
  });

  it("accepts a valid event and sanitizes meta", () => {
    const result = sanitizeTrackPayload({
      event: "affiliate_click",
      meta: { source: "  home  ", count: 3, flag: true, bad: { nested: 1 }, junk: NaN }
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.event).toBe("affiliate_click");
    expect(result.data.meta.source).toBe("home"); // trimmed
    expect(result.data.meta.count).toBe(3);
    expect(result.data.meta.flag).toBe(true);
    expect(result.data.meta.bad).toBeUndefined(); // objects dropped
    expect(result.data.meta.junk).toBeUndefined(); // NaN dropped
    expect(typeof result.data.ts).toBe("string");
  });

  it("drops empty string meta values", () => {
    const result = sanitizeTrackPayload({ event: "lead_magnet_click", meta: { source: "   " } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.meta.source).toBeUndefined();
  });
});
