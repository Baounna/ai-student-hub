import { siteConfig } from "@/config/site";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

/**
 * The publisher, the site and the author, described once.
 *
 * Every article page described the publishing Organization twice -- once in the
 * root layout, once inline under `publisher` -- with no `@id` on either, so a
 * consumer reading the page saw two unrelated organizations that happen to share
 * a name. The brand string was also written out by hand in ten places rather
 * than read from siteConfig, which is the same latent contradiction that put a
 * Person named "AI and Cybersecurity News" on 48 articles.
 *
 * Stable @ids fix the identity. The nodes stay fully populated rather than
 * collapsing to a bare {"@id": ...} reference: Google's Article documentation
 * requires publisher.name and reads publisher.logo, and repeating a node under
 * the same @id is how JSON-LD says "these are the same thing" -- consumers merge
 * them, while a validator looking at one block still finds every field it needs.
 */
export const schemaIds = {
  organization: () => `${getSiteUrl()}/#organization`,
  website: () => `${getSiteUrl()}/#website`,
  author: () => `${getSiteUrl()}/#author`
};

/** The publishing organization, as referenced from an Article's `publisher`. */
export function publisherNode() {
  return {
    "@type": "Organization",
    "@id": schemaIds.organization(),
    name: siteConfig.brandName,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon.svg")
    }
  };
}

/**
 * Who wrote it.
 *
 * The configured human when there is one, the publication otherwise. Never a
 * Person carrying the brand string, which is what this replaced: that claimed
 * the publication was a human on the one property Google reads for authorship,
 * while the same string was typed as an Organization twenty pages away.
 */
export function authorNode() {
  if (!siteConfig.authorName) {
    return {
      "@type": "Organization",
      "@id": schemaIds.organization(),
      name: siteConfig.brandName
    };
  }

  return {
    "@type": "Person",
    "@id": schemaIds.author(),
    name: siteConfig.authorName,
    ...(siteConfig.linkedinUrl ? { sameAs: [siteConfig.linkedinUrl] } : {})
  };
}

/** The publication itself as an author, for pages nobody signs. */
export function organizationAuthorNode() {
  return {
    "@type": "Organization",
    "@id": schemaIds.organization(),
    name: siteConfig.brandName
  };
}

/**
 * The page an article is the main entity of.
 *
 * This was a bare URL string. schema.org types mainEntityOfPage as a CreativeWork,
 * so a string is a URL where a node was expected -- readable by a lenient parser,
 * meaningless to a strict one.
 */
export function mainEntityOfPage(path: string) {
  const url = absoluteUrl(path);
  return { "@type": "WebPage", "@id": url, url };
}
