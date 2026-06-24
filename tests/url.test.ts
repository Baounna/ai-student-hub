import { describe, it, expect } from "vitest";
import { parseHttpUrl, isSafeHttpUrl, normalizeHttpUrl } from "@/lib/url";

describe("parseHttpUrl", () => {
  it("accepts http and https", () => {
    expect(parseHttpUrl("https://example.com")?.protocol).toBe("https:");
    expect(parseHttpUrl("http://example.com")?.protocol).toBe("http:");
  });

  it("rejects non-http protocols and junk", () => {
    expect(parseHttpUrl("javascript:alert(1)")).toBeNull();
    expect(parseHttpUrl("ftp://example.com")).toBeNull();
    expect(parseHttpUrl("not a url")).toBeNull();
    expect(parseHttpUrl("")).toBeNull();
  });
});

describe("isSafeHttpUrl", () => {
  it("accepts real https links", () => {
    expect(isSafeHttpUrl("https://anthropic.com/news")).toBe(true);
  });

  it("rejects placeholder hosts and fragments", () => {
    expect(isSafeHttpUrl("https://example.com")).toBe(false);
    expect(isSafeHttpUrl("https://your-domain.com/path")).toBe(false);
    expect(isSafeHttpUrl("https://real.com/your-link-here")).toBe(false);
    expect(isSafeHttpUrl("https://real.com/placeholder")).toBe(false);
  });
});

describe("normalizeHttpUrl", () => {
  it("strips the hash fragment", () => {
    expect(normalizeHttpUrl("https://a.com/x#frag")).toBe("https://a.com/x");
  });

  it("returns empty string for invalid input", () => {
    expect(normalizeHttpUrl("nope")).toBe("");
  });
});
