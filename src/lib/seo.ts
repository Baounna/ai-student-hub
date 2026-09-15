import type { Locale } from "@/i18n/config";

type SeoSection =
  | "home"
  | "blog"
  | "blogPost"
  | "news"
  | "newsPost"
  | "resources"
  | "compare"
  | "product"
  | "about"
  | "growth";

const BASE_KEYWORDS: Record<Locale, string[]> = {
  en: [
    "ai news",
    "ai tools",
    "ai updates",
    "computer science news",
    "machine learning releases",
    "developer tools",
    "ai and computer science guides",
    "ai student hub",
    "budget friendly ai tools for students"
  ],
  fr: [
    "actualites ia",
    "outils ia",
    "mises a jour ia",
    "actualites informatique",
    "sorties machine learning",
    "outils developpeur",
    "guides ia et informatique",
    "ai student hub",
    "outils ia budget-friendly pour etudiants"
  ]
};

const SECTION_KEYWORDS: Record<SeoSection, Record<Locale, string[]>> = {
  home: {
    en: [
      "ai + computer science news and execution guides",
      "ai learning and building hub",
      "for everyone ai updates",
      "student ai roadmap"
    ],
    fr: [
      "actualites ia + informatique et guides execution",
      "hub apprentissage et production ia",
      "mises a jour ia pour tous",
      "roadmap ia etudiant"
    ]
  },
  blog: {
    en: [
      "ai tutorials",
      "computer science tutorials",
      "ml engineering tutorials",
      "backend systems guides",
      "career execution guides"
    ],
    fr: [
      "tutoriels ia",
      "tutoriels informatique",
      "tutoriels ml engineering",
      "guides backend systemes",
      "guides execution carriere"
    ]
  },
  blogPost: {
    en: ["ai and cs article with sources", "practical engineering guide", "execution roadmap"],
    fr: ["article ia et informatique avec sources", "guide ingenierie pratique", "roadmap execution"]
  },
  news: {
    en: ["ai releases", "ai product updates", "computer science updates", "weekly ai and cs brief"],
    fr: ["sorties ia", "mises a jour produits ia", "mises a jour informatique", "brief hebdomadaire ia et informatique"]
  },
  newsPost: {
    en: ["ai and cs news analysis", "practical impact of ai updates", "computer science trend brief"],
    fr: ["analyse actualite ia et informatique", "impact pratique des updates ia", "brief tendance informatique"]
  },
  resources: {
    en: [
      "best ai and cs tools",
      "developer productivity tools",
      "research tools",
      "student budget ai tools"
    ],
    fr: ["meilleurs outils ia et informatique", "outils productivite developpeur", "outils recherche", "outils ia budget etudiant"]
  },
  compare: {
    en: [
      "ai tools comparison",
      "developer tools comparison",
      "cloud and backend tools comparison",
      "ai tools vs"
    ],
    fr: ["comparatif outils ia", "comparatif outils developpeur", "comparatif outils cloud et backend", "outils ia vs"]
  },
  product: {
    en: ["ai career guide", "execution roadmap", "internship preparation guide", "digital guide ai cs"],
    fr: ["guide carriere ia", "roadmap execution", "guide preparation stage", "guide digital ia informatique"]
  },
  about: {
    en: ["about ai student hub", "ai and cs publication", "founder ai cs"],
    fr: ["a propos ai student hub", "publication ia et informatique", "fondateur ia informatique"]
  },
  growth: {
    en: ["blog growth sprint", "content execution plan", "seo content sprint ai"],
    fr: ["sprint croissance blog", "plan execution contenu", "sprint contenu seo ia"]
  }
};

export function getSeoKeywords(locale: Locale, section: SeoSection, extra: string[] = []) {
  return uniqueKeywords([...BASE_KEYWORDS[locale], ...SECTION_KEYWORDS[section][locale], ...extra]);
}

function uniqueKeywords(values: string[]) {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(normalized);
  }

  return cleaned.slice(0, 24);
}

/**
 * URL of the generated PNG social preview for a page.
 *
 * og:image previously pointed at one of three static SVGs. No major platform
 * renders SVG in a link preview, so every shared link appeared blank — and the
 * three files meant every article would have looked identical anyway. This
 * returns a per-page PNG carrying the page's own headline.
 */
export function ogImageUrl(title: string, kicker = "") {
  const params = new URLSearchParams({ title });
  if (kicker) params.set("kicker", kicker);
  return `/api/og?${params.toString()}`;
}
