import type { Locale } from "@/i18n/config";

export function alternateLanguages(path: string) {
  return {
    en: `/en${path}`,
    fr: `/fr${path}`
  } satisfies Record<Locale, string>;
}
