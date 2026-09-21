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
