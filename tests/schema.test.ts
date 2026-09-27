import { describe, it, expect } from "vitest";
import { siteConfig } from "@/config/site";
import {
  authorNode,
  mainEntityOfPage,
  organizationAuthorNode,
  publisherNode,
  schemaIds
} from "@/lib/schema";

/**
 * Every article page described the publishing organization twice -- once in the
 * root layout, once inline under `publisher` -- with no @id on either, so a
 * consumer saw two unrelated organizations that happen to share a name. A run of
 * these rules over the live pages before the change reported 821 problems and 0
 * after, which is what makes them worth keeping.
 */
describe("schema identity", () => {
  it("gives the publisher one stable @id", () => {
    expect(publisherNode()["@id"]).toBe(schemaIds.organization());
    expect(organizationAuthorNode()["@id"]).toBe(schemaIds.organization());
  });

  it("keeps the fields Google reads, rather than collapsing to a bare reference", () => {
    // A publisher that is only {"@id": ...} loses the name and logo that
    // Google's Article documentation requires. Repeating a fully populated node
    // under one @id is how JSON-LD says "the same thing" without dropping them.
    const publisher = publisherNode();

    expect(publisher.name).toBe(siteConfig.brandName);
    expect(publisher.logo?.url).toMatch(/^https?:\/\/.+\/icon\.svg$/);
    expect(publisher["@type"]).toBe("Organization");
  });

  it("never names a Person with the brand string", () => {
    // 48 articles carried author: Person named "AI and Cybersecurity News",
    // while the same string was typed as an Organization on 20 others.
    const author = authorNode();

    if (author["@type"] === "Person") {
      expect(author.name).not.toBe(siteConfig.brandName);
      expect(author["@id"]).toBe(schemaIds.author());
    } else {
      expect(author["@type"]).toBe("Organization");
      expect(author["@id"]).toBe(schemaIds.organization());
    }
  });

  it("reads the brand from config rather than a literal", () => {
    expect(publisherNode().name).toBe(siteConfig.brandName);
    expect(organizationAuthorNode().name).toBe(siteConfig.brandName);
  });

  it("makes mainEntityOfPage a node, not a URL string", () => {
    // schema.org types it as a CreativeWork; a bare string is a URL where a node
    // belongs -- readable by a lenient parser, meaningless to a strict one.
    const page = mainEntityOfPage("/en/blog/some-slug");

    expect(page["@type"]).toBe("WebPage");
    expect(page["@id"]).toBe(page.url);
    expect(page.url).toMatch(/\/en\/blog\/some-slug$/);
  });

  it("keeps the three @ids distinct and absolute", () => {
    const ids = [schemaIds.organization(), schemaIds.website(), schemaIds.author()];

    expect(new Set(ids).size).toBe(3);
    for (const id of ids) expect(id).toMatch(/^https?:\/\/.+#[a-z]+$/);
  });
});
