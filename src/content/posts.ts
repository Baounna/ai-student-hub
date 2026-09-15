import type { Locale } from "@/i18n/config";
import { isSafeHttpUrl, normalizeHttpUrl } from "@/lib/url";
import { csExpansionPosts } from "@/content/posts-cs";

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
  intentKeyword?: string;
  track?: EditorialTrack;
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

export type EditorialTrack = "ai" | "cs" | "career";

export const REQUIRED_CATEGORY_COVERAGE = [
  "AI Fundamentals",
  "ML Engineering",
  "LLM Systems",
  "CS Fundamentals",
  "Systems & Backend",
  "Cloud/DevOps",
  "Security & Performance",
  "Career/Interviews"
] as const;

export type RecommendedTool = {
  name: string;
  icon: string;
  category: Record<Locale, string>;
  summary: Record<Locale, string>;
  benefit: Record<Locale, string>;
  affiliateHref: string;
};

export type StudentStudyTool = {
  name: string;
  icon: string;
  category: Record<Locale, string>;
  summary: Record<Locale, string>;
  bestFor: Record<Locale, string>;
  keywords: string[];
  href: string;
  source: string;
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
  if (placement.includes("comparison")) return { en: "Tools", fr: "Outils" };
  return { en: "Resources", fr: "Ressources" };
}

function placementLabel(placement: string): Record<Locale, string> {
  const normalized = placement.replace(/[_-]/g, " ").replace(/\//g, ", ").replace(/\s+/g, " ").trim();
  if (!normalized) return { en: "resources", fr: "ressources" };
  return { en: normalized, fr: normalized };
}

const fallbackRecommendedTools: RecommendedTool[] = [
  {
    name: "Cloud Deploy Stack",
    icon: "/images/tool-cloud.svg",
    category: { en: "Cloud/DevOps", fr: "Cloud/DevOps" },
    summary: {
      en: "Deploy AI and backend services quickly with free credits, managed databases, and simple scaling.",
      fr: "Déploie rapidement des services IA et backend avec crédits gratuits, base managée et mise à l'échelle simple."
    },
    benefit: {
      en: "Best for student demos, API deployments, and portfolio-grade delivery.",
      fr: "Idéal pour des démos étudiantes, déploiement d'API et livrables portfolio."
    },
    affiliateHref: withUtm(digitalOceanBase, "utm_source=ai_student_hub&utm_medium=resources&utm_campaign=hosting")
  },
  {
    name: "CS + ML Learning Platform",
    icon: "/images/tool-course.svg",
    category: { en: "Career/Interviews", fr: "Carriere/Entretiens" },
    summary: {
      en: "Structured pathways for algorithms, backend engineering, MLOps, and interview preparation.",
      fr: "Parcours structurés pour algorithmes, backend, MLOps, et préparation aux entretiens."
    },
    benefit: {
      en: "Best for focused upskilling across AI and core cybersecurity.",
      fr: "Idéal pour monter en compétence sur l'IA et l'informatique fondamentale."
    },
    affiliateHref:
      "https://www.coursera.org/?utm_source=ai_student_hub&utm_medium=resources&utm_campaign=courses"
  },
  {
    name: "Dev Workflow Workspace",
    icon: "/images/tool-productivity.svg",
    category: { en: "Systems & Backend", fr: "Systemes & Backend" },
    summary: {
      en: "Run engineering sprints, API specs, architecture notes, and internship prep in one workspace.",
      fr: "Gère sprints d'ingénierie, specs API, notes d'architecture, et préparation stage en un seul espace."
    },
    benefit: {
      en: "Best for consistent execution across AI and CS project tracks.",
      fr: "Idéal pour une exécution régulière sur projets IA et informatique."
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

const envRecommendedTools: RecommendedTool[] = envAffiliates.map((item, index) => {
  const label = placementLabel(item.placement);
  return {
    name: item.name,
    icon: envIcons[index % envIcons.length],
    category: placementCategory(item.placement),
    summary: {
      en: `Curated partner resource for ${label.en} workflows across AI and cybersecurity execution.`,
      fr: `Ressource partenaire choisie pour les workflows ${label.fr} en IA et informatique.`
    },
    benefit: {
      en: "Selected for practical ROI, faster shipping, and budget-friendly viability.",
      fr: "Selectionnee pour un ROI pratique, un shipping rapide, et une logique budget-friendly."
    },
    affiliateHref: item.url
  };
});

export const recommendedTools: RecommendedTool[] =
  envRecommendedTools.length >= 3 ? envRecommendedTools : fallbackRecommendedTools;

const antigravityUrlRaw = (process.env.NEXT_PUBLIC_ANTIGRAVITY_URL || "https://www.antigravity.ai/").trim();
const antigravityUrl = isSafeHttpUrl(antigravityUrlRaw)
  ? normalizeHttpUrl(antigravityUrlRaw)
  : "https://www.antigravity.ai/";

const fallbackStudentStudyTools: StudentStudyTool[] = [
  {
    name: "NotebookLM",
    icon: "https://www.google.com/s2/favicons?domain=notebooklm.google&sz=256",
    category: { en: "AI Study Assistant", fr: "Assistant d'etude IA" },
    summary: {
      en: "Upload lecture notes and PDFs, generate grounded summaries, and ask source-backed questions.",
      fr: "Importe tes notes et PDF, genere des resumes fiables, et pose des questions avec citations."
    },
    bestFor: {
      en: "Exam revision, course recap, and source-grounded understanding.",
      fr: "Revision d'examens, recap des cours, et comprehension avec sources."
    },
    keywords: ["notes", "pdf", "summary", "revision", "research"],
    href: "https://notebooklm.google/",
    source: "Google"
  },
  {
    name: "Antigravity",
    icon: "https://www.google.com/s2/favicons?domain=antigravity.ai&sz=256",
    category: { en: "Learning Workflow", fr: "Workflow d'apprentissage" },
    summary: {
      en: "Structured learning flows to keep study sessions focused and execution-oriented.",
      fr: "Flux d'apprentissage structures pour garder des sessions de travail focalisees et actionnables."
    },
    bestFor: {
      en: "Planning study blocks and keeping momentum between classes and projects.",
      fr: "Planifier les blocs d'etude et garder la cadence entre cours et projets."
    },
    keywords: ["planning", "workflow", "focus", "productivity"],
    href: antigravityUrl,
    source: "Antigravity"
  },
  {
    name: "Perplexity",
    icon: "https://www.google.com/s2/favicons?domain=perplexity.ai&sz=256",
    category: { en: "Research Assistant", fr: "Assistant de recherche" },
    summary: {
      en: "Fast web research with citations to verify claims before using them in reports or projects.",
      fr: "Recherche web rapide avec citations pour verifier les infos avant de les utiliser en rapport ou projet."
    },
    bestFor: {
      en: "Quick literature scans and source verification.",
      fr: "Scan rapide de references et verification des sources."
    },
    keywords: ["research", "sources", "citation", "web search"],
    href: "https://www.perplexity.ai/",
    source: "Perplexity"
  },
  {
    name: "Anki",
    icon: "https://www.google.com/s2/favicons?domain=apps.ankiweb.net&sz=256",
    category: { en: "Memory System", fr: "Systeme de memorisation" },
    summary: {
      en: "Spaced-repetition flashcards to retain algorithms, formulas, and AI + Cybersecurity concepts long term.",
      fr: "Cartes a repetition espacee pour retenir durablement algorithmes, formules, et notions IA/CS."
    },
    bestFor: {
      en: "Long-term retention and exam preparation.",
      fr: "Retention long terme et preparation d'examens."
    },
    keywords: ["flashcards", "memory", "revision", "exam"],
    href: "https://apps.ankiweb.net/",
    source: "Anki"
  },
  {
    name: "Wolfram|Alpha",
    icon: "https://www.google.com/s2/favicons?domain=wolframalpha.com&sz=256",
    category: { en: "Math + CS Problem Solving", fr: "Resolution maths + info" },
    summary: {
      en: "Step-by-step support for math, linear algebra, and technical problem solving.",
      fr: "Support pas-a-pas pour maths, algebre lineaire, et resolution technique."
    },
    bestFor: {
      en: "Math-heavy AI + Cybersecurity modules and verification of problem steps.",
      fr: "Modules IA/CS charges en maths et verification des etapes."
    },
    keywords: ["math", "equations", "problem solving", "linear algebra"],
    href: "https://www.wolframalpha.com/",
    source: "Wolfram"
  },
  {
    name: "ChatGPT",
    icon: "https://www.google.com/s2/favicons?domain=chatgpt.com&sz=256",
    category: { en: "AI Study Assistant", fr: "Assistant d'etude IA" },
    summary: {
      en: "Explain concepts, generate practice questions, and draft clearer study notes.",
      fr: "Explique les concepts, genere des questions d'entrainement, et redige de meilleures notes."
    },
    bestFor: {
      en: "Concept breakdowns and rapid first drafts.",
      fr: "Decoupage de concepts et brouillons rapides."
    },
    keywords: ["ai tutor", "questions", "explanations", "notes"],
    href: "https://chatgpt.com/",
    source: "OpenAI"
  },
  {
    name: "Claude",
    icon: "https://www.google.com/s2/favicons?domain=claude.ai&sz=256",
    category: { en: "Reading + Writing Assistant", fr: "Assistant lecture + ecriture" },
    summary: {
      en: "Summarize long technical documents and turn them into structured study plans.",
      fr: "Resume des documents techniques longs et les transforme en plans d'etude structures."
    },
    bestFor: {
      en: "Long reading sessions and writing cleaner reports.",
      fr: "Sessions de lecture longues et redaction de rapports clairs."
    },
    keywords: ["long context", "summaries", "writing", "reports"],
    href: "https://claude.ai/",
    source: "Anthropic"
  },
  {
    name: "Gemini",
    icon: "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=256",
    category: { en: "AI Learning Assistant", fr: "Assistant d'apprentissage IA" },
    summary: {
      en: "Use multimodal prompts for code, diagrams, and course materials in one workspace.",
      fr: "Utilise des prompts multimodaux pour code, schemas, et supports de cours."
    },
    bestFor: {
      en: "Mixed text + image learning sessions.",
      fr: "Sessions d'apprentissage texte + image."
    },
    keywords: ["multimodal", "images", "code", "learning"],
    href: "https://gemini.google.com/",
    source: "Google"
  },
  {
    name: "Notion",
    icon: "https://www.google.com/s2/favicons?domain=notion.so&sz=256",
    category: { en: "Study Workspace", fr: "Espace d'etude" },
    summary: {
      en: "Organize lecture notes, project tasks, and revision plans in one place.",
      fr: "Organise notes de cours, taches projet, et plans de revision au meme endroit."
    },
    bestFor: {
      en: "Planning weekly study goals and project execution.",
      fr: "Planification hebdo des objectifs d'etude et execution projet."
    },
    keywords: ["notes", "planning", "workspace", "tasks"],
    href: "https://www.notion.so/",
    source: "Notion"
  },
  {
    name: "Obsidian",
    icon: "https://www.google.com/s2/favicons?domain=obsidian.md&sz=256",
    category: { en: "Knowledge Base", fr: "Base de connaissances" },
    summary: {
      en: "Build linked knowledge graphs from class notes with local markdown files.",
      fr: "Construit un graphe de connaissances relie a partir de notes markdown locales."
    },
    bestFor: {
      en: "Deep understanding through connected notes.",
      fr: "Comprendre en profondeur via notes reliees."
    },
    keywords: ["knowledge graph", "markdown", "notes", "offline"],
    href: "https://obsidian.md/",
    source: "Obsidian"
  },
  {
    name: "Zotero",
    icon: "https://www.google.com/s2/favicons?domain=zotero.org&sz=256",
    category: { en: "Citation Manager", fr: "Gestion de citations" },
    summary: {
      en: "Collect, organize, and cite papers properly for assignments and reports.",
      fr: "Collecte, organise et cite correctement les papiers pour devoirs et rapports."
    },
    bestFor: {
      en: "Research writing and bibliography quality.",
      fr: "Redaction de recherche et qualite bibliographique."
    },
    keywords: ["citations", "papers", "bibliography", "research"],
    href: "https://www.zotero.org/",
    source: "Zotero"
  },
  {
    name: "Quizlet",
    icon: "https://www.google.com/s2/favicons?domain=quizlet.com&sz=256",
    category: { en: "Practice Drills", fr: "Entrainement" },
    summary: {
      en: "Create quizzes and flashcards to practice concepts before exams.",
      fr: "Cree des quiz et flashcards pour pratiquer les notions avant examen."
    },
    bestFor: {
      en: "Active recall and quick revision loops.",
      fr: "Rappel actif et boucles de revision rapides."
    },
    keywords: ["quiz", "practice", "flashcards", "exam prep"],
    href: "https://quizlet.com/",
    source: "Quizlet"
  },
  {
    name: "Khan Academy",
    icon: "https://www.google.com/s2/favicons?domain=khanacademy.org&sz=256",
    category: { en: "Course Support", fr: "Support de cours" },
    summary: {
      en: "Free structured lessons for math, computing, and foundational topics.",
      fr: "Lecons structurees gratuites pour maths, informatique, et bases essentielles."
    },
    bestFor: {
      en: "Strengthening fundamentals before advanced AI + Cybersecurity modules.",
      fr: "Renforcer les fondamentaux avant modules IA/CS avances."
    },
    keywords: ["courses", "fundamentals", "math", "cybersecurity"],
    href: "https://www.khanacademy.org/",
    source: "Khan Academy"
  },
  {
    name: "Coursera",
    icon: "https://www.google.com/s2/favicons?domain=coursera.org&sz=256",
    category: { en: "Course Platform", fr: "Plateforme de cours" },
    summary: {
      en: "Guided AI and CS courses with assignments and certification pathways.",
      fr: "Cours guides en IA et informatique avec devoirs et parcours de certification."
    },
    bestFor: {
      en: "Structured long-term upskilling and interview prep.",
      fr: "Montée en competence structuree et preparation aux entretiens."
    },
    keywords: ["courses", "certification", "learning path", "ai cs"],
    href: "https://www.coursera.org/",
    source: "Coursera"
  },
  {
    name: "Grammarly",
    icon: "https://www.google.com/s2/favicons?domain=grammarly.com&sz=256",
    category: { en: "Writing Assistant", fr: "Assistant d'ecriture" },
    summary: {
      en: "Improve assignment writing quality, internship emails, and project documentation.",
      fr: "Ameliore la qualite des rapports, emails de stage, et documentation de projet."
    },
    bestFor: {
      en: "Professional communication and cleaner documentation.",
      fr: "Communication professionnelle et documentation plus claire."
    },
    keywords: ["writing", "grammar", "documentation", "emails"],
    href: "https://www.grammarly.com/",
    source: "Grammarly"
  }
];

export const studentStudyTools: StudentStudyTool[] = fallbackStudentStudyTools.filter((tool) => isSafeHttpUrl(tool.href));

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
  },
  {
    slug: "best-backend-stack-for-ml-student-apps",
    title: "Best Backend Stack for ML Student Apps (FastAPI vs Node vs Go)",
    intentKeyword: "best backend stack for ml student apps",
    intro:
      "Choose a backend stack based on API development speed, deployment reliability, and student-friendly maintenance.",
    tools: [
      {
        name: "FastAPI",
        price: "Open-source + hosting cost",
        bestFor: "Python-first AI/ML teams",
        summary: "Typed request validation and automatic OpenAPI docs for fast shipping.",
        affiliateHref: withUtm(digitalOceanBase, "utm_source=ai_student_hub&utm_medium=comparison&utm_campaign=backend_fastapi")
      },
      {
        name: "Node.js + NestJS",
        price: "Open-source + hosting cost",
        bestFor: "Fullstack JS teams",
        summary: "Strong modular architecture and large ecosystem for production APIs.",
        affiliateHref:
          "https://render.com/?utm_source=ai_student_hub&utm_medium=comparison&utm_campaign=backend_node"
      },
      {
        name: "Go + Fiber",
        price: "Open-source + hosting cost",
        bestFor: "Performance-focused services",
        summary: "Low memory footprint and fast response times for API-heavy workloads.",
        affiliateHref:
          "https://railway.com/?utm_source=ai_student_hub&utm_medium=comparison&utm_campaign=backend_go"
      }
    ]
  },
  {
    slug: "best-devops-workflow-for-student-engineers",
    title: "Best DevOps Workflow for Student Engineers (CI/CD + Monitoring)",
    intentKeyword: "best devops workflow for student engineers",
    intro:
      "Compare practical DevOps workflows by release speed, rollback safety, and observability maturity for student teams.",
    tools: [
      {
        name: "GitHub Actions + Docker",
        price: "Free tier + hosting cost",
        bestFor: "Most student teams",
        summary: "Fast setup with broad documentation and simple CI/CD workflows.",
        affiliateHref:
          "https://www.coursera.org/?utm_source=ai_student_hub&utm_medium=comparison&utm_campaign=devops_actions"
      },
      {
        name: "Render Blueprints",
        price: "Usage-based",
        bestFor: "Managed platform deployment",
        summary: "Infrastructure templates with low ops overhead for student projects.",
        affiliateHref:
          "https://render.com/?utm_source=ai_student_hub&utm_medium=comparison&utm_campaign=devops_render"
      },
      {
        name: "Railway Templates",
        price: "Low-cost starter plans",
        bestFor: "Rapid prototypes",
        summary: "Quick environment bootstrapping and predictable early-stage workflows.",
        affiliateHref:
          "https://railway.com/?utm_source=ai_student_hub&utm_medium=comparison&utm_campaign=devops_railway"
      }
    ]
  }
];

const basePosts: BlogPost[] = [
  {
    slug: "ai-portfolio-project-recruiters-notice",
    coverImage: "/images/post-portfolio.svg",
    title: "How to Build an AI Portfolio Project Recruiters Actually Notice",
    excerpt: "A practical framework to scope, ship, and present one AI project that creates measurable internship signal.",
    category: "Career/Interviews",
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
          "Most students are not blocked by ability. They are blocked by positioning. A notebook model can be entirely correct and still generate no hiring signal, because correctness says nothing about product thinking, deployment, or whether you can explain a decision to someone who was not there. The gap between a good model and a good portfolio project is almost entirely made of those three things.",
          "Start from a real pain point, and prefer one you have personally felt. Resume-to-job matching, question answering over lecture notes, triage of internship applications — these are narrow, legible, and immediately understandable to a reviewer. A narrow problem someone recognises beats a broad one they have to be talked into caring about.",
          "Then define an MVP strictly enough that it hurts. The first version should solve exactly one task end to end, with visible output quality. Scope creep in a portfolio project is not ambition; it is the most common reason the project is never finished, and an unfinished ambitious system generates no signal at all.",
          "Build the dumb baseline first and write down what it scores. Keyword matching before embeddings, a heuristic before a model, the obvious approach before the interesting one. This costs an afternoon and buys you the single most valuable sentence in the interview: not that your system works, but that it is measurably better than the obvious alternative, and by how much.",
          "Pay attention to where your system fails, and keep the examples. Every project has inputs it handles badly. Candidates who can show three failure cases and explain what causes them are demonstrating exactly the diagnostic ability that the job consists of. Candidates who claim their system works well are demonstrating that they have not looked hard.",
          "Deploy it. This is the single largest multiplier available to a student project, and it is the step most often skipped. A URL a reviewer can open in one click changes how the entire project is read — it moves you from someone who trained a model to someone who shipped a thing. The engineering it forces on you, from packaging to timeouts, is also the engineering employers are hiring for.",
          "Write the README for the reviewer rather than for yourself. Lead with what the project does and a screenshot or a link, then the architecture, then the tradeoffs you took and why, then setup instructions last. Most student READMEs invert that order and open with installation, which answers a question nobody has asked yet.",
          "Include the numbers you actually have and none that you do not. Baseline score, current score, latency, monthly cost. Four honest figures build more credibility than a paragraph of adjectives, and they give the interviewer something to ask about, which is what you want.",
          "One finished, deployed, documented project with measured tradeoffs outperforms five half-built repositories, and it is not close. Depth is legible in a way breadth is not — and it gives you something to defend for twenty minutes rather than something to describe for two."
        ]
      },
      fr: {
        title: "Construire un projet IA de portfolio que les recruteurs remarquent",
        excerpt:
          "Un cadre pratique pour cadrer, livrer et présenter un projet IA qui augmente réellement ton signal de stage.",
        content: [
          "La plupart des étudiants ne sont pas bloqués par leurs compétences, mais par leur positionnement. Un modèle dans un notebook peut être parfaitement correct et ne produire aucun signal de recrutement, parce que la justesse ne dit rien de la réflexion produit, du déploiement, ni de votre capacité à expliquer une décision à quelqu'un qui n'était pas là. L'écart entre un bon modèle et un bon projet de portfolio est presque entièrement fait de ces trois choses.",
          "Partez d'un vrai point de douleur, de préférence un que vous avez ressenti. Faire correspondre un CV à une offre, répondre à des questions sur vos notes de cours, trier des candidatures de stage : c'est étroit, lisible, et immédiatement compréhensible pour un relecteur. Un problème étroit que l'on reconnaît vaut mieux qu'un problème large dont il faut convaincre.",
          "Définissez ensuite un MVP assez strict pour que ça fasse mal. La première version doit résoudre exactement une tâche de bout en bout, avec une qualité de sortie visible. L'élargissement du périmètre dans un projet de portfolio n'est pas de l'ambition : c'est la première cause de projets jamais terminés, et un système ambitieux inachevé ne produit aucun signal.",
          "Construisez d'abord la version bête et notez son score. Une correspondance par mots-clés avant les embeddings, une heuristique avant un modèle, l'approche évidente avant l'approche intéressante. Cela coûte un après-midi et vous achète la phrase la plus précieuse de l'entretien : non pas que votre système fonctionne, mais qu'il est mesurablement meilleur que l'alternative évidente, et de combien.",
          "Regardez où votre système échoue, et gardez les exemples. Tout projet a des entrées qu'il traite mal. Un candidat capable de montrer trois cas d'échec et d'en expliquer la cause démontre exactement la capacité de diagnostic dont le métier est fait. Un candidat qui affirme que son système marche bien démontre surtout qu'il n'a pas regardé.",
          "Déployez-le. C'est le plus gros multiplicateur disponible pour un projet étudiant, et l'étape la plus souvent sautée. Une URL qu'un relecteur ouvre en un clic change la lecture de tout le projet : vous passez de quelqu'un qui a entraîné un modèle à quelqu'un qui a livré une chose. Et l'ingénierie que cela impose, de l'empaquetage aux délais d'attente, est précisément celle pour laquelle on recrute.",
          "Écrivez le README pour le relecteur, pas pour vous. Commencez par ce que fait le projet, avec une capture ou un lien, puis l'architecture, puis les compromis retenus et pourquoi, et l'installation en dernier. La plupart des README étudiants font l'inverse et ouvrent sur l'installation, ce qui répond à une question que personne n'a encore posée.",
          "Donnez les chiffres que vous avez réellement, et aucun autre. Score de référence, score actuel, latence, coût mensuel. Quatre chiffres honnêtes construisent plus de crédibilité qu'un paragraphe d'adjectifs, et ils donnent à l'intervieweur de quoi creuser — ce que vous voulez.",
          "Un projet terminé, déployé, documenté, avec des compromis mesurés, bat cinq dépôts à moitié construits, et ce n'est même pas serré. La profondeur est lisible là où l'étendue ne l'est pas — et elle vous donne de quoi défendre pendant vingt minutes au lieu de décrire pendant deux."
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
    category: "Cloud/DevOps",
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
          "Most student machine-learning projects die in a notebook. The model works, the accuracy is respectable, and then it sits in a repository nobody runs. Deployment is what converts that work into something a recruiter can click, and it is also where the difference between a student project and a professional one becomes visible in about thirty seconds.",
          "The instinct that ruins budgets is treating deployment as one machine that runs everything. A single always-on instance with your model loaded in memory bills you around the clock for traffic you do not have. The costs that hurt are almost never per-request; they are idle capacity and accidental GPU time.",
          "Split the stack instead. Your frontend is static files and belongs on a CDN, where the free tiers are genuinely generous and stay free at portfolio traffic. Your inference API is a small container that can sleep when idle. Your model weights live in object storage and get pulled at startup, not committed to the repository. Three pieces, each priced by what it actually consumes.",
          "Then right-size the model, which is the lever most students never pull. A distilled or quantised model that runs on CPU is often within a point or two of the original on the metric you care about, and it removes the GPU line from your bill entirely. Exporting to a portable runtime such as ONNX gives you smaller memory footprints and faster cold starts. If your project genuinely needs a GPU, say so in the README and explain the tradeoff — that sentence reads as engineering judgement, not as a limitation.",
          "Containerise it, and not because containers are fashionable. A Dockerfile is the difference between a project that runs on your laptop and one that runs anywhere, and it is the artefact that proves you can hand your work to someone else. Keep the image small: a slim base, no build toolchain in the final layer, dependencies pinned. A 200MB image starts in seconds; a 4GB one keeps a reviewer waiting and costs you more to store.",
          "Set your budget guardrails before you deploy, not after the first bill. Every serious platform offers spending caps and alert thresholds; configure them on day one, at a number you would be willing to lose. This is not paranoia. A misconfigured retry loop or an endpoint someone finds and hammers can turn a free project into a real invoice overnight, and the students this happens to are always the ones who meant to set limits later.",
          "Accept cold starts honestly. Free tiers sleep after a period of inactivity, which means the first request after a quiet spell is slow — and the first request is exactly what a recruiter makes. You have three options, and all of them are defensible: keep the container warm with a scheduled ping, accept the delay and show a loading state that explains it, or pay a small amount for an always-on tier. What is not defensible is a demo that appears broken because you never considered it.",
          "Add a health check endpoint that actually checks something. A route that returns 200 unconditionally tells you nothing; one that confirms the model loaded and can run a trivial inference tells you the service is genuinely up. Platforms use it to restart dead containers, and you use it to know whether a failure is your model or your infrastructure.",
          "Log the things you will need at three in the morning: request latency, model version, input shape, and errors with enough context to reproduce them. You do not need a monitoring platform. Structured lines to stdout, which every host captures, will answer most questions you will ever ask of a portfolio project.",
          "Rate limit the endpoint. On a public inference API this is a cost control before it is a security measure — without one, a single script can exhaust a month of budget in an afternoon. A simple per-IP limit is enough at this scale, and the fact that you thought about it is itself worth mentioning.",
          "Then write the architecture down. A short README section with a diagram of the three pieces, the monthly cost, and the tradeoffs you chose — CPU over GPU, sleep over always-on, this platform over that one — is the highest-leverage thing in the entire project. Most candidates cannot explain why their system looks the way it does. The document is what turns your deployment into something you can be interviewed about.",
          "That is the real return. A deployed model with a clear architecture and a known monthly cost gives an interviewer something concrete to probe, and gives you something specific to defend. The model itself is rarely the interesting part of the conversation. The decisions around it almost always are."
        ]
      },
      fr: {
        title: "Déployer des modèles ML avec un budget étudiant sans paraître amateur",
        excerpt:
          "Un plan de déploiement pratique avec contrôle des coûts, fiabilité et architecture prête pour portfolio.",
        content: [
          "La plupart des projets de machine learning étudiants meurent dans un notebook. Le modèle fonctionne, la précision est correcte, puis le tout reste dans un dépôt que personne n'exécute. Le déploiement est ce qui transforme ce travail en quelque chose qu'un recruteur peut ouvrir, et c'est aussi là que la différence entre un projet étudiant et un projet professionnel devient visible en une trentaine de secondes.",
          "L'erreur qui ruine les budgets consiste à traiter le déploiement comme une seule machine qui fait tout. Une instance allumée en permanence, modèle chargé en mémoire, vous facture jour et nuit pour un trafic que vous n'avez pas. Les coûts qui font mal ne viennent presque jamais des requêtes : ils viennent de la capacité inutilisée et du temps GPU accidentel.",
          "Séparez plutôt la stack. Votre frontend n'est que des fichiers statiques et a sa place sur un CDN, où les offres gratuites sont réellement généreuses et le restent au trafic d'un portfolio. Votre API d'inférence est un petit conteneur qui peut s'endormir quand personne ne l'utilise. Les poids du modèle vivent dans un stockage objet et sont téléchargés au démarrage, pas versionnés dans le dépôt. Trois briques, chacune facturée sur ce qu'elle consomme vraiment.",
          "Ensuite, dimensionnez le modèle correctement — le levier que presque aucun étudiant n'utilise. Un modèle distillé ou quantifié qui tourne sur CPU reste souvent à un ou deux points de l'original sur la métrique qui vous intéresse, et il supprime entièrement la ligne GPU de votre facture. L'export vers un runtime portable comme ONNX réduit l'empreinte mémoire et accélère les démarrages à froid. Si votre projet a réellement besoin d'un GPU, écrivez-le dans le README et expliquez le compromis : cette phrase se lit comme du jugement d'ingénieur, pas comme une limite.",
          "Conteneurisez, et pas parce que c'est à la mode. Un Dockerfile fait la différence entre un projet qui tourne sur votre portable et un projet qui tourne n'importe où, et c'est l'artefact qui prouve que vous savez transmettre votre travail. Gardez l'image petite : base légère, pas de chaîne de compilation dans la couche finale, dépendances figées. Une image de 200 Mo démarre en quelques secondes ; une de 4 Go fait attendre le relecteur et coûte plus cher à stocker.",
          "Fixez vos garde-fous budgétaires avant de déployer, pas après la première facture. Toute plateforme sérieuse propose des plafonds de dépense et des alertes : configurez-les dès le premier jour, à un montant que vous accepteriez de perdre. Ce n'est pas de la paranoïa. Une boucle de retry mal réglée ou un endpoint que quelqu'un découvre et martèle transforme un projet gratuit en vraie facture du jour au lendemain, et ceux à qui cela arrive avaient toujours l'intention de mettre des limites plus tard.",
          "Assumez les démarrages à froid honnêtement. Les offres gratuites mettent le service en veille après une période d'inactivité : la première requête après un temps calme est donc lente — et la première requête, c'est exactement celle que fait un recruteur. Vous avez trois options, toutes défendables : maintenir le conteneur éveillé avec un ping planifié, accepter le délai et afficher un écran de chargement qui l'explique, ou payer un petit montant pour une offre toujours active. Ce qui n'est pas défendable, c'est une démo qui semble cassée parce que vous n'y aviez pas pensé.",
          "Ajoutez un endpoint de health check qui vérifie réellement quelque chose. Une route qui renvoie 200 sans condition ne vous apprend rien ; une route qui confirme que le modèle est chargé et peut exécuter une inference triviale vous dit que le service tourne vraiment. La plateforme s'en sert pour redémarrer les conteneurs morts, et vous pour savoir si la panne vient du modèle ou de l'infrastructure.",
          "Journalisez ce dont vous aurez besoin à trois heures du matin : latence des requêtes, version du modèle, forme des entrées, et les erreurs avec assez de contexte pour les reproduire. Vous n'avez pas besoin d'une plateforme de monitoring. Des lignes structurées sur la sortie standard, que tout hébergeur capture, répondront à la plupart des questions que vous poserez à un projet de portfolio.",
          "Limitez le débit de l'endpoint. Sur une API d'inférence publique, c'est un contrôle de coût avant d'être une mesure de sécurité : sans limite, un simple script épuise un mois de budget en un après-midi. Une limite par IP suffit à cette échelle, et le fait d'y avoir pensé mérite d'être mentionné.",
          "Puis documentez l'architecture. Une courte section de README avec un schéma des trois briques, le coût mensuel et les compromis retenus — CPU plutôt que GPU, veille plutôt qu'allumage permanent, cette plateforme plutôt qu'une autre — est l'élément le plus rentable de tout le projet. La plupart des candidats ne savent pas expliquer pourquoi leur système a cette forme. C'est ce document qui transforme votre déploiement en sujet d'entretien.",
          "Voilà le vrai retour sur investissement. Un modèle déployé, avec une architecture claire et un coût mensuel connu, donne à l'intervieweur quelque chose de concret à creuser et vous donne quelque chose de précis à défendre. Le modèle lui-même est rarement la partie intéressante de la conversation. Les décisions autour de lui le sont presque toujours."
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
    category: "Career/Interviews",
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
          "Most students who fail internship applications are not failing on ability. They are failing on legibility. A reviewer spends well under a minute deciding whether to keep reading, and in that time a list of coursework and a repository of unfinished tutorials communicates almost nothing about what you can actually do. Ninety days is enough to change that, but only if the work is aimed at being understood rather than at being impressive.",
          "The first thirty days are foundation, and the hardest discipline is narrowing. Pick one theme and stay on it: retrieval systems, or backend reliability, or evaluation, but not all three. Breadth reads as indecision to someone scanning quickly, whereas a candidate who has spent three months on one problem has something specific to be asked about. Set a cadence you can actually hold — one substantial output a week beats five in a burst followed by silence.",
          "Use that first month to build the boring infrastructure of being visible: a repository that runs from a clean clone, a README that explains what the project does before it explains how to install it, and a profile that names the thing you work on. None of this is glamorous. All of it is checked.",
          "The middle thirty days are execution, and the goal is one project shipped end to end rather than three started. End to end means a real input, a real output, and a deployed URL someone can open without installing anything. The scope should feel almost embarrassingly small — a single task, done completely, beats an ambitious system that stops at a notebook.",
          "Publish the process while you build, not after. A short weekly note on what broke and what you changed is worth more than a polished retrospective written at the end, because it demonstrates the thing employers are actually screening for: that you keep going when something does not work. It also gives you a written record of decisions you will otherwise forget by the time anyone asks.",
          "Build a baseline before you build the clever version, and keep the number. Knowing that your retrieval step took accuracy from sixty to seventy-four percent is a sentence you can say in an interview. Knowing only that the final system is good is not, and interviewers can tell the difference immediately.",
          "The last thirty days are conversion, and this is where most of the ninety days gets wasted. Your resume should describe outcomes and constraints rather than technologies used. Anyone can list PyTorch. Far fewer can write a line explaining what they measured, what tradeoff they took, and what it cost.",
          "Rewrite your project narrative for a listener rather than a reader. Practise a two-minute version out loud: the problem, why the obvious approach failed, what you did instead, and what you would change with more time. That last part matters more than people expect — naming a weakness in your own work reads as judgement, not as doubt.",
          "Apply in small deliberate batches rather than in bulk, and adjust between them. Twenty applications with a targeted first line will outperform two hundred generic ones, and they give you a feedback signal you can actually act on before you have burned through every opening you cared about.",
          "The mechanism that makes ninety days work is not intensity. It is that consistent, visible output compounds into something that looks deliberate from the outside, and deliberate is the quality being selected for."
        ]
      },
      fr: {
        title: "Roadmap stage IA: de zéro signal à prêt pour l'entretien en 90 jours",
        excerpt: "Un plan d'exécution sur 90 jours pour construire autorité, améliorer candidatures et obtenir des entretiens.",
        content: [
          "La plupart des étudiants qui échouent à décrocher un stage n'échouent pas sur la compétence, mais sur la lisibilité. Un recruteur consacre bien moins d'une minute à décider s'il continue, et pendant ce temps une liste de cours suivis et un dépôt de tutoriels inachevés ne communiquent presque rien de ce que vous savez faire. Quatre-vingt-dix jours suffisent à changer cela, mais seulement si le travail vise à être compris plutôt qu'à impressionner.",
          "Les trente premiers jours sont une phase de fondation, et la discipline la plus difficile est de réduire. Choisissez un seul thème et tenez-le : les systèmes de recherche, ou la fiabilité backend, ou l'évaluation — mais pas les trois. La dispersion se lit comme de l'indécision, alors qu'un candidat qui a passé trois mois sur un problème a quelque chose de précis à raconter. Fixez un rythme que vous pouvez réellement tenir : une production sérieuse par semaine vaut mieux que cinq d'un coup suivies du silence.",
          "Profitez de ce premier mois pour construire l'infrastructure ennuyeuse de la visibilité : un dépôt qui fonctionne depuis un clone propre, un README qui explique ce que fait le projet avant d'expliquer comment l'installer, et un profil qui nomme le sujet sur lequel vous travaillez. Rien de tout cela n'est spectaculaire. Tout cela est vérifié.",
          "Les trente jours suivants sont l'exécution, et l'objectif est un projet livré de bout en bout plutôt que trois commencés. De bout en bout signifie une vraie entrée, une vraie sortie, et une URL déployée que l'on peut ouvrir sans rien installer. Le périmètre doit paraître presque gênant de petitesse : une tâche unique, traitée complètement, vaut mieux qu'un système ambitieux qui s'arrête au notebook.",
          "Publiez le processus pendant que vous construisez, pas après. Une note hebdomadaire sur ce qui a cassé et ce que vous avez changé vaut plus qu'une rétrospective polie écrite à la fin, parce qu'elle démontre ce que les employeurs cherchent réellement : que vous continuez quand quelque chose ne marche pas. Elle vous laisse aussi une trace écrite de décisions que vous aurez oubliées le jour où on vous les demandera.",
          "Construisez une version de référence avant la version astucieuse, et gardez le chiffre. Savoir que votre étape de recherche a fait passer la précision de soixante à soixante-quatorze pour cent est une phrase que vous pouvez prononcer en entretien. Savoir seulement que le système final est bon ne l'est pas, et un intervieweur fait immédiatement la différence.",
          "Les trente derniers jours servent à la conversion, et c'est là que la plupart des quatre-vingt-dix jours se gâchent. Votre CV doit décrire des résultats et des contraintes plutôt qu'une liste de technologies. N'importe qui peut écrire PyTorch. Beaucoup moins de gens savent écrire une ligne expliquant ce qu'ils ont mesuré, quel compromis ils ont pris et ce qu'il a coûté.",
          "Réécrivez le récit de votre projet pour un auditeur, pas pour un lecteur. Entraînez-vous à une version de deux minutes à voix haute : le problème, pourquoi l'approche évidente a échoué, ce que vous avez fait à la place, et ce que vous changeriez avec plus de temps. Cette dernière partie compte plus qu'on ne le croit : nommer une faiblesse de son propre travail se lit comme du jugement, pas comme du doute.",
          "Candidatez par petits lots réfléchis plutôt qu'en masse, et ajustez entre les lots. Vingt candidatures avec une première phrase ciblée feront mieux que deux cents génériques, et elles vous donnent un signal exploitable avant d'avoir épuisé toutes les offres qui vous intéressaient.",
          "Ce qui fait fonctionner ces quatre-vingt-dix jours n'est pas l'intensité. C'est qu'une production régulière et visible finit par ressembler, vue de l'extérieur, à quelque chose de délibéré — et c'est exactement la qualité que l'on sélectionne."
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
    category: "AI Fundamentals",
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
    category: "CS Fundamentals",
    tags: ["algorithms", "data-structures", "systems-design"],
    cluster: "CS Fundamentals for AI",
    publishedAt: "2026-02-09",
    readTime: "10 min read",
    keywords: ["cybersecurity roadmap for ai students", "cs fundamentals for ml engineers", "algorithms for ai"],
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
          "AI students often ask if classic cybersecurity still matters. The short answer is yes: CS fundamentals are the difference between a working demo and a reliable product.",
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
    category: "LLM Systems",
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
        source: "Google Research",
        label: { en: "Attention Is All You Need", fr: "Attention Is All You Need" },
        href: "https://research.google/pubs/attention-is-all-you-need/"
      },
      {
        source: "NeurIPS",
        label: { en: "Neural Machine Translation by Jointly Learning to Align and Translate", fr: "Neural Machine Translation by Jointly Learning to Align and Translate" },
        href: "https://papers.nips.cc/paper/2014/hash/5a18e133cbf9f257297f410bb7eca942-Abstract.html"
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

/**
 * Reading time, measured rather than declared.
 *
 * The hand-written readTime values claimed nine to eighteen minutes on posts
 * whose bodies run to a hundred words — sixteen of eighteen overstated it by
 * more than three times. A reader who clicks "12 min read" and gets 109 words
 * does not come back, and search engines treat that gap as thin content, which
 * works directly against the traffic this site needs.
 *
 * So the number is derived from the body at 220 words per minute. Where a post
 * is short the label now says so. That is unflattering and correct, and it
 * makes it obvious which posts still need writing.
 */
const WORDS_PER_MINUTE = 220;

function measureReadTime(post: BlogPost): string {
  // Read from locales.en, not post.content: the top-level content field is
  // still [] at this point and only gets filled from the locale block below.
  // Measuring the empty array reported "1 min read" for every post, including
  // the 1,200-word ones — an understatement replacing an overstatement.
  const words = post.locales.en.content.reduce(
    (sum, paragraph) => sum + paragraph.split(/\s+/).filter(Boolean).length,
    0
  );
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

export const posts: BlogPost[] = [...basePosts, ...csExpansionPosts].map((post) => ({
  ...post,
  readTime: measureReadTime(post)
}));

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

const CATEGORY_TRACK_MAP: Record<string, EditorialTrack> = {
  "ai fundamentals": "ai",
  "ml engineering": "ai",
  "llm systems": "ai",
  "cs fundamentals": "cs",
  "systems & backend": "cs",
  "cloud/devops": "cs",
  "security & performance": "cs",
  "career/interviews": "career"
};

function normalizeCategoryKey(category: string) {
  return category.trim().toLowerCase();
}

export function getCategoryTrack(category: string): EditorialTrack {
  const normalized = normalizeCategoryKey(category);
  return CATEGORY_TRACK_MAP[normalized] || "cs";
}

export function getPostTrack(post: Pick<BlogPost, "category" | "track">): EditorialTrack {
  return post.track || getCategoryTrack(post.category);
}

export function getPostsByTrack(track: EditorialTrack, locale: Locale) {
  return getLocalizedPosts(locale).filter((post) => getPostTrack(post) === track);
}

export function getTrackLabel(track: EditorialTrack, locale: Locale) {
  if (track === "ai") return locale === "fr" ? "IA" : "AI";
  if (track === "career") return locale === "fr" ? "Carriere" : "Career";
  return "CS";
}

export function getCategoriesByTrack(track: EditorialTrack) {
  return getAllCategories().filter((category) => getCategoryTrack(category) === track);
}

export function getTrackCounts(locale: Locale) {
  const localized = getLocalizedPosts(locale);
  return localized.reduce(
    (acc, post) => {
      acc[getPostTrack(post)] += 1;
      return acc;
    },
    { ai: 0, cs: 0, career: 0 } as Record<EditorialTrack, number>
  );
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
  const dynamicCategories = posts.map((post) => post.category);
  return Array.from(new Set([...REQUIRED_CATEGORY_COVERAGE, ...dynamicCategories]));
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
