/**
 * Does the affiliate disclosure the reader sees match what the links do?
 *
 * The preflight used to warn that AFFILIATE_DISCLOSURE_TEXT_EN/FR were "not
 * fully set" and call it OK once they were. That pushed the operator towards
 * the one configuration the disclosure design exists to avoid. src/config/site.ts
 * derives the text from hasPaidLinks, so it stops denying affiliation the moment
 * a link carries a referral code -- but an explicit override wins over that, and
 * a frozen string in a Vercel dashboard cannot notice the day the links start
 * earning. The old warning rewarded freezing it.
 *
 * So the check is now about truth rather than presence: no override is the
 * healthy state, and an override is judged against what the links actually do.
 */

/**
 * Mirrors REFERRAL_PARAM in src/config/site.ts. It is a copy because this is a
 * plain .mjs script and that file is TypeScript; tests/affiliate-disclosure.test.ts
 * fails if the two ever drift.
 */
export const REFERRAL_PARAM =
  /[?&](ref|refcode|aff|affiliate|affid|partner|tag|via|irclickid|utm_medium=affiliate)=/i;

/** Wording that tells the reader nothing is earned, in either language. */
const DENIES_EARNING = /not in any affiliate programme|earn nothing|aucun programme d'affiliation|ne recevons aucune/i;

/** Wording that tells the reader something may be earned, in either language. */
const DISCLOSES_EARNING = /commission|referral link|affiliate link|lien(s)? de parrainage|lien(s)? d'affiliation/i;

export function linksCanEarn(env = {}) {
  if ((env.NEXT_PUBLIC_DIGITALOCEAN_REF || "").trim()) return true;
  return [1, 2, 3, 4, 5].some((index) => REFERRAL_PARAM.test(env[`AFFILIATE_${index}_URL`] || ""));
}

/**
 * Returns one `{ level, message }` for the preflight to print. Pure, so the
 * test can put it through every combination without running the preflight.
 */
export function affiliateDisclosureVerdict(env = {}) {
  const en = (env.AFFILIATE_DISCLOSURE_TEXT_EN || "").trim();
  const fr = (env.AFFILIATE_DISCLOSURE_TEXT_FR || "").trim();
  const earns = linksCanEarn(env);

  if (!en && !fr) {
    return {
      level: "ok",
      message: earns
        ? "Affiliate disclosure follows the links: it discloses, because a link carries a referral code."
        : "Affiliate disclosure follows the links: it denies earning, because no link can earn."
    };
  }

  // One language overridden and not the other means EN and FR readers are told
  // different things about the same links. Whichever is true, one is wrong.
  if (!en || !fr) {
    return {
      level: "error",
      message: `AFFILIATE_DISCLOSURE_TEXT_${en ? "FR" : "EN"} is missing while the other is set, so one language gets the override and the other the built-in text.`
    };
  }

  for (const [label, text] of [["EN", en], ["FR", fr]]) {
    if (earns && DENIES_EARNING.test(text)) {
      return {
        level: "error",
        message: `AFFILIATE_DISCLOSURE_TEXT_${label} denies earning, but a link carries a referral code. Unset it to let the text follow the links.`
      };
    }
    if (earns && !DISCLOSES_EARNING.test(text)) {
      return {
        level: "error",
        message: `AFFILIATE_DISCLOSURE_TEXT_${label} never says a link may earn, but one carries a referral code. Unset it to let the text follow the links.`
      };
    }
    if (!earns && DISCLOSES_EARNING.test(text)) {
      return {
        level: "error",
        message: `AFFILIATE_DISCLOSURE_TEXT_${label} promises the reader a commission no link can earn. Unset it to let the text follow the links.`
      };
    }
  }

  return {
    level: "warn",
    message:
      "Affiliate disclosure is overridden, so it no longer follows the links. Re-read it every time an affiliate URL changes, or unset both to let it follow again."
  };
}
