import type { Locale } from "@/i18n/config";

/**
 * Tag chips in the reader's language.
 *
 * Same shape as categoryName and topicLabel, for the same reason and with the
 * same constraint: the tag string is also the URL slug (/fr/blog/tag/security),
 * so it stays English in the data and only the chip is translated. That keeps
 * the French and English pages for one tag a genuine translation pair.
 *
 * Until now every chip was the raw slug, so /fr/blog, /fr/news, every French
 * article and every /fr/blog/tag/* page read "# research # reproducibility #
 * vulnerabilities" under French headings.
 *
 * All eighty are listed, including the ones French writes the same way, so the
 * map is the full set rather than the exceptions -- a tag added later shows up
 * as missing in the test instead of silently rendering in English.
 */
const FRENCH_TAGS: Record<string, string> = {
  agents: "agents",
  ai: "IA",
  "ai-basics": "bases de l'IA",
  "ai-safety": "sûreté de l'IA",
  algorithms: "algorithmes",
  api: "API",
  "api-design": "conception d'API",
  "api-security": "sécurité des API",
  architecture: "architecture",
  auth: "authentification",
  "authority-building": "crédibilité",
  automation: "automatisation",
  backend: "backend",
  benchmarks: "benchmarks",
  career: "carrière",
  ci: "CI",
  "ci-cd": "CI/CD",
  coding: "code",
  complexity: "complexité",
  "cost-control": "maîtrise des coûts",
  data: "données",
  "data-structures": "structures de données",
  database: "base de données",
  debugging: "débogage",
  "deep-learning": "deep learning",
  dependencies: "dépendances",
  deployment: "déploiement",
  devops: "devops",
  "distributed-systems": "systèmes distribués",
  edge: "edge",
  evaluation: "évaluation",
  fastapi: "fastapi",
  "github-actions": "github actions",
  guardrails: "garde-fous",
  http: "http",
  internship: "stage",
  internships: "stages",
  kubernetes: "kubernetes",
  latency: "latence",
  learning: "apprentissage",
  linux: "linux",
  llm: "llm",
  logs: "journaux",
  "machine-learning": "machine learning",
  math: "maths",
  metrics: "métriques",
  ml: "ml",
  "ml-engineering": "ingénierie ML",
  mlops: "mlops",
  monitoring: "supervision",
  multimodal: "multimodal",
  networking: "réseaux",
  observability: "observabilité",
  "open-source": "open source",
  "operating-systems": "systèmes d'exploitation",
  performance: "performance",
  portfolio: "portfolio",
  postgres: "postgres",
  "project-architecture": "architecture projet",
  "project-based-learning": "apprentissage par projet",
  quality: "qualité",
  rag: "rag",
  reasoning: "raisonnement",
  "release-engineering": "mise en production",
  reliability: "fiabilité",
  reproducibility: "reproductibilité",
  research: "recherche",
  retrieval: "recherche d'information",
  "schema-design": "conception de schéma",
  security: "sécurité",
  "system-design": "conception système",
  systems: "systèmes",
  "systems-design": "conception système",
  testing: "tests",
  tooling: "outillage",
  tracing: "traçage",
  transformers: "transformers",
  vision: "vision",
  vulnerabilities: "vulnérabilités",
  workflow: "flux de travail",

  // The study-tool cards on /compare carry their own short descriptors, shown
  // as the same kind of chip and in the same French-headed card, so they go
  // through the same function. Forty-seven of them, from a separate array.
  "ai cs": "IA et informatique",
  "ai tutor": "tuteur IA",
  bibliography: "bibliographie",
  certification: "certification",
  citation: "citation",
  citations: "citations",
  code: "code",
  courses: "cours",
  cybersecurity: "cybersécurité",
  documentation: "documentation",
  emails: "emails",
  equations: "équations",
  exam: "examen",
  "exam prep": "préparation d'examen",
  explanations: "explications",
  flashcards: "cartes mémoire",
  fundamentals: "fondamentaux",
  grammar: "grammaire",
  images: "images",
  "knowledge graph": "graphe de connaissances",
  "learning path": "parcours d'apprentissage",
  "linear algebra": "algèbre linéaire",
  "long context": "contexte long",
  markdown: "markdown",
  memory: "mémorisation",
  notes: "notes",
  offline: "hors ligne",
  papers: "articles scientifiques",
  pdf: "pdf",
  planning: "planification",
  practice: "entraînement",
  "problem solving": "résolution de problèmes",
  questions: "questions",
  quiz: "quiz",
  reports: "rapports",
  revision: "révision",
  sources: "sources",
  summaries: "résumés",
  summary: "résumé",
  tasks: "tâches",
  "web search": "recherche web",
  workspace: "espace de travail",
  writing: "rédaction"
};

export function tagLabel(tag: string, locale: Locale): string {
  if (locale !== "fr") return tag;
  return FRENCH_TAGS[tag] ?? tag;
}

/** Exposed so a test can assert the map covers every tag in the content. */
export function knownFrenchTags(): string[] {
  return Object.keys(FRENCH_TAGS);
}
