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

const contactEmail = envValue("NEXT_PUBLIC_CONTACT_EMAIL") || "hello@aistudenthub.ai";
const legalName = envValue("NEXT_PUBLIC_LEGAL_NAME") || "AI Student Hub";
const affiliatePartners = [1, 2, 3, 4, 5]
  .map((index) => readAffiliatePartner(index))
  .filter((partner): partner is AffiliatePartner => Boolean(partner));
const testimonials = [1, 2, 3]
  .map((index) => readTestimonial(index))
  .filter((item): item is Testimonial => Boolean(item));

export const siteConfig = {
  brandName: "AI Student Hub",
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
    koFiUrl: envValue("NEXT_PUBLIC_DONATION_KOFI_URL"),
    githubSponsorsUrl: envValue("NEXT_PUBLIC_DONATION_GITHUB_SPONSORS_URL")
  },
  affiliateDisclosureText: envLocaleValue("AFFILIATE_DISCLOSURE_TEXT_EN", "AFFILIATE_DISCLOSURE_TEXT_FR", {
    en: "Some links on AI Student Hub are affiliate links. If you purchase through these links, we may earn a commission at no extra cost to you.",
    fr: "Certains liens sur AI Student Hub sont des liens d'affiliation. Si vous achetez via ces liens, nous pouvons recevoir une commission sans cout supplementaire."
  }),
  affiliatePartners,
  testimonials: (testimonials.length
    ? testimonials
    : [
        {
          quote: {
            en: "AI Student Hub helped me turn random tutorials into one deployed project and stronger internship interviews.",
            fr: "AI Student Hub m'a aide a transformer des tutoriels disperses en projet deploye et entretiens plus solides."
          },
          name: "AI Student",
          role: { en: "Computer Science Student", fr: "Etudiant en informatique" }
        },
        {
          quote: {
            en: "The weekly execution system made my portfolio clearer and easier to explain to recruiters.",
            fr: "Le systeme hebdomadaire a rendu mon portfolio plus clair et plus facile a expliquer aux recruteurs."
          },
          name: "Engineering Student",
          role: { en: "AI Track Learner", fr: "Apprenant filiere IA" }
        },
        {
          quote: {
            en: "The resources and comparisons saved me budget and helped me ship faster.",
            fr: "Les ressources et comparatifs m'ont fait economiser du budget et m'ont aide a livrer plus vite."
          },
          name: "ML Student",
          role: { en: "Student Builder", fr: "Etudiant builder" }
        }
      ]) as Testimonial[]
};
