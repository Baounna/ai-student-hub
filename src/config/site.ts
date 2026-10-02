import type { Locale } from "@/i18n/config";
import { isSafeHttpUrl, normalizeHttpUrl } from "@/lib/url";

type Testimonial = {
  quote: Record<Locale, string>;
  name: string;
  role: Record<Locale, string>;
  url?: string;
};

type AffiliatePartner = {
  name: string;
  url: string;
  placement: string;
};

function envValue(key: string) {
  return (process.env[key] || "").trim();
}

/**
 * French elision always carries an apostrophe.
 *
 * "d IA", "j aide", "l article" are not spellings; they are what is left after
 * text has been run through something that stripped its accents and
 * apostrophes. FOUNDER_BIO_FR and LINKEDIN_SHORT_BIO_FR in .env.local are in
 * exactly that state, so /fr/about introduced the author with "Etudiant en
 * derniere annee d IA, ... j aide les etudiants a transformer" -- under the
 * heading "Fondateur", on a site whose whole pitch is care. The built-in
 * fallbacks a few lines down are correct, and production happens not to set
 * these, which is the only reason a reader never saw it.
 *
 * So an override that cannot be French is not used. Falling back to correct
 * copy is always better than publishing broken copy, and this is the kind of
 * damage nobody notices in a dashboard field.
 */
const BROKEN_ELISION = /\b[cdjlmnst] [aeiouyéèêàâîôûAEIOUYÉÈÊÀÂÎÔÛ]/;

function usableLocaleOverride(value: string, locale: Locale): string {
  if (locale !== "fr") return value;
  return BROKEN_ELISION.test(value) ? "" : value;
}

function envLocaleValue(enKey: string, frKey: string, fallback: Record<Locale, string>) {
  return {
    en: envValue(enKey) || fallback.en,
    fr: usableLocaleOverride(envValue(frKey), "fr") || fallback.fr
  } as const;
}

function readAffiliatePartner(index: number): AffiliatePartner | null {
  const name = envValue(`AFFILIATE_${index}_NAME`);
  const url = envValue(`AFFILIATE_${index}_URL`);
  const placement = envValue(`AFFILIATE_${index}_PLACEMENT`) || "resources";
  if (!name || !isSafeHttpUrl(url)) return null;
  return { name, url: normalizeHttpUrl(url), placement };
}

function readTestimonial(index: number): Testimonial | null {
  const quote = envValue(`TESTIMONIAL_${index}_QUOTE`);
  const name = envValue(`TESTIMONIAL_${index}_NAME`);
  const role = envValue(`TESTIMONIAL_${index}_ROLE`);
  if (!quote || !name || !role) return null;
  return {
    quote: { en: quote, fr: quote },
    name,
    role: { en: role, fr: role }
  };
}

const contactEmail = envValue("NEXT_PUBLIC_CONTACT_EMAIL") || "bna.mohamed.511@gmail.com";
const legalName = envValue("NEXT_PUBLIC_LEGAL_NAME") || "AI and Cybersecurity News";
const affiliatePartners = [1, 2, 3, 4, 5]
  .map((index) => readAffiliatePartner(index))
  .filter((partner): partner is AffiliatePartner => Boolean(partner));

/**
 * Whether anything on this site carries a referral or affiliate link.
 *
 * Three places tell the reader there are none: a "No paid links" chip on
 * /resources and /compare, and the disclosure paragraph, which states flatly
 * that "we are not in any affiliate programme and earn nothing when you follow
 * them". Production serves no referral code today, so all three are true --
 * but they were true by luck, not by construction. Setting
 * NEXT_PUBLIC_DIGITALOCEAN_REF appends a refcode to every DigitalOcean link on
 * the site, and AFFILIATE_1_URL publishes a partner card, and neither touches
 * the sentence that denies both. One variable in a dashboard and the site
 * states the opposite of what it does, in the place a reader goes to check.
 *
 * Derived rather than hand-set, unlike TESTIMONIALS_ARE_REAL above, because
 * here the truth is readable from the environment: a gate someone must
 * remember to flip is the same hazard one step further along.
 */
/**
 * A referral code, not merely a partner card.
 *
 * The first version of this counted any AFFILIATE_n_URL as a paid link, which
 * was too broad in the direction that produces a lie: every partner URL on the
 * page today is a bare homepage -- digitalocean.com, coursera.org, notion.so --
 * with no referral parameter, so no commission can be attributed to any of
 * them, and the disclosure would have claimed one. Production sets none of
 * these, so the claim stayed true there; it was wrong wherever a partner was
 * configured without a code.
 *
 * A link only earns when it carries something identifying the referrer, so that
 * is what is checked. Unrecognised schemes fall to the safe side: if a real
 * programme ever uses a parameter not in this list, the disclosure understates
 * rather than invents, and the comment below says to set the text explicitly.
 */
const REFERRAL_PARAM = /[?&](ref|refcode|aff|affiliate|affid|partner|tag|via|irclickid|utm_medium=affiliate)=/i;

export const hasPaidLinks =
  Boolean(envValue("NEXT_PUBLIC_DIGITALOCEAN_REF")) ||
  [1, 2, 3, 4, 5].some((index) => REFERRAL_PARAM.test(envValue(`AFFILIATE_${index}_URL`) || ""));
/**
 * The same gate as GUIDE_EXISTS in src/lib/product.ts, for the same reason.
 *
 * TESTIMONIAL_1..3 are read from the environment and rendered verbatim under a
 * "Social proof" heading with a name and a role attached. The values sitting in
 * .env.local are invented -- "Sara K", "Youssef A", "Nora B" -- and one of them
 * credits a roadmap that was deleted for never having existed. They do not
 * reach production today only because Vercel happens not to set those
 * variables: one dashboard click away from publishing fabricated endorsements
 * on a site whose entire pitch is verified sourcing and honest checking.
 *
 * That is luck, not design, so the gate is in code where flipping it is a
 * deliberate act next to this comment. Set it true on the day there are real
 * quotes from real people who agreed to be named.
 */
const TESTIMONIALS_ARE_REAL = false;

const testimonials = TESTIMONIALS_ARE_REAL
  ? [1, 2, 3].map((index) => readTestimonial(index)).filter((item): item is Testimonial => Boolean(item))
  : [];

/**
 * Accepts a social URL only when it actually points at a profile: https, and a
 * path beyond "/". A bare host is a placeholder, not an identity.
 */
function profileUrl(value: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    if (url.pathname.replace(/\/+$/, "") === "") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export const siteConfig = {
  brandName: "AI and Cybersecurity News",
  contactEmail,
  legalName,
  // A bare profile host is not a profile. Publishing "https://www.linkedin.com"
  // as sameAs told search engines the publisher was linkedin.com itself, and
  // sent every visitor who clicked "LinkedIn" to LinkedIn's front door.
  // Empty when unset, so the links hide instead of shipping broken.
  linkedinUrl: profileUrl(envValue("NEXT_PUBLIC_LINKEDIN_URL")),
  // The named human behind the publication. Google's E-E-A-T weighs a real,
  // verifiable author, and security writing without a byline reads as a
  // content farm. Falls back to the brand so nothing renders empty.
  authorName: envValue("NEXT_PUBLIC_AUTHOR_NAME"),
  authorRole: envLocaleValue("AUTHOR_ROLE_EN", "AUTHOR_ROLE_FR", {
    en: "Founder and editor",
    fr: "Fondateur et rédacteur"
  }),
  privacyContactEmail: envValue("PRIVACY_CONTACT_EMAIL") || contactEmail,
  termsLegalEntity: envValue("TERMS_LEGAL_ENTITY") || legalName,
  founderBio: envLocaleValue("FOUNDER_BIO_EN", "FOUNDER_BIO_FR", {
    en: "Final-year AI student building production-style ML projects and helping engineering students convert projects into internships and early income.",
    fr: "Étudiant en dernière année d'IA, je construis des projets ML concrets et j'aide les étudiants à transformer leurs projets en stages et premiers revenus."
  }),
  linkedinShortBio: envLocaleValue("LINKEDIN_SHORT_BIO_EN", "LINKEDIN_SHORT_BIO_FR", {
    en: "Final-year AI student sharing project-first AI engineering systems for internships and early-career outcomes.",
    fr: "Étudiant en dernière année d'IA, je partage des systèmes d'exécution IA orientés projets pour stages et début de carrière."
  }),
  authoritySignals: {
    en: [
      "Project-first AI systems for students",
      "Portfolio execution over passive tutorials",
      "Built for internship and career outcomes",
      "EN/FR practical learning paths"
    ],
    fr: [
      "Systèmes IA orientés projet",
      "Exécution portfolio plutôt que théorie passive",
      "Conçu pour stages et résultats carrière",
      "Parcours pratiques EN/FR"
    ]
  },
  /**
   * Operator-supplied replacements for the three "What you will find here"
   * lines, per locale.
   *
   * REAL_STATS_LINE_1..3 was one value used for both languages, so setting it
   * printed English on /fr -- which is what .env.local does today, with
   * "Weekly AI and CS updates with practical next steps" among the three. It
   * reaches no reader because Vercel sets none of them, which is luck again.
   * An override now applies to a locale only when that locale has a value, so a
   * single-language override leaves the other language on its own copy instead
   * of silently replacing it with the wrong one. The unsuffixed name still
   * works, as English.
   */
  socialProofStats: {
    en: [1, 2, 3]
      .map((i) => envValue(`REAL_STATS_LINE_${i}_EN`) || envValue(`REAL_STATS_LINE_${i}`))
      .filter(Boolean) as string[],
    fr: [1, 2, 3].map((i) => envValue(`REAL_STATS_LINE_${i}_FR`)).filter(Boolean) as string[]
  } as Record<Locale, string[]>,
  // Every call site used to hard-code its own wording for this offer, which is
  // how "Free AI Career Roadmap" outlived the roadmap itself in twenty places.
  // The label lives here now, so what we promise can only be said in one voice
  // and changing what we actually give people is a single edit.
  leadMagnet: {
    enLabel: "See open internships",
    frLabel: "Voir les stages ouverts",
    enUrl: envValue("NEXT_PUBLIC_LEAD_MAGNET_URL_EN") || "/en/stages",
    frUrl: envValue("NEXT_PUBLIC_LEAD_MAGNET_URL_FR") || "/fr/stages"
  },
  // Only what the donate page reads. primaryUrl, stripeUrl, koFiUrl and
  // githubSponsorsUrl were all defined here and consumed nowhere — config that
  // invites someone to go and create a Ko-fi account for a field no page would
  // render. The Buy Me a Coffee and Ko-fi handles this pointed at never
  // existed: buymeacoffee.com/aistudenthub returns 404.
  donation: {
    paypalUrl: envValue("NEXT_PUBLIC_DONATION_PAYPAL_URL"),
    cardUrl: envValue("NEXT_PUBLIC_DONATION_CARD_URL") || envValue("NEXT_PUBLIC_PRODUCT_CHECKOUT_URL"),
    cardLabel: envValue("NEXT_PUBLIC_DONATION_CARD_LABEL") || "Card checkout"
  },
  // This said "we may earn a commission" while every outbound link was a plain
  // homepage URL carrying only UTM analytics tags and no referral ID of ours.
  // No commission could ever have been attributed, so the site was promising
  // readers something it could not deliver. Restore the commission wording only
  // once real affiliate IDs are actually in the links.
  // The default denies any affiliate relationship, which is only safe to print
  // while there is none. With one configured, the fallback discloses instead,
  // and an explicit AFFILIATE_DISCLOSURE_TEXT_* still overrides both.
  affiliateDisclosureText: envLocaleValue(
    "AFFILIATE_DISCLOSURE_TEXT_EN",
    "AFFILIATE_DISCLOSURE_TEXT_FR",
    hasPaidLinks
      ? {
          en: "Some pages link to tools we use or recommend, and some of those links are referral links that may earn us a commission at no extra cost to you. It never changes which tools we recommend.",
          fr: "Certaines pages renvoient vers des outils que nous utilisons ou recommandons, et certains de ces liens sont des liens de parrainage pouvant nous rapporter une commission, sans surcoût pour vous. Cela ne change jamais les outils que nous recommandons."
        }
      : {
          en: "Some pages link to tools we use or recommend. These are ordinary links: we are not in any affiliate programme and earn nothing when you follow them.",
          fr: "Certaines pages renvoient vers des outils que nous utilisons ou recommandons. Ce sont de simples liens : nous ne participons à aucun programme d'affiliation et ne recevons aucune commission."
        }
  ),
  affiliatePartners,
  testimonials
};
