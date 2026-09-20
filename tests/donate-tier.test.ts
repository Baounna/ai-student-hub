import { describe, it, expect } from "vitest";

// Mirror of tierHref in the donate page. Kept here because the behaviour it
// guards is a money path: a tier that silently drops its amount looks like it
// works and costs the reader an extra step at exactly the wrong moment.
function tierHref(baseHref: string | undefined, amount: string) {
  if (!baseHref) return baseHref;
  try {
    const url = new URL(baseHref);
    if (url.hostname !== "paypal.me" && url.hostname !== "www.paypal.me") return baseHref;
    const value = amount.replace(/[^0-9.]/g, "");
    if (!value) return baseHref;
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}/${value}`;
  } catch {
    return baseHref;
  }
}

describe("donation tier links", () => {
  it("passes the amount through to PayPal", () => {
    expect(tierHref("https://paypal.me/baounna", "$3")).toBe("https://paypal.me/baounna/3");
    expect(tierHref("https://paypal.me/baounna", "$25")).toBe("https://paypal.me/baounna/25");
  });

  it("gives each tier a different destination", () => {
    const base = "https://paypal.me/baounna";
    const hrefs = ["$3", "$10", "$25"].map((a) => tierHref(base, a));
    expect(new Set(hrefs).size).toBe(3);
  });

  it("tolerates a trailing slash on the configured link", () => {
    expect(tierHref("https://paypal.me/baounna/", "$10")).toBe("https://paypal.me/baounna/10");
  });

  it("leaves providers it does not understand alone", () => {
    // Guessing a format would drop the amount silently, which is worse than
    // sending the reader to a page where they type it themselves.
    for (const other of ["https://ko-fi.com/someone", "https://www.buymeacoffee.com/someone"]) {
      expect(tierHref(other, "$10")).toBe(other);
    }
  });

  it("never produces a broken URL from odd input", () => {
    expect(tierHref("https://paypal.me/baounna", "free")).toBe("https://paypal.me/baounna");
    expect(tierHref("not-a-url", "$10")).toBe("not-a-url");
    expect(tierHref(undefined, "$10")).toBeUndefined();
  });
});
