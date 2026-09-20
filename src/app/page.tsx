import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { defaultLocale, isLocale, locales } from "@/i18n/config";

/**
 * Send a reader to the edition they can actually read.
 *
 * This redirected everyone to /en unconditionally. The audience this
 * publication is written for is French-speaking students, every article is
 * translated, and a browser announcing fr-FR still landed on the English
 * edition — with no visible way back, since the language control lives inside
 * the settings panel. The French half of the site was effectively unreachable
 * for the people it was written for.
 *
 * Accept-Language is a hint, not an identity: a reader who wants the other
 * edition can still switch, and the choice is remembered from there.
 */
function preferredLocale(header: string | null) {
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

export default async function RootPage() {
  const header = (await headers()).get("accept-language");
  redirect(`/${preferredLocale(header)}`);
}
