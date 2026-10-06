import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { defaultLocale, type Locale } from "@/i18n/config";
import { feedPath } from "@/lib/feed-paths";

export function alternateLanguages(path: string) {
  const normalizedPath = normalizePath(path);
  return {
    en: `/en${normalizedPath}`,
    fr: `/fr${normalizedPath}`
  } satisfies Record<Locale, string>;
}

export function localizedAlternates(path: string, locale: Locale): Metadata["alternates"] {
  const normalizedPath = normalizePath(path);
  return {
    canonical: `/${locale}${normalizedPath}`,
    languages: {
      ...alternateLanguages(normalizedPath),
      "x-default": `/${defaultLocale}${normalizedPath}`
    },
    // Next merges metadata one top-level field at a time, so the `types` block
    // in the root layout was replaced wholesale the moment a page set its own
    // `alternates` -- which all 43 callers of this helper do. The result: the
    // RSS autodiscovery link existed only on `/`, a page that redirects, so no
    // reader could ever find the feed from a page a reader actually lands on.
    // Emitting it here puts it on every page, in that page's own language.
    types: {
      "application/rss+xml": feedPath[locale]
    }
  };
}

function normalizePath(path: string) {
  if (!path || path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
}


/**
 * The Open Graph fields every page should carry and almost none did.
 *
 * Next merges metadata one top-level field at a time, so a page setting its own
 * `openGraph` replaces the root layout's wholesale -- which is why `og:site_name`
 * survived on 3 of 131 pages and `og:locale` on none. For a site that genuinely
 * ships English and French, those two are what tell LinkedIn and Facebook which
 * language a shared card is in, and which site it came from.
 *
 * Spread this into a page's own openGraph rather than restating it, so the next
 * page cannot quietly ship without them.
 */
export function openGraphDefaults(locale: Locale) {
  return {
    siteName: siteConfig.brandName,
    locale: locale === "fr" ? "fr_FR" : "en_US",
    alternateLocale: locale === "fr" ? "en_US" : "fr_FR"
  };
}
