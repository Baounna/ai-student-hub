import type { Locale } from "@/i18n/config";

/**
 * Lives apart from src/lib/feed.ts on purpose.
 *
 * src/i18n/helpers.ts needs these paths to put the autodiscovery link on every
 * page, and feed.ts imports every post and news brief in the site. Importing
 * the builder from the helper would pull the whole content tree into the 43
 * modules that only wanted a URL.
 */
export const feedPath: Record<Locale, string> = {
  en: "/feed.xml",
  fr: "/feed.fr.xml"
};
