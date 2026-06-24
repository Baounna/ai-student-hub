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

export const siteConfig = {
  brandName: "AI and Cybersecurity News",
  contactEmail,
  legalName,
  linkedinUrl: envValue("NEXT_PUBLIC_LINKEDIN_URL") || "https://www.linkedin.com",
  privacyContactEmail: envValue("PRIVACY_CONTACT_EMAIL") || contactEmail,
  termsLegalEntity: envValue("TERMS_LEGAL_ENTITY") || legalName,
  founderBio: envLocaleValue("FOUNDER_BIO_EN", "FOUNDER_BIO_FR", {
    en: "Final-year AI student building production-style ML projects and helping engineering students convert projects into internships and early income.",
    fr: "Etudiant en derniere annee d'IA, je construis des projets ML concrets et j'aide les etudiants a transformer leurs projets en stages et premiers revenus."
  }),
  linkedinShortBio: envLocaleValue("LINKEDIN_SHORT_BIO_EN", "LINKEDIN_SHORT_BIO_FR", {
    en: "Final-year AI student sharing project-first AI engineering systems for internships and early-career outcomes.",
    fr: "Etudiant en derniere annee d'IA, je partage des systemes d'execution IA orientes projets pour stages et debut de carriere."
  }),
  authoritySignals: {
    en: [
      "Project-first AI systems for students",
      "Portfolio execution over passive tutorials",
      "Built for internship and career outcomes",
      "EN/FR practical learning paths"
    ],
    fr: [
      "Systemes IA orientes projet",
      "Execution portfolio plutot que theorie passive",
      "Concu pour stages et resultats carriere",
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
  donation: {
    primaryUrl: envValue("NEXT_PUBLIC_DONATION_PRIMARY_URL"),
    stripeUrl: envValue("NEXT_PUBLIC_DONATION_STRIPE_URL"),
    paypalUrl: envValue("NEXT_PUBLIC_DONATION_PAYPAL_URL"),
    cardUrl: envValue("NEXT_PUBLIC_DONATION_CARD_URL") || envValue("NEXT_PUBLIC_PRODUCT_CHECKOUT_URL"),
    cardLabel: envValue("NEXT_PUBLIC_DONATION_CARD_LABEL") || "Card checkout",
    koFiUrl: envValue("NEXT_PUBLIC_DONATION_KOFI_URL"),
    githubSponsorsUrl: envValue("NEXT_PUBLIC_DONATION_GITHUB_SPONSORS_URL")
  },
  affiliateDisclosureText: envLocaleValue("AFFILIATE_DISCLOSURE_TEXT_EN", "AFFILIATE_DISCLOSURE_TEXT_FR", {
    en: "Some links on AI and Cybersecurity News are affiliate links. If you purchase through these links, we may earn a commission at no extra cost to you.",
    fr: "Certains liens sur AI and Cybersecurity News sont des liens d'affiliation. Si vous achetez via ces liens, nous pouvons recevoir une commission sans cout supplementaire."
  }),
  affiliatePartners,
  testimonials
};
