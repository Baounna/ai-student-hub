import type { Locale } from "@/i18n/config";
import { isSafeHttpUrl, normalizeHttpUrl } from "@/lib/url";

export type AffiliateLink = {
  label: Record<Locale, string>;
  href: string;
  note: string;
};

export type SourceReference = {
  source: string;
  label: Record<Locale, string>;
  href: string;
};

export type BlogPost = {
  slug: string;
  coverImage: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  cluster: string;
  publishedAt: string;
  readTime: string;
  keywords: string[];
  popularScore: number;
  relatedSlugs: string[];
  affiliateCallout: {
    headline: Record<Locale, string>;
    description: Record<Locale, string>;
    links: AffiliateLink[];
  };
  references: SourceReference[];
  locales: Record<Locale, { title: string; excerpt: string; content: string[] }>;
  content: string[];
};

export type RecommendedTool = {
  name: string;
  icon: string;
  category: Record<Locale, string>;
  summary: Record<Locale, string>;
  benefit: Record<Locale, string>;
  affiliateHref: string;
};

export type ComparisonPage = {
  slug: string;
  title: string;
  intentKeyword: string;
  intro: string;
  tools: Array<{
    name: string;
    price: string;
    bestFor: string;
    summary: string;
    affiliateHref: string;
  }>;
};

const digitalOceanRef = process.env.NEXT_PUBLIC_DIGITALOCEAN_REF?.trim();
const digitalOceanBase = digitalOceanRef
  ? `https://www.digitalocean.com/?refcode=${encodeURIComponent(digitalOceanRef)}`
  : "https://www.digitalocean.com/";
const withUtm = (base: string, utm: string) => `${base}${base.includes("?") ? "&" : "?"}${utm}`;

function readAffiliate(index: number) {
  const name = (process.env[`AFFILIATE_${index}_NAME`] || "").trim();
  const url = (process.env[`AFFILIATE_${index}_URL`] || "").trim();
  const placement = (process.env[`AFFILIATE_${index}_PLACEMENT`] || "resources").trim().toLowerCase();
  if (!name || !isSafeHttpUrl(url)) return null;
  return { name, url: normalizeHttpUrl(url), placement };
}

function placementCategory(placement: string): Record<Locale, string> {
  if (placement.includes("home")) return { en: "Home", fr: "Accueil" };
  if (placement.includes("blog")) return { en: "Blog", fr: "Blog" };
  if (placement.includes("comparison")) return { en: "Comparison", fr: "Comparatif" };
  return { en: "Resources", fr: "Ressources" };
}

const fallbackRecommendedTools: RecommendedTool[] = [
  {
    name: "Cloud Deploy Stack",
    icon: "/images/tool-cloud.svg",
    category: { en: "Hosting", fr: "Hébergement" },
    summary: {
      en: "Deploy your AI app quickly with free credits and low-friction scaling.",
      fr: "Déploie rapidement ton app IA avec des crédits gratuits et une mise à l'échelle simple."
    },
    benefit: {
      en: "Best for shipping demos and student portfolios fast.",
      fr: "Idéal pour livrer rapidement des démos et portfolios étudiants."
    },
    affiliateHref: withUtm(digitalOceanBase, "utm_source=ai_student_hub&utm_medium=resources&utm_campaign=hosting")
  },
  {
    name: "AI Learning Platform",
    icon: "/images/tool-course.svg",
    category: { en: "Courses", fr: "Formations" },
    summary: {
      en: "Structured pathways for LLM apps, MLOps, and interview preparation.",
      fr: "Parcours structurés pour apps LLM, MLOps et préparation aux entretiens."
    },
    benefit: {
      en: "Best for focused upskilling without wasting months.",
      fr: "Idéal pour monter en compétence sans perdre des mois."
    },
    affiliateHref:
      "https://www.coursera.org/?utm_source=ai_student_hub&utm_medium=resources&utm_campaign=courses"
  },
  {
    name: "Student Productivity Workspace",
    icon: "/images/tool-productivity.svg",
    category: { en: "Productivity", fr: "Productivité" },
    summary: {
      en: "Run project sprints, job applications, and study systems in one place.",
      fr: "Gère sprints projets, candidatures et système d'apprentissage en un seul endroit."
    },
    benefit: {
      en: "Best for consistent weekly execution.",
      fr: "Idéal pour une exécution hebdomadaire régulière."
    },
    affiliateHref:
      "https://www.grammarly.com/affiliates?utm_source=ai_student_hub&utm_medium=resources&utm_campaign=productivity"
  }
];

const envAffiliates = [1, 2, 3, 4, 5].map((index) => readAffiliate(index)).filter((item) => Boolean(item)) as Array<{
  name: string;
  url: string;
  placement: string;
}>;
const envIcons = [
  "/images/tool-cloud.svg",
  "/images/tool-course.svg",
  "/images/tool-productivity.svg",
  "/images/tool-cloud.svg",
  "/images/tool-course.svg"
];

const envRecommendedTools: RecommendedTool[] = envAffiliates.map((item, index) => ({
  name: item.name,
  icon: envIcons[index % envIcons.length],
  category: placementCategory(item.placement),
  summary: {
    en: `Curated partner resource for ${item.placement} conversions and student execution.`,
    fr: `Ressource partenaire choisie pour l'execution et la conversion etudiante (${item.placement}).`
  },
  benefit: {
    en: "Selected for practical ROI and faster project shipping.",
    fr: "Selectionnee pour un ROI pratique et un deploiement plus rapide."
  },
  affiliateHref: item.url
}));

export const recommendedTools: RecommendedTool[] =
  envRecommendedTools.length >= 3 ? envRecommendedTools : fallbackRecommendedTools;

export const comparisons: ComparisonPage[] = [
  {
    slug: "best-cloud-platform-for-student-ai-projects",
    title: "Best Cloud Platform for Student AI Projects (2026 Comparison)",
    intentKeyword: "best cloud platform for student ai projects",
    intro:
      "This comparison helps AI students choose a practical cloud stack based on budget, deployment speed, and portfolio quality signal.",
    tools: [
      {
        name: "DigitalOcean",
        price: "Free tier + usage-based",
        bestFor: "Beginner to intermediate students",
        summary: "Fast setup, simple UI, and strong documentation for first shipped projects.",
        affiliateHref: withUtm(digitalOceanBase, "utm_source=ai_student_hub&utm_medium=comparison&utm_campaign=platform_a")
      },
      {
        name: "Render",
        price: "Credit-based starter plan",
        bestFor: "Students needing backend flexibility",
        summary: "More control for API-heavy projects and scaling custom workflows.",
        affiliateHref:
          "https://render.com/?utm_source=ai_student_hub&utm_medium=comparison&utm_campaign=platform_b"
      },
      {
        name: "Railway",
        price: "Low-cost app hosting",
        bestFor: "Portfolio demos and prototypes",
        summary: "Clean developer experience and predictable costs for student use.",
        affiliateHref:
          "https://railway.com/?utm_source=ai_student_hub&utm_medium=comparison&utm_campaign=platform_c"
      }
    ]
  }
];

export const posts: BlogPost[] = [
  {
    slug: "ai-portfolio-project-recruiters-notice",
    coverImage: "/images/post-portfolio.svg",
    title: "How to Build an AI Portfolio Project Recruiters Actually Notice",
    excerpt: "A practical framework to scope, ship, and present one AI project that creates measurable internship signal.",
    category: "AI Project Tutorials",
    tags: ["portfolio", "internships", "project-based-learning"],
    cluster: "AI Portfolio Projects",
    publishedAt: "2026-02-18",
    readTime: "12 min read",
    keywords: ["ai portfolio project for students", "machine learning portfolio", "ai internship project"],
    popularScore: 98,
    relatedSlugs: ["deploy-ml-model-student-budget", "student-ai-internship-roadmap"],
    affiliateCallout: {
      headline: {
        en: "Build this faster with a student-friendly cloud stack",
        fr: "Construis plus vite avec une stack cloud adaptée aux étudiants"
      },
      description: {
        en: "If you want to ship your project in days instead of weeks, use a managed deployment platform with free credits.",
        fr: "Pour livrer en quelques jours au lieu de semaines, utilise une plateforme de déploiement managée avec crédits gratuits."
      },
      links: [
        { label: { en: "Compare cloud options", fr: "Comparer les options cloud" }, href: "/resources", note: "Affiliate comparison" },
        { label: { en: "See full resources", fr: "Voir toutes les ressources" }, href: "/resources", note: "Tools I use" }
      ]
    },
    references: [
      {
        source: "NIST",
        label: { en: "AI Risk Management Framework", fr: "Cadre de gestion du risque IA" },
        href: "https://www.nist.gov/itl/ai-risk-management-framework"
      },
      {
        source: "Google Developers",
        label: { en: "Machine Learning Crash Course", fr: "Cours rapide de machine learning" },
        href: "https://developers.google.com/machine-learning/crash-course"
      },
      {
        source: "12-Factor",
        label: { en: "The Twelve-Factor App", fr: "The Twelve-Factor App" },
        href: "https://12factor.net/"
      }
    ],
    locales: {
      en: {
        title: "How to Build an AI Portfolio Project Recruiters Actually Notice",
        excerpt:
          "A practical framework to scope, ship, and present one AI project that creates measurable internship signal.",
        content: [
          "Most students are not blocked by intelligence. They are blocked by positioning. A notebook model can be correct and still fail to create hiring signal because it does not prove product thinking, deployment ability, or clear communication.",
          "A high-conversion portfolio project starts with a real user pain point. Pick a narrow use case like resume-job matching, lecture note question answering, or internship application triage.",
          "After choosing your problem, define a strict MVP. Your first version should solve one task end-to-end with visible output quality.",
          "Always build a baseline first so your improvements are measurable and credible.",
          "Deployment and documentation are the strongest multipliers for student projects and interview conversion."
        ]
      },
      fr: {
        title: "Construire un projet IA de portfolio que les recruteurs remarquent",
        excerpt:
          "Un cadre pratique pour cadrer, livrer et présenter un projet IA qui augmente réellement ton signal de stage.",
        content: [
          "Les étudiants ne sont pas bloqués par le manque d'intelligence, mais par le positionnement. Un notebook correct peut rester invisible s'il ne démontre ni produit, ni déploiement, ni communication claire.",
          "Un projet portfolio performant commence par une vraie douleur utilisateur. Choisis un cas précis: matching CV-offre, Q&A sur notes de cours, ou tri de candidatures.",
          "Définis ensuite un MVP strict. La première version doit résoudre une tâche de bout en bout avec une valeur visible.",
          "Construis toujours une baseline afin que tes améliorations soient mesurables et crédibles.",
          "Le déploiement et la documentation sont les plus grands multiplicateurs pour convertir ton travail en entretiens."
        ]
      }
    },
    content: []
  },
  {
    slug: "deploy-ml-model-student-budget",
    coverImage: "/images/post-deploy.svg",
    title: "How to Deploy ML Models on a Student Budget Without Looking Amateur",
    excerpt: "A practical deployment blueprint with budget guardrails, reliability checks, and portfolio-ready architecture.",
    category: "Tools and Systems",
    tags: ["deployment", "mlops", "cost-control"],
    cluster: "Tools, Deployment & Monetization",
    publishedAt: "2026-02-16",
    readTime: "10 min read",
    keywords: ["deploy ml model free", "student mlops", "cheap cloud for ai apps"],
    popularScore: 95,
    relatedSlugs: ["ai-portfolio-project-recruiters-notice", "student-ai-internship-roadmap"],
    affiliateCallout: {
      headline: {
        en: "Need low-cost deployment tools?",
        fr: "Besoin d'outils de déploiement low-cost ?"
      },
      description: {
        en: "Use the recommended hosting stack and credits-first tools to keep your monthly cost predictable.",
        fr: "Utilise la stack recommandée et des outils à crédits pour garder un coût mensuel prévisible."
      },
      links: [
        { label: { en: "View recommended tools", fr: "Voir les outils recommandés" }, href: "/resources", note: "Affiliate links" },
        {
          label: { en: "Cloud platform comparison", fr: "Comparatif plateformes cloud" },
          href: "/resources",
          note: "High-intent guide"
        }
      ]
    },
    references: [
      {
        source: "Google Cloud",
        label: { en: "MLOps: Continuous delivery and automation pipelines", fr: "MLOps: pipelines de livraison continue et automatisation" },
        href: "https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning"
      },
      {
        source: "Atlassian",
        label: { en: "What is continuous deployment?", fr: "Qu'est-ce que le deploiement continu ?" },
        href: "https://www.atlassian.com/continuous-delivery/principles/continuous-deployment"
      },
      {
        source: "Docker",
        label: { en: "What is a container?", fr: "Qu'est-ce qu'un conteneur ?" },
        href: "https://www.docker.com/resources/what-container/"
      }
    ],
    locales: {
      en: {
        title: "How to Deploy ML Models on a Student Budget Without Looking Amateur",
        excerpt:
          "A practical deployment blueprint with budget guardrails, reliability checks, and portfolio-ready architecture.",
        content: [
          "Deployment quality is where student projects become career assets.",
          "Use a split stack and set budget guardrails before launch.",
          "Add health checks, logs, and rate limits to keep reliability and costs under control.",
          "Document architecture and monthly budget to show professional thinking.",
          "A deployed app with clear tradeoffs creates stronger interview leverage."
        ]
      },
      fr: {
        title: "Déployer des modèles ML avec un budget étudiant sans paraître amateur",
        excerpt:
          "Un plan de déploiement pratique avec contrôle des coûts, fiabilité et architecture prête pour portfolio.",
        content: [
          "La qualité du déploiement transforme un projet étudiant en actif carrière.",
          "Utilise une stack simple en couches et fixe un budget avant de lancer.",
          "Ajoute health checks, logs et rate limiting pour maîtriser fiabilité et coûts.",
          "Documente architecture et budget mensuel pour démontrer une approche pro.",
          "Une app déployée avec des compromis clairs crée un meilleur levier en entretien."
        ]
      }
    },
    content: []
  },
  {
    slug: "student-ai-internship-roadmap",
    coverImage: "/images/post-roadmap.svg",
    title: "Student AI Internship Roadmap: From Zero Signal to Interview-Ready in 90 Days",
    excerpt: "A 90-day execution plan to build authority, improve applications, and create interview conversion.",
    category: "Career Growth",
    tags: ["internship", "career", "authority-building"],
    cluster: "Career & Internship Prep",
    publishedAt: "2026-02-14",
    readTime: "11 min read",
    keywords: ["ai internship roadmap", "machine learning internship prep", "student ai career plan"],
    popularScore: 93,
    relatedSlugs: ["ai-portfolio-project-recruiters-notice", "deploy-ml-model-student-budget"],
    affiliateCallout: {
      headline: {
        en: "Get the full sprint system",
        fr: "Obtiens le système sprint complet"
      },
      description: {
        en: "Use the AI Career Roadmap and productivity templates to execute this 90-day plan consistently.",
        fr: "Utilise la roadmap carrière IA et les templates de productivité pour exécuter ce plan 90 jours avec constance."
      },
      links: [
        { label: { en: "Free AI Career Roadmap", fr: "Roadmap carrière IA gratuite" }, href: "#newsletter", note: "Lead magnet" },
        { label: { en: "Student guide product", fr: "Guide étudiant" }, href: "/product/ai-career-guide", note: "$9-$19 offer" }
      ]
    },
    references: [
      {
        source: "U.S. Department of Labor",
        label: { en: "Internship programs under the FLSA", fr: "Programmes de stage selon le FLSA" },
        href: "https://www.dol.gov/agencies/whd/fact-sheets/71-flsa-internships"
      },
      {
        source: "Harvard Career Services",
        label: { en: "Create a strong resume", fr: "Creer un CV solide" },
        href: "https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/"
      },
      {
        source: "PMI",
        label: { en: "What is project management?", fr: "Qu'est-ce que la gestion de projet ?" },
        href: "https://www.pmi.org/about/learn-about-pmi/what-is-project-management"
      }
    ],
    locales: {
      en: {
        title: "Student AI Internship Roadmap: From Zero Signal to Interview-Ready in 90 Days",
        excerpt: "A 90-day execution plan to build authority, improve applications, and create interview conversion.",
        content: [
          "Most students fail internship applications because their work does not communicate clear value.",
          "Phase one is foundation: one theme, one cadence, measurable outputs.",
          "Phase two is execution: ship one meaningful project and publish the process.",
          "Phase three is conversion: optimize resume, applications, and project narrative for interviews.",
          "Consistency over 90 days creates real career momentum."
        ]
      },
      fr: {
        title: "Roadmap stage IA: de zéro signal à prêt pour l'entretien en 90 jours",
        excerpt: "Un plan d'exécution sur 90 jours pour construire autorité, améliorer candidatures et obtenir des entretiens.",
        content: [
          "La plupart des étudiants échouent car leur travail ne communique pas une valeur claire.",
          "Phase 1: fondations, un thème, une cadence, des résultats mesurables.",
          "Phase 2: exécution, livrer un projet solide et publier le processus.",
          "Phase 3: conversion, optimiser CV, candidatures et storytelling projet.",
          "La constance pendant 90 jours crée une vraie dynamique carrière."
        ]
      }
    },
    content: []
  },
  {
    slug: "ai-fundamentals-every-cs-student-should-know",
    coverImage: "/images/post-portfolio.svg",
    title: "AI Fundamentals Every Computer Science Student Should Master",
    excerpt:
      "A practical guide to core AI concepts that help students read papers faster, build better projects, and explain decisions in interviews.",
    category: "AI Foundations",
    tags: ["ai-basics", "machine-learning", "deep-learning"],
    cluster: "AI Fundamentals",
    publishedAt: "2026-02-10",
    readTime: "9 min read",
    keywords: ["ai fundamentals for cs students", "machine learning basics", "deep learning concepts"],
    popularScore: 91,
    relatedSlugs: ["student-ai-internship-roadmap", "ai-portfolio-project-recruiters-notice"],
    affiliateCallout: {
      headline: {
        en: "Want a faster learning path?",
        fr: "Tu veux accelerer ta progression ?"
      },
      description: {
        en: "Use the roadmap + curated resources to turn these fundamentals into one portfolio project this month.",
        fr: "Utilise la roadmap + ressources pour transformer ces fondamentaux en un projet portfolio ce mois-ci."
      },
      links: [
        { label: { en: "Open resources", fr: "Voir les ressources" }, href: "/resources", note: "Curated stack" },
        { label: { en: "Get free roadmap", fr: "Recevoir la roadmap" }, href: "#newsletter", note: "Lead magnet" }
      ]
    },
    references: [
      {
        source: "IBM",
        label: { en: "What is artificial intelligence?", fr: "Qu'est-ce que l'intelligence artificielle ?" },
        href: "https://www.ibm.com/think/topics/artificial-intelligence"
      },
      {
        source: "Google Developers",
        label: { en: "Machine Learning Crash Course", fr: "Cours rapide de machine learning" },
        href: "https://developers.google.com/machine-learning/crash-course"
      },
      {
        source: "MIT Press",
        label: { en: "Deep Learning (Goodfellow et al.)", fr: "Deep Learning (Goodfellow et al.)" },
        href: "https://www.deeplearningbook.org/"
      },
      {
        source: "Google Developers",
        label: { en: "Neural network glossary entry", fr: "Definition des reseaux de neurones" },
        href: "https://developers.google.com/machine-learning/glossary#neural_network"
      }
    ],
    locales: {
      en: {
        title: "AI Fundamentals Every Computer Science Student Should Master",
        excerpt:
          "A practical guide to core AI concepts that help students read papers faster, build better projects, and explain decisions in interviews.",
        content: [
          "Most AI confusion comes from skipping first principles. Students jump directly to frameworks and model APIs, then struggle when architecture choices break under real data.",
          "Start with the core map: artificial intelligence is the broad field, machine learning is a subset, and deep learning is a subset of machine learning focused on multi-layer neural networks.",
          "Supervised, unsupervised, and reinforcement learning are not only exam topics. They define how data is labeled, how feedback is collected, and how much deployment risk you carry.",
          "Bias-variance tradeoff, overfitting, and generalization are still the most practical concepts for student projects. If you cannot explain these tradeoffs, your model choices look random.",
          "Evaluation should be task-specific. Accuracy alone is weak for many AI products. In practice, you need precision/recall tradeoffs, latency targets, and user-facing error analysis.",
          "A strong student workflow is simple: understand the concept, build one minimal implementation, then document what changed when you tuned data, model, or inference pipeline.",
          "When you master these foundations, advanced topics become easier: transformers, retrieval systems, and agents are extensions of ideas you already understand."
        ]
      },
      fr: {
        title: "Fondamentaux IA que chaque etudiant en informatique doit maitriser",
        excerpt:
          "Un guide pratique des concepts IA essentiels pour lire des papers, construire de meilleurs projets et reussir les entretiens.",
        content: [
          "La confusion en IA vient souvent d'un manque de base. Beaucoup d'etudiants passent directement aux frameworks puis bloquent quand les choix techniques ne tiennent pas avec des donnees reelles.",
          "Commence par la carte simple: l'IA est le champ global, le machine learning est un sous-ensemble, et le deep learning est un sous-ensemble du machine learning base sur des reseaux multicouches.",
          "Supervised, unsupervised et reinforcement learning ne sont pas que des notions academiques. Ils definissent la qualite des donnees, le type de feedback, et le risque en production.",
          "Bias-variance, overfitting et generalisation restent les notions les plus utiles pour des projets etudiants solides.",
          "L'evaluation doit suivre le cas d'usage. L'accuracy seule est insuffisante pour beaucoup d'applications IA.",
          "Workflow efficace: comprendre le concept, coder une version minimale, puis documenter les effets des changements data/modele/inference.",
          "Avec ces bases, les sujets avances comme transformers, RAG et agents deviennent beaucoup plus faciles a appliquer."
        ]
      }
    },
    content: []
  },
  {
    slug: "computer-science-roadmap-for-ai-builders",
    coverImage: "/images/post-deploy.svg",
    title: "Computer Science Roadmap for AI Builders: What Actually Matters",
    excerpt:
      "A focused CS roadmap for AI students who want better performance, cleaner systems, and stronger interview answers.",
    category: "Computer Science Fundamentals",
    tags: ["algorithms", "data-structures", "systems-design"],
    cluster: "CS Fundamentals for AI",
    publishedAt: "2026-02-09",
    readTime: "10 min read",
    keywords: ["computer science roadmap for ai students", "cs fundamentals for ml engineers", "algorithms for ai"],
    popularScore: 89,
    relatedSlugs: ["deploy-ml-model-student-budget", "ai-fundamentals-every-cs-student-should-know"],
    affiliateCallout: {
      headline: {
        en: "Need a practical study stack?",
        fr: "Besoin d'une stack d'etude pratique ?"
      },
      description: {
        en: "Use the student productivity workspace and weekly roadmap to execute this CS plan without burnout.",
        fr: "Utilise l'espace productivite et la roadmap hebdomadaire pour executer ce plan CS sans burnout."
      },
      links: [
        { label: { en: "Open student tools", fr: "Outils etudiants" }, href: "/resources", note: "Execution stack" },
        { label: { en: "See internship roadmap", fr: "Voir la roadmap stage" }, href: "/blog/student-ai-internship-roadmap", note: "Career path" }
      ]
    },
    references: [
      {
        source: "ACM",
        label: { en: "Computing curricula recommendations", fr: "Recommandations de curriculum informatique" },
        href: "https://www.acm.org/education/curricula-recommendations"
      },
      {
        source: "MIT OpenCourseWare",
        label: { en: "Introduction to Algorithms (6.006)", fr: "Introduction aux algorithmes (6.006)" },
        href: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/"
      },
      {
        source: "Princeton",
        label: { en: "Algorithms, 4th edition site", fr: "Site Algorithms, 4e edition" },
        href: "https://algs4.cs.princeton.edu/home/"
      },
      {
        source: "University of Wisconsin",
        label: { en: "Operating Systems: Three Easy Pieces", fr: "Operating Systems: Three Easy Pieces" },
        href: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
      },
      {
        source: "PostgreSQL",
        label: { en: "PostgreSQL documentation", fr: "Documentation PostgreSQL" },
        href: "https://www.postgresql.org/docs/current/"
      }
    ],
    locales: {
      en: {
        title: "Computer Science Roadmap for AI Builders: What Actually Matters",
        excerpt:
          "A focused CS roadmap for AI students who want better performance, cleaner systems, and stronger interview answers.",
        content: [
          "AI students often ask if classic computer science still matters. The short answer is yes: CS fundamentals are the difference between a working demo and a reliable product.",
          "Algorithms and data structures improve your model pipelines immediately. Better complexity decisions reduce preprocessing time, speed up retrieval, and lower cloud bills.",
          "Operating systems knowledge helps when you deploy. You understand processes, memory limits, file systems, and why your service crashes under load.",
          "Networking fundamentals matter for API design, latency debugging, and distributed AI systems. If you can read logs and reason about request flow, you diagnose issues much faster.",
          "Databases are essential for modern AI apps. Embeddings, user context, evaluation logs, and experiment tracking all depend on good storage choices and clean schemas.",
          "Software engineering discipline compounds everything: version control, testing, code review, and documentation make your AI work maintainable and team-ready.",
          "A good weekly routine: two sessions for theory, two sessions for implementation, one session for project integration. This keeps CS learning tied to shipped outcomes."
        ]
      },
      fr: {
        title: "Roadmap informatique pour builders IA: ce qui compte vraiment",
        excerpt:
          "Un plan CS cible pour etudiants IA qui veulent de meilleures performances, des systemes propres et de meilleures reponses en entretien.",
        content: [
          "Beaucoup d'etudiants IA se demandent si les bases classiques d'informatique sont encore utiles. Oui: elles transforment une demo fragile en produit fiable.",
          "Algorithmes et structures de donnees impactent directement les pipelines ML: preprocessing plus rapide, retrieval plus efficace, cout cloud mieux maitrise.",
          "Les notions systeme (OS) sont cruciales en deploiement: processus, memoire, fichiers, diagnostics de crash.",
          "Le reseau est essentiel pour comprendre APIs, latence et flux de requetes dans des applications IA distribuees.",
          "Les bases de donnees sont partout en IA moderne: embeddings, contexte utilisateur, logs d'evaluation, suivi d'experiences.",
          "La rigueur software (Git, tests, revue de code, documentation) rend ton travail maintenable et pro.",
          "Routine efficace: deux sessions theorie, deux sessions implementation, une session integration projet chaque semaine."
        ]
      }
    },
    content: []
  },
  {
    slug: "transformers-rag-and-agents-for-students",
    coverImage: "/images/post-roadmap.svg",
    title: "Transformers, RAG, and Agents: A Student-Friendly Systems Guide",
    excerpt:
      "Understand how modern LLM systems are built, when to use each pattern, and how to choose a portfolio architecture recruiters respect.",
    category: "Applied AI Systems",
    tags: ["transformers", "rag", "agents"],
    cluster: "Modern AI Systems",
    publishedAt: "2026-02-08",
    readTime: "11 min read",
    keywords: ["transformers rag agents for students", "llm system design", "student rag architecture"],
    popularScore: 92,
    relatedSlugs: ["ai-fundamentals-every-cs-student-should-know", "deploy-ml-model-student-budget"],
    affiliateCallout: {
      headline: {
        en: "Ship this architecture as a real project",
        fr: "Livre cette architecture comme vrai projet"
      },
      description: {
        en: "Use the deployment stack and comparison guides to turn this system design into a live, interview-ready demo.",
        fr: "Utilise la stack de deploiement et les comparatifs pour transformer ce design en demo live prete entretien."
      },
      links: [
        { label: { en: "Compare cloud platforms", fr: "Comparer les plateformes cloud" }, href: "/compare", note: "High intent" },
        { label: { en: "Open deployment resources", fr: "Ressources de deploiement" }, href: "/resources", note: "Tool stack" }
      ]
    },
    references: [
      {
        source: "arXiv",
        label: { en: "Attention Is All You Need", fr: "Attention Is All You Need" },
        href: "https://arxiv.org/abs/1706.03762"
      },
      {
        source: "arXiv",
        label: { en: "Neural Machine Translation by Jointly Learning to Align and Translate", fr: "Neural Machine Translation by Jointly Learning to Align and Translate" },
        href: "https://arxiv.org/abs/1409.0473"
      },
      {
        source: "Google AI",
        label: { en: "Large language models overview", fr: "Vue d'ensemble des grands modeles de langage" },
        href: "https://ai.google/discover/large-language-models/"
      },
      {
        source: "Stanford NLP",
        label: { en: "Introduction to Information Retrieval", fr: "Introduction a la recherche d'information" },
        href: "https://nlp.stanford.edu/IR-book/information-retrieval-book.html"
      },
      {
        source: "UC Berkeley",
        label: { en: "Artificial Intelligence: A Modern Approach", fr: "Artificial Intelligence: A Modern Approach" },
        href: "https://aima.cs.berkeley.edu/"
      }
    ],
    locales: {
      en: {
        title: "Transformers, RAG, and Agents: A Student-Friendly Systems Guide",
        excerpt:
          "Understand how modern LLM systems are built, when to use each pattern, and how to choose a portfolio architecture recruiters respect.",
        content: [
          "Many students treat transformers, RAG, and agents like separate trends. In practice, they are layers of one system design stack.",
          "Transformers are the model backbone. They generate and rank tokens using attention, making them strong for language generation and reasoning tasks.",
          "RAG solves a key product problem: knowledge freshness and grounding. Instead of asking the model to memorize everything, you retrieve relevant context at runtime.",
          "Agent workflows add decision loops. The model can select tools, call APIs, and execute multi-step plans, which is useful for complex tasks but increases failure surfaces.",
          "For student projects, start simple: baseline transformer app, then add retrieval, then add agent actions only if the use case needs multi-step execution.",
          "Your architecture choice should match constraints: latency, cost, reliability, and explainability. This is exactly what interviewers test in system design discussions.",
          "The strongest portfolio signal is not complexity for its own sake. It is a clean architecture with measured tradeoffs, clear logs, and honest failure analysis."
        ]
      },
      fr: {
        title: "Transformers, RAG et agents: guide systeme pour etudiants",
        excerpt:
          "Comprendre comment les systemes LLM modernes sont construits, quand utiliser chaque pattern et comment choisir une architecture portfolio credible.",
        content: [
          "Beaucoup d'etudiants voient transformers, RAG et agents comme trois tendances separees. En realite, ce sont des couches d'un meme systeme.",
          "Les transformers forment le coeur du modele. Ils exploitent l'attention pour la generation et la comprehension du langage.",
          "Le RAG repond a un besoin produit central: garder une connaissance fraiche et verifiable via retrieval dynamique.",
          "Les agents ajoutent une boucle de decision: choix d'outils, appels API, execution multi-etapes. C'est puissant mais plus fragile.",
          "Pour un projet etudiant: commence par une base simple, ajoute retrieval, puis agents seulement si le cas d'usage exige une orchestration multi-etapes.",
          "Le bon choix depend des contraintes: latence, cout, fiabilite, explicabilite. C'est exactement ce que les recruteurs evalent.",
          "Le meilleur signal portfolio n'est pas la complexite brute, mais une architecture claire avec compromis mesures et analyse d'erreurs honnete."
        ]
      }
    },
    content: []
  }
];

for (const post of posts) {
  post.content = post.locales.en.content;
}

export function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export function getLocalizedPost(slug: string, locale: Locale) {
  const post = getPostBySlug(slug);

  if (!post) return undefined;

  const localized = post.locales[locale];

  return {
    ...post,
    title: localized.title,
    excerpt: localized.excerpt,
    content: localized.content
  };
}

export function getLocalizedPosts(locale: Locale) {
  return posts.map((post) => {
    const localized = post.locales[locale];

    return {
      ...post,
      title: localized.title,
      excerpt: localized.excerpt,
      content: localized.content
    };
  });
}

export function getPostsByCategory(categorySlug: string, locale: Locale) {
  return getLocalizedPosts(locale).filter((post) => slugify(post.category) === categorySlug);
}

export function getPostsByTag(tagSlug: string, locale: Locale) {
  return getLocalizedPosts(locale).filter((post) => post.tags.some((tag) => slugify(tag) === tagSlug));
}

export function getPopularPosts(locale: Locale, limit = 3) {
  return [...getLocalizedPosts(locale)].sort((a, b) => b.popularScore - a.popularScore).slice(0, limit);
}

export function getAllCategories() {
  return Array.from(new Set(posts.map((post) => post.category)));
}

export function getAllTags() {
  return Array.from(new Set(posts.flatMap((post) => post.tags)));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function getComparisonBySlug(slug: string) {
  return comparisons.find((comparison) => comparison.slug === slug);
}
