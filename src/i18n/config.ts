export const locales = ["en", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

/**
 * The locale a URL is in, for the places that cannot read route params.
 *
 * An error boundary is handed only { error, reset } and a not-found boundary is
 * handed nothing at all, so neither can reach the [lang] segment the way a page
 * does — yet both still have to address the reader in the language they were
 * already reading. The path is the only source of truth they can both see:
 * usePathname() on the client, and the x-pathname header middleware sets on the
 * server.
 */
export function localeFromPathname(pathname: string | null | undefined): Locale {
  const segment = (pathname || "").split("/").filter(Boolean)[0] || "";
  return isLocale(segment) ? segment : defaultLocale;
}
