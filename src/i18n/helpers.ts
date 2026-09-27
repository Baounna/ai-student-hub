import type { Metadata } from "next";
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
