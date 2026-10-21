import type { Locale } from "@/i18n/config";

/**
 * A tier that does not pre-fill its amount is a label, not a choice.
 *
 * All three tiers pointed at the same URL once, so picking 3 and picking 25
 * were the same click and the reader had to type the amount anyway — the tier
 * UI implied a decision it never passed on. PayPal.me takes the amount as a
 * path segment (paypal.me/name/10), verified against the live handle.
 *
 * Only PayPal is handled: other providers encode amounts differently, and a
 * guessed format would silently drop the number. Anything else returns the
 * plain link, which is what the tiers already did.
 *
 * These live here rather than inside the page because the test that guards them
 * used to be a hand-copied mirror of the page's own function. A mirror of a
 * money path keeps passing while the real code drifts away from it, which is
 * worse than having no test at all.
 */
export function tierHref(baseHref: string | undefined, amount: number, currency: string) {
  if (!baseHref) return baseHref;
  try {
    const url = new URL(baseHref);
    if (url.hostname !== "paypal.me" && url.hostname !== "www.paypal.me") return baseHref;
    if (!Number.isFinite(amount) || amount <= 0) return baseHref;
    // The currency goes in the path too. paypal.me/name/10 reads that 10 in the
    // RECEIVING account's currency, so a page printing "$10" beside a link
    // carrying only "10" was telling the reader a number PayPal would not
    // necessarily charge. paypal.me/name/10USD leaves nothing to interpret.
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}/${amount}${currency}`;
  } catch {
    return baseHref;
  }
}

/**
 * Formatted in the reader's own language, from the one currency in config.
 *
 * Writing the symbol into the markup by hand is how "$3" would outlive any
 * decision to take dirhams, and a French reader expects the symbol after the
 * number rather than before it.
 */
export function formatTier(amount: number, currency: string, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
