import type { Locale } from "@/i18n/config";

export type Dictionary = {
  nav: {
    news: string;
    blog: string;
    resources: string;
    about: string;
    stages: string;
  };
  footer: {
    title: string;
    description: string;
    resources: string;
    tutorials: string;
    tools: string;
    stages: string;
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
    /** <title> only. `title` is the H1 and must stay readable. */
    seoTitle: string;
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
    /** <title> only. `title` is the H1 and must stay readable. */
    seoTitle: string;
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
      stages: "Internships"
    },
    footer: {
      title: "AI and Cybersecurity News",
      description: "Practical AI + cybersecurity execution for anyone who builds, learns, or works with AI. Students remain a key sub-audience.",
      resources: "Resources",
      tutorials: "Tutorials",
      tools: "Recommended Tools",
      stages: "Internships",
      contact: "Contact",
      newsletter: "Newsletter",
      copyright: "All rights reserved."
    },
    home: {
      badge: "Positioning Statement",
      headline: "AI + Cybersecurity Guides for Builders",
      subheadline:
        "Execution-first updates, tools, and guides for builders, learners, teams, and researchers. Students keep a dedicated path for internships, career, and budget-friendly workflows.",
      ctaPrimary: "See open internships",
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
      seoTitle: "AI + Cybersecurity Guides",
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
      seoTitle: "Recommended AI + Security Tools",
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
      // "Stages", "alternances" and "PFE" are French. The English labels for
      // the same three things already exist in src/content/stages.ts
      // (KIND_LABELS) and are what the list itself renders, so the newsletter
      // block uses them rather than inventing a second English vocabulary.
      badge: "Internships and apprenticeships, weekly",
      title: "Open tech internships in Morocco and France",
      description:
        "One email a week with new internships, apprenticeships and final-year projects, each with a direct link and its closing date where the employer publishes one.",
      // This is the submit button of the email form, not a link. "See the
      // list" sitting next to an email field reads as navigation, so someone
      // who only wants to browse clicks it and is subscribed instead.
      cta: "Subscribe"
    }
  },
  fr: {
    nav: {
      news: "Actualités",
      blog: "Blog",
      resources: "Ressources",
      about: "À propos",
      stages: "Stages"
    },
    footer: {
      title: "AI and Cybersecurity News",
      description: "Exécution IA + cybersécurité pratique pour toute personne qui construit, apprend, ou travaille avec l'IA. Les étudiants restent un public clé.",
      resources: "Ressources",
      tutorials: "Tutoriels",
      tools: "Outils recommandés",
      stages: "Stages",
      contact: "Contact",
      newsletter: "Newsletter",
      copyright: "Tous droits réservés."
    },
    home: {
      badge: "Positionnement",
      headline: "Guides IA + cybersécurité pour builders",
      subheadline:
        "Updates, outils, et guides orientés exécution pour builders, apprenants, équipes, et chercheurs. Les étudiants gardent un parcours dédié stages, carrière, et budget-friendly.",
      ctaPrimary: "Voir les stages ouverts",
      ctaSecondary: "Explorer le blog",
      trust: [
        "Playbooks orientés projet",
        "Systèmes de déploiement pratiques",
        "Approche budget-friendly",
        "Contenu EN/FR"
      ],
      popular: "Les plus populaires",
      socialProof: "Preuves sociales"
    },
    blog: {
      title: "Construire, livrer et progresser comme ingénieur IA + cybersécurité",
      seoTitle: "Guides IA + cybersécurité",
      subtitle: "Tutoriels tactiques et systèmes pour portfolio solide en IA, backend, cloud et cybersécurité.",
      latest: "Derniers articles",
      readPost: "Lire l'article",
      related: "Articles liés",
      inPostCallout: "Stack d'outils utile",
      inPostCalloutBody:
        "Vous voulez aller plus vite ? Consultez la stack de ressources pour des outils étudiants et déploiement.",
      openResources: "Voir les ressources"
    },
    about: {
      title: "Construire une exécution IA + cybersécurité fiable pour tous",
      subtitle:
        "J'aide les personnes à livrer des projets portfolio et à transformer l'exécution en résultats mesurables. Les étudiants restent un sous-public prioritaire."
    },
    resources: {
      seoTitle: "Outils IA + cybersécurité",
      title: "Outils recommandés pour builders IA + cybersécurité",
      subtitle:
        "Des outils choisis pour un ROI concret : livrer plus vite, apprendre mieux et convertir l'audience sur l'IA et la cybersécurité."
    },
    news: {
      title: "Actualités IA + Cybersécurité pour tous",
      subtitle:
        "Des briefs hebdomadaires: ce qui change, pourquoi c'est important en pratique, et quoi construire ensuite.",
      latest: "Derniers briefs",
      impact: "Impact pratique",
      actions: "Actions recommandées",
      source: "Contexte source",
      readBrief: "Lire le brief",
      weeklyDigestTitle: "Recevoir le digest IA + cybersécurité",
      weeklyDigestBody:
        "Chaque semaine: signaux majeurs, plan d'action concret, et une idée de projet à fort ROI pour builders. Les ressources étudiantes restent incluses.",
      openBlog: "Ouvrir le blog",
      openResources: "Voir les ressources",
      openCompare: "Ouvrir la section outils"
    },
    newsletter: {
      badge: "Stages et alternances, chaque semaine",
      title: "Les stages tech ouverts au Maroc et en France",
      description:
        "Un email par semaine avec les nouveaux stages, alternances et PFE, chacun avec un lien direct et sa date limite quand l'employeur en annonce une.",
      // Bouton d'envoi du formulaire, pas un lien: voir le commentaire côté EN.
      cta: "S'inscrire"
    }
  }
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
