import { describe, it, expect } from "vitest";
import { jsonLd } from "@/lib/json-ld";

const LINE_SEPARATOR = "\u2028";
const PARAGRAPH_SEPARATOR = "\u2029";

describe("jsonLd", () => {
  it("stays valid JSON that parses back to the same data", () => {
    const data = { "@type": "NewsArticle", headline: "Fine & dandy", n: 3 };
    expect(JSON.parse(jsonLd(data))).toEqual(data);
  });

  it("never emits a sequence that can close the script block", () => {
    // Article schemas take `description` straight from scraped feed summaries,
    // which still contain raw HTML. A summary carrying an end-script tag would
    // have closed the JSON-LD block early and turned the rest into markup.
    const nasty = "</script><img src=x onerror=alert(1)>";
    const payload = jsonLd({ description: nasty });

    expect(payload).not.toContain("<");
    expect(payload).not.toContain(">");
    expect(payload.toLowerCase()).not.toContain("</script");
    // Escaped, not deleted: a JSON parser still reads the original text.
    expect(JSON.parse(payload).description).toBe(nasty);
  });

  it("escapes JavaScript line terminators that are legal inside JSON", () => {
    const raw = `x${LINE_SEPARATOR}y${PARAGRAPH_SEPARATOR}z`;
    const payload = jsonLd({ a: raw });

    expect(payload).not.toContain(LINE_SEPARATOR);
    expect(payload).not.toContain(PARAGRAPH_SEPARATOR);
    expect(JSON.parse(payload).a).toBe(raw);
  });
});
