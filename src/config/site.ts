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

function envLocaleValue(enKey: string, frKey: string, fallback: Record<Locale, string>) {
  return {
    en: envValue(enKey) || fallback.en,
    fr: envValue(frKey) || fallback.fr
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
const testimonials = [1, 2, 3]
  .map((index) => readTestimonial(index))
  .filter((item): item is Testimonial => Boolean(item));

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
    fr: "Fondateur et redacteur"
  }),
  privacyContactEmail: envValue("PRIVACY_CONTACT_EMAIL") || contactEmail,
  termsLegalEntity: envValue("TERMS_LEGAL_ENTITY") || legalName,
  founderBio: envLocaleValue("FOUNDER_BIO_EN", "FOUNDER_BIO_FR", {
    en: "Final-year AI student building production-style ML projects and helping engineering students convert projects into internships and early income.",
    fr: "Étudiant en derniere annee d'IA, je construis des projets ML concrets et j'aide les étudiants a transformer leurs projets en stages et premiers revenus."
  }),
  linkedinShortBio: envLocaleValue("LINKEDIN_SHORT_BIO_EN", "LINKEDIN_SHORT_BIO_FR", {
    en: "Final-year AI student sharing project-first AI engineering systems for internships and early-career outcomes.",
    fr: "Étudiant en derniere annee d'IA, je partage des systèmes d'execution IA orientes projets pour stages et debut de carrière."
  }),
  authoritySignals: {
    en: [
      "Project-first AI systems for students",
      "Portfolio execution over passive tutorials",
      "Built for internship and career outcomes",
      "EN/FR practical learning paths"
    ],
    fr: [
      "Systèmes IA orientes projet",
      "Execution portfolio plutot que theorie passive",
      "Concu pour stages et resultats carrière",
      "Parcours pratiques EN/FR"
    ]
  },
  socialProofStats: [
    envValue("REAL_STATS_LINE_1"),
    envValue("REAL_STATS_LINE_2"),
    envValue("REAL_STATS_LINE_3")
  ].filter(Boolean) as string[],
  leadMagnet: {
    enLabel: "Get Free AI Career Roadmap",
    frLabel: "Obtenir la roadmap IA gratuite",
    enUrl: envValue("NEXT_PUBLIC_LEAD_MAGNET_URL_EN") || "/en#newsletter",
    frUrl: envValue("NEXT_PUBLIC_LEAD_MAGNET_URL_FR") || "/fr#newsletter"
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
  affiliateDisclosureText: envLocaleValue("AFFILIATE_DISCLOSURE_TEXT_EN", "AFFILIATE_DISCLOSURE_TEXT_FR", {
    en: "Some pages link to tools we use or recommend. These are ordinary links: we are not in any affiliate programme and earn nothing when you follow them.",
    fr: "Certaines pages renvoient vers des outils que nous utilisons ou recommandons. Ce sont de simples liens : nous ne participons a aucun programme d'affiliation et ne recevons aucune commission."
  }),
  affiliatePartners,
  testimonials
};
