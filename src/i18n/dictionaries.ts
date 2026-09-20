import type { Locale } from "@/i18n/config";

export type Dictionary = {
  nav: {
    news: string;
    blog: string;
    resources: string;
    about: string;
    roadmap: string;
  };
  footer: {
    title: string;
    description: string;
    resources: string;
    tutorials: string;
    tools: string;
    roadmap: string;
    contact: string;
    newsletter: string;
    copyright: string;
  };
  home: {
    badge: string;
    headline: string;
    subheadline: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trust: string[];
    popular: string;
    socialProof: string;
  };
  blog: {
    title: string;
    subtitle: string;
    latest: string;
    readPost: string;
    related: string;
    inPostCallout: string;
    inPostCalloutBody: string;
    openResources: string;
  };
  about: {
    title: string;
    subtitle: string;
  };
  resources: {
    title: string;
    subtitle: string;
  };
  news: {
    title: string;
    subtitle: string;
    latest: string;
    impact: string;
    actions: string;
    source: string;
    readBrief: string;
    weeklyDigestTitle: string;
    weeklyDigestBody: string;
    openBlog: string;
    openResources: string;
    openCompare: string;
  };
  newsletter: {
    badge: string;
    title: string;
    description: string;
    cta: string;
  };
};

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    nav: {
      news: "News",
      blog: "Blog",
      resources: "Resources",
      about: "About",
      roadmap: "Free Roadmap"
    },
    footer: {
      title: "AI and Cybersecurity News",
      description: "Practical AI + cybersecurity execution for anyone who builds, learns, or works with AI. Students remain a key sub-audience.",
      resources: "Resources",
      tutorials: "Tutorials",
      tools: "Recommended Tools",
      roadmap: "Free Roadmap",
      contact: "Contact",
      newsletter: "Newsletter",
      copyright: "All rights reserved."
    },
    home: {
      badge: "Positioning Statement",
      headline: "AI + Cybersecurity News and Execution Guides for Real Builders",
      subheadline:
        "Execution-first updates, tools, and guides for builders, learners, teams, and researchers. Students keep a dedicated path for roadmap, career, and budget-friendly workflows.",
      ctaPrimary: "Get Free AI Career Roadmap",
      ctaSecondary: "Explore Blog",
      trust: [
        "Project-first playbooks",
        "Practical deployment systems",
        "Budget-friendly workflows",
        "EN/FR content"
      ],
      popular: "Most Popular",
      socialProof: "Social Proof"
    },
    blog: {
      title: "Build, Ship, and Grow as an AI + Cybersecurity Engineer",
      subtitle: "Tactical tutorials and systems for stronger portfolios across AI, backend, cloud, and cybersecurity operations.",
      latest: "Latest Articles",
      readPost: "Read post",
      related: "Related Articles",
      inPostCallout: "Useful Tool Stack",
      inPostCalloutBody:
        "Want to execute this faster? Check the resources stack for practical, budget-friendly tools and deployment options.",
      openResources: "Open resources page"
    },
    about: {
      title: "Building Reliable AI + Cybersecurity Execution for Everyone",
      subtitle:
        "I help people ship portfolio-grade projects and convert execution into measurable outcomes. Students remain a core sub-audience."
    },
    resources: {
      title: "Recommended Tools for AI + Cybersecurity Builders",
      subtitle:
        "Tools selected for practical ROI: faster shipping, better learning loops, and execution-focused workflows across AI and cybersecurity."
    },
    news: {
      title: "AI + Cybersecurity News for Everyone",
      subtitle:
        "Weekly briefs that explain what changed, why it matters in practice, and what to build next.",
      latest: "Latest briefs",
      impact: "Practical impact",
      actions: "Action steps",
      source: "Source context",
      readBrief: "Read brief",
      weeklyDigestTitle: "Get the weekly AI + Cybersecurity digest",
      weeklyDigestBody:
        "Every week: top signals, practical action plan, and one high-ROI project idea for builders. Student-focused resources are included.",
      openBlog: "Open blog",
      openResources: "Open resources",
      openCompare: "Open tools lab"
    },
    newsletter: {
      badge: "Stages and alternances, weekly",
      title: "Open tech internships in Morocco and France",
      description:
        "One email a week with new internships, alternances and PFE positions, each with its deadline and a direct link.",
      cta: "See the list"
    }
  },
  fr: {
    nav: {
      news: "Actualites",
      blog: "Blog",
      resources: "Ressources",
      about: "À propos",
      roadmap: "Roadmap gratuite"
    },
    footer: {
      title: "AI and Cybersecurity News",
      description: "Execution IA + cybersecurite pratique pour toute personne qui construit, apprend, ou travaille avec l'IA. Les etudiants restent un public cle.",
      resources: "Ressources",
      tutorials: "Tutoriels",
      tools: "Outils recommandés",
      roadmap: "Roadmap gratuite",
      contact: "Contact",
      newsletter: "Newsletter",
      copyright: "Tous droits réservés."
    },
    home: {
      badge: "Positionnement",
      headline: "Actualites et guides d'execution IA + cybersecurite pour tous",
      subheadline:
        "Updates, outils, et guides orientes execution pour builders, apprenants, equipes, et chercheurs. Les etudiants gardent un parcours dedie roadmap, carriere, et budget-friendly.",
      ctaPrimary: "Obtenir la roadmap IA",
      ctaSecondary: "Explorer le blog",
      trust: [
        "Playbooks orientes projet",
        "Systemes de deploiement pratiques",
        "Approche budget-friendly",
        "Contenu EN/FR"
      ],
      popular: "Les plus populaires",
      socialProof: "Preuves sociales"
    },
    blog: {
      title: "Construire, livrer et progresser comme ingenieur IA + cybersecurite",
      subtitle: "Tutoriels tactiques et systemes pour portfolio solide en IA, backend, cloud et cybersecurite.",
      latest: "Derniers articles",
      readPost: "Lire l'article",
      related: "Articles liés",
      inPostCallout: "Stack d'outils utile",
      inPostCalloutBody:
        "Tu veux aller plus vite ? Consulte la stack de ressources pour des outils étudiants et déploiement.",
      openResources: "Voir les ressources"
    },
    about: {
      title: "Construire une execution IA + cybersecurite fiable pour tous",
      subtitle:
        "J'aide les personnes a livrer des projets portfolio et a transformer l'execution en resultats mesurables. Les etudiants restent un sous-public prioritaire."
    },
    resources: {
      title: "Outils recommandes pour builders IA + cybersecurite",
      subtitle:
        "Des outils choisis pour un ROI concret : livrer plus vite, apprendre mieux et convertir l'audience sur l'IA et la cybersecurite."
    },
    news: {
      title: "Actualites IA + Cybersecurite pour tous",
      subtitle:
        "Des briefs hebdomadaires: ce qui change, pourquoi c'est important en pratique, et quoi construire ensuite.",
      latest: "Derniers briefs",
      impact: "Impact pratique",
      actions: "Actions recommandees",
      source: "Contexte source",
      readBrief: "Lire le brief",
      weeklyDigestTitle: "Recevoir le digest IA + cybersecurite",
      weeklyDigestBody:
        "Chaque semaine: signaux majeurs, plan d'action concret, et une idee de projet a fort ROI pour builders. Les ressources etudiantes restent incluses.",
      openBlog: "Ouvrir le blog",
      openResources: "Voir les ressources",
      openCompare: "Ouvrir la section outils"
    },
    newsletter: {
      badge: "Stages et alternances, chaque semaine",
      title: "Les stages tech ouverts au Maroc et en France",
      description:
        "Un email par semaine avec les nouveaux stages, alternances et PFE, chacun avec sa date limite et un lien direct.",
      cta: "Voir la liste"
    }
  }
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
