import { isSafeHttpUrl, normalizeHttpUrl } from "@/lib/url";

/**
 * The single gate on whether this site may offer to sell the career guide.
 *
 * Six pages read NEXT_PUBLIC_PRODUCT_CHECKOUT_URL directly and switched their
 * calls to action on it, so setting one environment variable turned the whole
 * site into a shop — "Buy execution guide", "Buy the guide", "Buy student
 * guide" — for a product whose own page states plainly that it does not exist.
 * Nobody would have had to write the guide first. One env var, and the site
 * starts taking money for it.
 *
 * So the gate is here, in code, where changing it is a deliberate act that sits
 * next to this comment. When the guide is actually written, delete
 * GUIDE_EXISTS and let the environment decide again.
 */
const GUIDE_EXISTS = false;

export function getProductCheckoutUrl() {
  if (!GUIDE_EXISTS) return "";
  const raw = (process.env.NEXT_PUBLIC_PRODUCT_CHECKOUT_URL || "").trim();
  return isSafeHttpUrl(raw) ? normalizeHttpUrl(raw) : "";
}

export function canSellProduct() {
  return Boolean(getProductCheckoutUrl());
}

/**
 * Where a "career guide" call to action should send a reader.
 *
 * Twenty-eight links across the site pointed at /product/ai-career-guide,
 * whose own page says plainly: "This guide does not exist. There is nothing to
 * buy, no price, and no date promised." Four of them were on the homepage, two
 * were the strongest buttons in their sections, and one was step 3 of the
 * site's own three-step onboarding -- so the funnel's terminal step was a page
 * announcing there was nothing there. The page is honest; the navigation
 * pointing at it was not.
 *
 * While the guide does not exist these go to the internship board, which is the
 * thing the site actually has and the thing a reader clicking "career guide"
 * wants. The moment GUIDE_EXISTS flips, every one of them follows without
 * anybody hunting for call sites -- which is the reason this is a function and
 * not twenty-eight edits.
 */
export function getGuideCtaHref(locale: string) {
  return GUIDE_EXISTS ? `/${locale}/product/ai-career-guide` : `/${locale}/stages`;
}

/**
 * What a "career guide" call to action should say.
 *
 * Paired with getGuideCtaHref because a label and a destination that disagree
 * are their own defect: a button reading "Open the career guide" that lands on
 * an internship list is not an improvement on one that lands nowhere. One of
 * these labels read "Career guide ($9-$19)" -- a price, for a product whose own
 * page says there is nothing to buy.
 *
 * Both functions read the same constant, so they cannot drift apart.
 */
export function getGuideCtaLabel(locale: string) {
  if (GUIDE_EXISTS) {
    return locale === "fr" ? "Voir le guide carrière" : "Open the career guide";
  }
  return locale === "fr" ? "Voir les stages ouverts" : "See open internships";
}
