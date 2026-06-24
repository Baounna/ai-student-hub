import { describe, it, expect } from "vitest";
import { getOAuthErrorMessage } from "@/lib/auth-feedback";

describe("getOAuthErrorMessage", () => {
  it("returns localized strings for known errors", () => {
    const en = getOAuthErrorMessage("state_mismatch", "en");
    const fr = getOAuthErrorMessage("state_mismatch", "fr");
    expect(en).toBeTruthy();
    expect(fr).toBeTruthy();
    expect(en).not.toBe(fr); // EN and FR differ
  });

  it("returns a generic fallback string for unknown error codes", () => {
    const message = getOAuthErrorMessage("totally_unknown_code", "en");
    expect(typeof message).toBe("string");
    expect((message ?? "").length).toBeGreaterThan(0);
  });

  it("returns null when there is no error", () => {
    expect(getOAuthErrorMessage(null, "en")).toBeNull();
  });
});
