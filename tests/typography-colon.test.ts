import { describe, it, expect } from "vitest";
import { withColon } from "@/i18n/typography";

describe("withColon", () => {
  it("puts a non-breaking space before the colon in French", () => {
    expect(withColon("Dernière synchronisation", "fr")).toBe("Dernière synchronisation :");
  });

  it("leaves English alone", () => {
    expect(withColon("Last sync", "en")).toBe("Last sync:");
  });

  it("uses U+00A0 and not an ordinary space", () => {
    // An ordinary space lets the colon wrap to the next line by itself, which
    // is the reason the written content already uses the non-breaking one.
    const fr = withColon("Source", "fr");
    expect(fr).toContain(" ");
    expect(fr).not.toContain(" :");
  });

  it("does not double the space on a label that already ends in one", () => {
    expect(withColon("Source ", "fr")).not.toContain("  ");
  });
});
