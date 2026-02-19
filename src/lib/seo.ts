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
    "ai student blog",
    "ai engineering for students",
    "computer science student resources",
    "machine learning projects",
    "ai internship roadmap"
  ],
  fr: [
    "blog ia etudiant",
    "ingenierie ia pour etudiants",
    "ressources informatique etudiant",
    "projets machine learning",
    "roadmap stage ia"
  ]
};

const SECTION_KEYWORDS: Record<SeoSection, Record<Locale, string[]>> = {
  home: {
    en: [
      "ai and cs news for students",
      "student ai roadmap",
      "portfolio projects for ai students",
      "ai student hub"
    ],
    fr: [
      "actualites ia et informatique",
      "roadmap ia etudiant",
      "projets portfolio ia",
      "ai student hub"
    ]
  },
  blog: {
    en: [
      "ai tutorials for students",
      "ml engineering tutorials",
      "ai portfolio guide",
      "student ml blog"
    ],
    fr: [
      "tutoriels ia pour etudiants",
      "tutoriels ml engineering",
      "guide portfolio ia",
      "blog ml etudiant"
    ]
  },
  blogPost: {
    en: ["ai article with sources", "engineering career guide", "student project execution"],
    fr: ["article ia avec sources", "guide carriere ingenierie", "execution projet etudiant"]
  },
  news: {
    en: ["ai news for students", "computer science news", "weekly ai brief", "ai updates with sources"],
    fr: [
      "actualites ia pour etudiants",
      "actualites informatique",
      "brief ia hebdomadaire",
      "mise a jour ia avec sources"
    ]
  },
  newsPost: {
    en: ["ai news analysis", "student impact of ai updates", "computer science trend brief"],
    fr: ["analyse actualite ia", "impact etudiant des updates ia", "brief tendance informatique"]
  },
  resources: {
    en: ["best ai tools for students", "student budget ai tools", "ai resource stack", "ml tools comparison"],
    fr: ["meilleurs outils ia etudiant", "outils ia budget etudiant", "stack ressources ia", "comparatif outils ml"]
  },
  compare: {
    en: ["best ai tool comparison", "ai tools vs", "student cloud comparison", "ml platform comparison"],
    fr: ["comparatif outils ia", "outils ia vs", "comparatif cloud etudiant", "comparatif plateforme ml"]
  },
  product: {
    en: ["ai career guide", "student ai ebook", "internship preparation guide", "ai student digital product"],
    fr: ["guide carriere ia", "ebook ia etudiant", "guide preparation stage", "produit digital ia etudiant"]
  },
  about: {
    en: ["about ai student hub", "ai student founder", "ai education platform"],
    fr: ["a propos ai student hub", "fondateur ia etudiant", "plateforme education ia"]
  },
  growth: {
    en: ["blog growth sprint", "student creator growth plan", "seo content sprint ai"],
    fr: ["sprint croissance blog", "plan croissance createur etudiant", "sprint contenu seo ia"]
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
