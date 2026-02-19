import type { Metadata } from "next";
import { defaultLocale, type Locale } from "@/i18n/config";

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
    }
  };
}

function normalizePath(path: string) {
  if (!path || path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
}
