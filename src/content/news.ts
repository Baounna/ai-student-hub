import type { Locale } from "@/i18n/config";

export type NewsTrack = "ai" | "cs" | "career";

export type NewsBrief = {
  slug: string;
  publishedAt: string;
  topic: string;
  readTime: string;
  keywords: string[];
  tags: string[];
  source: {
    name: string;
    href: string;
  };
  statsByTheme?: Array<{
    theme: Record<Locale, string>;
    benchmark: string;
    snapshot: Record<Locale, string>;
    stats: Array<{
      model: string;
      value: string;
    }>;
  }>;
  relatedPostSlugs: string[];
  locales: Record<
    Locale,
    {
      title: string;
      summary: string;
      studentImpact: string;
      takeaways: string[];
      actionSteps: string[];
    }
  >;
};

export type LocalizedNewsBrief = Omit<NewsBrief, "locales"> &
  NewsBrief["locales"][Locale];

export const newsBriefs: NewsBrief[] = [
  {
    slug: "ai-performance-by-theme-feb-2026",
    publishedAt: "2026-02-19T19:00:00.000Z",
    topic: "AI Performance",
    readTime: "5 min read",
    keywords: [
      "latest ai benchmark performance",
      "ai model performance by theme",
      "aime gpqa mmmu screenspot 2026"
    ],
    tags: ["benchmarks", "reasoning", "math", "multimodal", "coding"],
    source: {
      name: "Google DeepMind Gemini benchmark table (February 2026)",
      href: "https://deepmind.google/models/gemini/"
    },
    statsByTheme: [
      {
        theme: { en: "General reasoning", fr: "Raisonnement general" },
        benchmark: "Humanity's Last Exam (No tools)",
        snapshot: { en: "February 2026 snapshot", fr: "Snapshot fevrier 2026" },
        stats: [
          { model: "Gemini 3 Pro Thinking", value: "Official source table" },
          { model: "GPT-5.1", value: "Official source table" },
          { model: "Claude Sonnet 4.5 Thinking", value: "Official source table" }
        ]
      },
      {
        theme: { en: "Science QA", fr: "Questions scientifiques" },
        benchmark: "GPQA Diamond (No tools)",
        snapshot: { en: "February 2026 snapshot", fr: "Snapshot fevrier 2026" },
        stats: [
          { model: "Gemini 3 Pro Thinking", value: "Official source table" },
          { model: "GPT-5.1", value: "Official source table" },
          { model: "Claude Sonnet 4.5 Thinking", value: "Official source table" }
        ]
      },
      {
        theme: { en: "Math reasoning", fr: "Raisonnement mathematique" },
        benchmark: "AIME 2025 (No tools)",
        snapshot: { en: "February 2026 snapshot", fr: "Snapshot fevrier 2026" },
        stats: [
          { model: "Gemini 3 Pro Thinking", value: "Official source table" },
          { model: "GPT-5.1", value: "Official source table" },
          { model: "Claude Sonnet 4.5 Thinking", value: "Official source table" }
        ]
      },
      {
        theme: { en: "Multimodal understanding", fr: "Compréhension multimodale" },
        benchmark: "MMMU-Pro",
        snapshot: { en: "February 2026 snapshot", fr: "Snapshot fevrier 2026" },
        stats: [
          { model: "Gemini 3 Pro Thinking", value: "Official source table" },
          { model: "GPT-5.1", value: "Official source table" },
          { model: "Claude Sonnet 4.5 Thinking", value: "Official source table" }
        ]
      },
      {
        theme: { en: "UI/screen execution", fr: "Execution sur interface ecran" },
        benchmark: "ScreenSpot-Pro",
        snapshot: { en: "February 2026 snapshot", fr: "Snapshot fevrier 2026" },
        stats: [
          { model: "Gemini 3 Pro Thinking", value: "Official source table" },
          { model: "Claude Sonnet 4.5 Thinking", value: "Official source table" },
          { model: "GPT-5.1", value: "Official source table" }
        ]
      }
    ],
    relatedPostSlugs: ["transformers-rag-and-agents-for-students", "deploy-ml-model-student-budget"],
    locales: {
      en: {
        title: "Latest AI performance by theme (Feb 2026 snapshot)",
        summary:
          "A new benchmark table published in February 2026 compares current frontier models across reasoning, science QA, math, multimodal understanding, and UI/screen tasks.",
        studentImpact:
          "Students can now choose models by use case theme instead of hype: one model for math-heavy tasks, another for multimodal or UI-heavy execution.",
        takeaways: [
          "Reasoning: Gemini 3 Pro leads HLE (37.5%) in this snapshot.",
          "Science + math: Gemini 3 Pro and GPT-5.1 are close on GPQA and AIME.",
          "Multimodal/UI: Gemini 3 Pro leads MMMU-Pro and ScreenSpot-Pro in this table."
        ],
        actionSteps: [
          "Map your project type to one benchmark theme before picking a model.",
          "Track one quality metric and one cost metric per release.",
          "Document your model choice with benchmark evidence in README and portfolio notes."
        ]
      },
      fr: {
        title: "Dernieres performances IA par theme (snapshot fevrier 2026)",
        summary:
          "Un nouveau tableau benchmark publie en fevrier 2026 compare les modeles frontier sur raisonnement, QA scientifique, mathematiques, multimodal et taches UI/ecran.",
        studentImpact:
          "Les etudiants peuvent choisir un modele par type de tache reelle plutot que par hype: un modele pour math/science, un autre pour multimodal ou execution UI.",
        takeaways: [
          "Raisonnement: Gemini 3 Pro mene sur HLE (37.5%) dans ce snapshot.",
          "Science + maths: Gemini 3 Pro et GPT-5.1 restent proches sur GPQA et AIME.",
          "Multimodal/UI: Gemini 3 Pro mene MMMU-Pro et ScreenSpot-Pro dans ce tableau."
        ],
        actionSteps: [
          "Relie ton projet a un theme benchmark avant de choisir ton modele.",
          "Suis une metrique qualite et une metrique cout a chaque release.",
          "Justifie ton choix modele avec preuves benchmark dans README et portfolio."
        ]
      }
    }
  },
  {
    slug: "agentic-workflows-enter-student-projects",
    publishedAt: "2026-02-19",
    topic: "AI Systems",
    readTime: "4 min read",
    keywords: [
      "agentic ai workflow",
      "student ai project architecture",
      "multi-step llm apps"
    ],
    tags: ["agents", "workflow", "project-architecture"],
    source: {
      name: "Industry product updates and engineering blogs",
      href: "https://www.anthropic.com/news"
    },
    relatedPostSlugs: ["ai-portfolio-project-recruiters-notice", "deploy-ml-model-student-budget"],
    locales: {
      en: {
        title: "Agentic workflows are entering student AI projects",
        summary:
          "Student builders are moving from single-prompt demos to multi-step agent workflows with planning, retrieval, and tool calls.",
        studentImpact:
          "This raises the bar: recruiters now expect system design clarity, not only prompt quality.",
        takeaways: [
          "Use explicit task states instead of one giant prompt.",
          "Log every agent step so failures are debuggable in demos.",
          "Show cost and latency tradeoffs in your README."
        ],
        actionSteps: [
          "Refactor one portfolio project into planner + executor stages.",
          "Add tracing output and a fallback route for failed tool calls.",
          "Publish a short architecture note on LinkedIn with diagrams."
        ]
      },
      fr: {
        title: "Les workflows agentiques arrivent dans les projets IA etudiants",
        summary:
          "Les etudiants passent des demos mono-prompt vers des workflows multi-etapes avec planification, retrieval et appels d'outils.",
        studentImpact:
          "Le niveau attendu monte: les recruteurs veulent voir une logique systeme, pas seulement de bons prompts.",
        takeaways: [
          "Decoupe le flux en etats explicites au lieu d'un prompt geant.",
          "Trace chaque etape agent pour debugger les echecs.",
          "Montre les compromis cout/latence dans le README."
        ],
        actionSteps: [
          "Refactorise un projet portfolio en etapes planner + executor.",
          "Ajoute tracing et fallback pour les tool calls qui echouent.",
          "Publie une note architecture courte sur LinkedIn avec schema."
        ]
      }
    }
  },
  {
    slug: "multimodal-models-change-cs-coursework",
    publishedAt: "2026-02-18",
    topic: "AI Research",
    readTime: "3 min read",
    keywords: [
      "multimodal ai for students",
      "computer vision and llm projects",
      "ai cs coursework trends"
    ],
    tags: ["multimodal", "vision", "research"],
    source: {
      name: "Google DeepMind and OpenAI release notes",
      href: "https://deepmind.google/discover/blog/"
    },
    relatedPostSlugs: ["ai-portfolio-project-recruiters-notice"],
    locales: {
      en: {
        title: "Multimodal models are changing AI and CS coursework",
        summary:
          "Course projects increasingly combine text, image, and audio tasks, pushing students to design richer evaluation pipelines.",
        studentImpact:
          "Students with multimodal demos stand out because they show stronger data handling and product thinking.",
        takeaways: [
          "Evaluate by task-specific metrics, not only generic benchmark scores.",
          "Keep one clean baseline before adding modality fusion.",
          "Document dataset licensing and annotation quality."
        ],
        actionSteps: [
          "Extend your current NLP app with one image or audio feature.",
          "Create a small evaluation table for each modality.",
          "Write one section on failure cases and edge scenarios."
        ]
      },
      fr: {
        title: "Les modeles multimodaux changent les projets IA et informatique",
        summary:
          "Les projets de cours melangent de plus en plus texte, image et audio, avec des pipelines d'evaluation plus complets.",
        studentImpact:
          "Un projet multimodal bien deploye differencie fortement un profil etudiant.",
        takeaways: [
          "Mesure avec des metriques liees au cas d'usage, pas seulement un score global.",
          "Garde une baseline propre avant fusion des modalites.",
          "Documente licence dataset et qualite d'annotation."
        ],
        actionSteps: [
          "Ajoute une capacite image ou audio a ton app NLP actuelle.",
          "Cree un mini tableau d'evaluation par modalite.",
          "Ajoute une section sur erreurs et cas limites."
        ]
      }
    }
  },
  {
    slug: "open-source-llm-evaluation-matures",
    publishedAt: "2026-02-17",
    topic: "ML Engineering",
    readTime: "4 min read",
    keywords: [
      "llm eval framework",
      "open source llm testing",
      "student llm reliability"
    ],
    tags: ["evaluation", "open-source", "llm"],
    source: {
      name: "Open-source maintainer updates",
      href: "https://github.com/topics/llm"
    },
    relatedPostSlugs: ["deploy-ml-model-student-budget"],
    locales: {
      en: {
        title: "Open-source LLM evaluation is maturing fast",
        summary:
          "Student teams now have better open-source options for regression testing, prompt checks, and quality gates before deployment.",
        studentImpact:
          "Reliable evaluation is now a core hiring signal, especially for internship candidates building production-like demos.",
        takeaways: [
          "Add regression suites for your critical user intents.",
          "Track hallucination risk separately from response fluency.",
          "Version prompts and eval data together in Git."
        ],
        actionSteps: [
          "Define 20 fixed test cases for your current app.",
          "Automate pass/fail checks before each release.",
          "Show your eval dashboard screenshot in the portfolio README."
        ]
      },
      fr: {
        title: "L'evaluation open-source des LLM devient beaucoup plus mature",
        summary:
          "Les equipes etudiantes disposent de meilleurs outils open-source pour tests de regression, controles de prompts et quality gates.",
        studentImpact:
          "La fiabilite est devenue un signal fort pour les stages IA orientes produit.",
        takeaways: [
          "Ajoute une suite de regression sur les intents critiques.",
          "Separe risque d'hallucination et fluidite de reponse.",
          "Versionne prompts et jeu d'evaluation dans Git."
        ],
        actionSteps: [
          "Definis 20 cas de test fixes pour ton application.",
          "Automatise un check pass/fail avant chaque release.",
          "Affiche une capture dashboard eval dans ton README."
        ]
      }
    }
  },
  {
    slug: "edge-ai-tools-improve-campus-apps",
    publishedAt: "2026-02-15",
    topic: "Computer Systems",
    readTime: "3 min read",
    keywords: [
      "edge ai student projects",
      "low latency ai apps",
      "campus ai systems"
    ],
    tags: ["edge", "systems", "latency"],
    source: {
      name: "Platform engineering docs",
      href: "https://developer.nvidia.com/edge-computing"
    },
    relatedPostSlugs: ["deploy-ml-model-student-budget"],
    locales: {
      en: {
        title: "Edge AI tools are improving practical campus apps",
        summary:
          "More student projects are using on-device or edge inference to reduce latency and protect sensitive data.",
        studentImpact:
          "This is a strong differentiator for CS students applying to systems, robotics, or infra roles.",
        takeaways: [
          "Use edge deployment when latency directly affects user experience.",
          "Measure offline performance before moving to cloud fallback.",
          "Show privacy benefits in your product pitch."
        ],
        actionSteps: [
          "Benchmark your model local-vs-cloud on one real task.",
          "Track latency and memory usage in a simple table.",
          "Explain when to switch to cloud for heavier requests."
        ]
      },
      fr: {
        title: "Les outils Edge AI ameliorent les apps campus",
        summary:
          "De plus en plus de projets etudiants utilisent l'inference locale ou edge pour reduire la latence et proteger les donnees.",
        studentImpact:
          "Excellent signal pour les roles systemes, robotique ou infrastructure.",
        takeaways: [
          "Choisis edge quand la latence impacte directement l'experience utilisateur.",
          "Mesure la performance offline avant fallback cloud.",
          "Valorise l'avantage vie privee dans ton pitch produit."
        ],
        actionSteps: [
          "Compare local vs cloud sur une tache reelle.",
          "Mesure latence et memoire dans un tableau simple.",
          "Documente la regle de bascule vers cloud."
        ]
      }
    }
  },
  {
    slug: "mlops-for-students-moves-left",
    publishedAt: "2026-02-13",
    topic: "MLOps",
    readTime: "4 min read",
    keywords: [
      "student mlops best practices",
      "shift left mlops",
      "ai deployment quality"
    ],
    tags: ["mlops", "quality", "deployment"],
    source: {
      name: "DevOps and MLOps community reports",
      href: "https://ml-ops.org"
    },
    relatedPostSlugs: ["deploy-ml-model-student-budget", "student-ai-internship-roadmap"],
    locales: {
      en: {
        title: "Student MLOps is shifting left",
        summary:
          "Top student projects now integrate monitoring, cost controls, and rollback plans before first public launch.",
        studentImpact:
          "Hiring managers read this as professional engineering maturity even for junior candidates.",
        takeaways: [
          "Plan observability before deployment, not after incidents.",
          "Set hard budget limits and alerts from day one.",
          "Keep rollback scripts simple and tested."
        ],
        actionSteps: [
          "Add one uptime check and one cost alert this week.",
          "Create a one-command rollback script.",
          "Document your incident response in plain language."
        ]
      },
      fr: {
        title: "Le MLOps etudiant se deplace vers l'amont",
        summary:
          "Les meilleurs projets etudiants integrent monitoring, controle des couts et plan de rollback avant lancement public.",
        studentImpact:
          "Ce niveau de preparation donne un signal pro fort meme pour un profil junior.",
        takeaways: [
          "Prepare l'observabilite avant le deploiement.",
          "Definis des limites budgetaires et alertes des le debut.",
          "Garde un script rollback simple et teste."
        ],
        actionSteps: [
          "Ajoute un uptime check et une alerte cout cette semaine.",
          "Cree un script de rollback en une commande.",
          "Documente ton plan incident de facon claire."
        ]
      }
    }
  },
  {
    slug: "cs-hiring-signals-shift-to-shipped-products",
    publishedAt: "2026-02-12",
    topic: "Career",
    readTime: "3 min read",
    keywords: [
      "cs hiring signal students",
      "ai internship portfolio strategy",
      "student tech career"
    ],
    tags: ["career", "internships", "portfolio"],
    source: {
      name: "Recruiter and engineering hiring insights",
      href: "https://www.linkedin.com"
    },
    relatedPostSlugs: ["student-ai-internship-roadmap", "ai-portfolio-project-recruiters-notice"],
    locales: {
      en: {
        title: "CS hiring signals are shifting to shipped products",
        summary:
          "Recruiters continue to prioritize candidates who can show live demos, clear metrics, and strong written project communication.",
        studentImpact:
          "A shipped product with measurable outcomes now beats generic tutorial certificates in most internship screens.",
        takeaways: [
          "Public demos increase trust faster than GitHub stars alone.",
          "Metrics and user outcomes make resume bullets credible.",
          "Clear writing multiplies project impact in interviews."
        ],
        actionSteps: [
          "Add one live URL and one metric to each key project.",
          "Rewrite resume bullets using outcome language.",
          "Publish one weekly build log post to LinkedIn."
        ]
      },
      fr: {
        title: "Les signaux recrutement CS basculent vers des produits livres",
        summary:
          "Les recruteurs valorisent davantage les demos en ligne, les metriques claires et une communication ecrite solide.",
        studentImpact:
          "Un produit deploye avec resultats mesurables depasse souvent les certificats generiques.",
        takeaways: [
          "Une demo publique cree plus de confiance qu'un repo seul.",
          "Les metriques rendent le CV credibile.",
          "Une ecriture claire augmente l'impact en entretien."
        ],
        actionSteps: [
          "Ajoute une URL live et une metrique par projet cle.",
          "Reecris tes bullets CV en langage resultat.",
          "Publie un build log hebdo sur LinkedIn."
        ]
      }
    }
  },
  {
    slug: "api-security-checklists-become-standard-in-student-projects",
    publishedAt: "2026-02-11",
    topic: "Security & Performance",
    readTime: "4 min read",
    keywords: [
      "api security checklist for students",
      "owasp api security student projects",
      "secure backend for ai apps"
    ],
    tags: ["security", "api", "backend"],
    source: {
      name: "OWASP API Security documentation",
      href: "https://owasp.org/API-Security/"
    },
    relatedPostSlugs: ["security-checklist-for-student-ai-and-cs-projects", "backend-apis-for-ml-apps"],
    locales: {
      en: {
        title: "API security checklists are becoming standard in student projects",
        summary:
          "More student teams are adding API security baselines before launch, including auth scope checks, input validation, and rate controls.",
        studentImpact:
          "Security is now a visible quality signal for internships in backend, platform, and ML engineering roles.",
        takeaways: [
          "Treat API security as a release requirement, not a final patch.",
          "Add rate limits and ownership checks on all public endpoints.",
          "Document security controls in project READMEs for reviewer trust."
        ],
        actionSteps: [
          "Run one security checklist before your next deploy.",
          "Add endpoint-level auth tests to CI.",
          "Publish a short security section in your architecture docs."
        ]
      },
      fr: {
        title: "Les checklists securite API deviennent standard dans les projets etudiants",
        summary:
          "De plus en plus d'equipes etudiantes appliquent une base securite API avant lancement: scopes auth, validation d'entrees, et controle de debit.",
        studentImpact:
          "La securite est devenue un signal visible pour les stages backend, platform, et ML engineering.",
        takeaways: [
          "Traite la securite API comme prerequis release.",
          "Ajoute rate limiting et verification ownership sur les endpoints publics.",
          "Documente les controles securite dans le README."
        ],
        actionSteps: [
          "Execute une checklist securite avant ton prochain deploy.",
          "Ajoute des tests auth endpoint dans CI.",
          "Publie une section securite dans la doc architecture."
        ]
      }
    }
  },
  {
    slug: "kubernetes-and-lightweight-devops-patterns-enter-student-workflows",
    publishedAt: "2026-02-10",
    topic: "Cloud/DevOps",
    readTime: "4 min read",
    keywords: [
      "kubernetes for students",
      "devops workflow for student engineers",
      "cloud deployment patterns for ai apps"
    ],
    tags: ["devops", "kubernetes", "deployment"],
    source: {
      name: "Kubernetes blog and ecosystem updates",
      href: "https://kubernetes.io/blog/"
    },
    relatedPostSlugs: ["linux-devops-workflow-for-students", "cicd-for-ml-and-backend-projects"],
    locales: {
      en: {
        title: "Kubernetes and lightweight DevOps patterns are entering student workflows",
        summary:
          "Student teams are combining simple CI/CD pipelines with container-based deployments to reduce release friction across AI and backend projects.",
        studentImpact:
          "Students who can explain deployment workflows and rollback plans now stand out in engineering interviews.",
        takeaways: [
          "Use simple deployment patterns before introducing orchestration complexity.",
          "Track release quality with one rollback metric and one incident metric.",
          "Document your deploy flow so teammates can ship safely."
        ],
        actionSteps: [
          "Create a two-environment setup (staging + production).",
          "Add one smoke test after each deployment.",
          "Write a rollback runbook in your repo."
        ]
      },
      fr: {
        title: "Kubernetes et patterns DevOps legers entrent dans les workflows etudiants",
        summary:
          "Les equipes etudiantes combinent pipelines CI/CD simples et deploiements conteneurises pour reduire la friction release.",
        studentImpact:
          "Savoir expliquer workflow deploiement et rollback devient un avantage fort en entretien technique.",
        takeaways: [
          "Commence par des patterns simples avant orchestration complexe.",
          "Suis une metrique rollback et une metrique incident.",
          "Documente le flow deploy pour que l'equipe shippe en securite."
        ],
        actionSteps: [
          "Mets en place staging + production.",
          "Ajoute un smoke test apres chaque deploiement.",
          "Ecris un runbook rollback dans le repo."
        ]
      }
    }
  },
  {
    slug: "backend-observability-becomes-core-skill-for-ai-cs-students",
    publishedAt: "2026-02-09",
    topic: "Systems & Backend",
    readTime: "3 min read",
    keywords: [
      "observability for student backend",
      "logs metrics traces student projects",
      "monitoring ai backend apps"
    ],
    tags: ["observability", "backend", "performance"],
    source: {
      name: "OpenTelemetry documentation and ecosystem guides",
      href: "https://opentelemetry.io/docs/"
    },
    relatedPostSlugs: ["observability-for-student-engineers", "system-design-for-student-ai-projects"],
    locales: {
      en: {
        title: "Backend observability is becoming a core skill for AI + Cybersecurity students",
        summary:
          "Logs, metrics, and traces are now expected in serious student projects, especially when demos involve APIs, queues, and model inference.",
        studentImpact:
          "Observability shortens debugging time and improves project credibility for recruiter reviews.",
        takeaways: [
          "Instrument key endpoints before scaling traffic.",
          "Use request IDs to connect frontend errors to backend traces.",
          "Track p95 latency and error rate as default service KPIs."
        ],
        actionSteps: [
          "Add structured logging on one critical route this week.",
          "Expose one dashboard for latency and error trends.",
          "Write a short incident note after each major bug."
        ]
      },
      fr: {
        title: "L'observabilite backend devient une competence centrale pour etudiants IA/CS",
        summary:
          "Logs, metriques, et traces sont maintenant attendus dans les projets etudiants serieux avec APIs, files, et inference modele.",
        studentImpact:
          "L'observabilite reduit le temps de debug et renforce la credibilite des projets en review recruteur.",
        takeaways: [
          "Instrumente les endpoints critiques avant de scaler.",
          "Utilise des request IDs pour relier erreurs front et traces backend.",
          "Suis p95 latence et taux d'erreur comme KPIs par defaut."
        ],
        actionSteps: [
          "Ajoute des logs structures sur une route critique cette semaine.",
          "Expose un dashboard latence + erreurs.",
          "Ecris une note incident apres chaque bug majeur."
        ]
      }
    }
  }
];

function localizeNewsBrief(brief: NewsBrief, locale: Locale): LocalizedNewsBrief {
  const localized = brief.locales[locale];
  return {
    ...brief,
    title: localized.title,
    summary: localized.summary,
    studentImpact: localized.studentImpact,
    takeaways: localized.takeaways,
    actionSteps: localized.actionSteps
  };
}

export function getLocalizedNews(locale: Locale) {
  return [...newsBriefs]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .map((brief) => localizeNewsBrief(brief, locale));
}

export function getLatestNews(locale: Locale, limit = 4) {
  return getLocalizedNews(locale).slice(0, limit);
}

export function getNewsBySlug(slug: string, locale: Locale) {
  const brief = newsBriefs.find((item) => item.slug === slug);
  if (!brief) return undefined;
  return localizeNewsBrief(brief, locale);
}

export function getNewsTopics() {
  return Array.from(new Set(newsBriefs.map((brief) => brief.topic)));
}

const TOPIC_TRACK_MAP: Record<string, NewsTrack> = {
  "AI Performance": "ai",
  "AI Systems": "ai",
  "AI Research": "ai",
  "ML Engineering": "ai",
  MLOps: "ai",
  "Computer Systems": "cs",
  "Computer Science": "cs",
  "Cloud/DevOps": "cs",
  "Systems & Backend": "cs",
  "Security & Performance": "cs",
  Career: "career"
};

export function getNewsTrack(topic: string): NewsTrack {
  return TOPIC_TRACK_MAP[topic] || "cs";
}

export function getNewsTrackCounts() {
  return newsBriefs.reduce(
    (acc, brief) => {
      acc[getNewsTrack(brief.topic)] += 1;
      return acc;
    },
    { ai: 0, cs: 0, career: 0 } as Record<NewsTrack, number>
  );
}

export function getNewsByTopic(topic: string, locale: Locale) {
  return getLocalizedNews(locale).filter((brief) => slugifyTopic(brief.topic) === slugifyTopic(topic));
}

export function slugifyTopic(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
