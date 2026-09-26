import { defaultLocale, isLocale, locales } from "@/i18n/config";

/**
 * The edition a reader can actually read, from their browser's own hint.
 *
 * This lived in src/app/page.tsx and served only the root. The un-prefixed
 * stubs -- /about, /blog, /resources and the rest -- redirected to /en
 * unconditionally, so a French reader who typed or followed an old /about link
 * landed in English on a site whose French half is maintained just as
 * carefully. Sharing the function fixes that, and it also makes the 307 those
 * stubs return the correct status: a destination that varies by request is
 * temporary by definition, where a hardcoded /en would have wanted a 308.
 *
 * Accept-Language is a hint, not an identity: a reader who wants the other
 * edition can still switch, and the choice is remembered from there.
 */
export function preferredLocale(header: string | null) {
  if (!header) return defaultLocale;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number.parseFloat(q.split("=")[1]) || 0 : 1 };
    })
    .filter((entry) => entry.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    // Match the base language, so fr-FR, fr-MA and fr all reach the French edition.
    const base = tag.split("-")[0];
    if (isLocale(base) && locales.includes(base)) return base;
  }
  return defaultLocale;
}
