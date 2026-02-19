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
      title: "AI Student Hub",
      description: "Practical AI execution for engineering students building careers.",
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
      headline: "Build AI Projects That Turn Into Internships, Authority, and Income",
      subheadline:
        "AI Student Hub is the execution platform for engineering students who want career outcomes, not passive learning.",
      ctaPrimary: "Get Free AI Career Roadmap",
      ctaSecondary: "Explore Blog",
      trust: [
        "Project-first playbooks",
        "Practical deployment systems",
        "Student budget focused",
        "EN/FR content"
      ],
      popular: "Most Popular",
      socialProof: "Social Proof"
    },
    blog: {
      title: "Build, Ship, and Grow as an AI Engineer",
      subtitle: "Tactical tutorials and systems for stronger portfolios and internship conversion.",
      latest: "Latest Articles",
      readPost: "Read post",
      related: "Related Articles",
      inPostCallout: "Useful Tool Stack",
      inPostCalloutBody:
        "Want to execute this faster? Check the resources stack for student-friendly tools and deployment options.",
      openResources: "Open resources page"
    },
    about: {
      title: "Building Career-Ready AI Engineers",
      subtitle:
        "I help students ship portfolio-grade projects and convert that execution into internship and early-career outcomes."
    },
    resources: {
      title: "Recommended Tools for AI Students",
      subtitle:
        "Tools selected for practical ROI: faster shipping, better learning loops, and conversion-focused execution."
    },
    news: {
      title: "AI + CS News for Students",
      subtitle:
        "Weekly briefs that explain what changed, why it matters for students, and what to build next.",
      latest: "Latest briefs",
      impact: "Student impact",
      actions: "Action steps",
      source: "Source context",
      readBrief: "Read brief",
      weeklyDigestTitle: "Get the weekly AI + CS digest",
      weeklyDigestBody:
        "Every week: top signals, practical action plan, and one high-ROI project idea for AI/engineering students.",
      openBlog: "Open blog",
      openResources: "Open resources",
      openCompare: "Open comparisons"
    },
    newsletter: {
      badge: "Free AI Career Roadmap",
      title: "Turn your next 30 days into portfolio and interview wins",
      description:
        "Get the exact weekly system to ship one AI project, publish authority content, and increase internship conversion.",
      cta: "Get Free Roadmap"
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
      title: "AI Student Hub",
      description: "Exécution IA pratique pour les étudiants en ingénierie qui construisent leur carrière.",
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
      headline: "Construis des projets IA qui deviennent stages, autorité et revenus",
      subheadline:
        "AI Student Hub est la plateforme d'exécution pour les étudiants en ingénierie qui veulent des résultats carrière.",
      ctaPrimary: "Obtenir la roadmap IA",
      ctaSecondary: "Explorer le blog",
      trust: [
        "Playbooks orientes projet",
        "Systemes de deploiement pratiques",
        "Optimise budget etudiant",
        "Contenu EN/FR"
      ],
      popular: "Les plus populaires",
      socialProof: "Preuves sociales"
    },
    blog: {
      title: "Construire, livrer et progresser comme ingénieur IA",
      subtitle: "Tutoriels tactiques et systèmes pour portfolio solide et conversion en stage.",
      latest: "Derniers articles",
      readPost: "Lire l'article",
      related: "Articles liés",
      inPostCallout: "Stack d'outils utile",
      inPostCalloutBody:
        "Tu veux aller plus vite ? Consulte la stack de ressources pour des outils étudiants et déploiement.",
      openResources: "Voir les ressources"
    },
    about: {
      title: "Former des ingénieurs IA prêts pour le marché",
      subtitle:
        "J'aide les étudiants à livrer des projets portfolio et à transformer cette exécution en stages et opportunités."
    },
    resources: {
      title: "Outils recommandés pour étudiants IA",
      subtitle:
        "Des outils choisis pour un ROI concret : livrer plus vite, apprendre mieux et convertir l'audience."
    },
    news: {
      title: "Actualites IA + Informatique pour etudiants",
      subtitle:
        "Des briefs hebdomadaires: ce qui change, pourquoi c'est important pour les etudiants, et quoi construire ensuite.",
      latest: "Derniers briefs",
      impact: "Impact etudiant",
      actions: "Actions recommandees",
      source: "Contexte source",
      readBrief: "Lire le brief",
      weeklyDigestTitle: "Recevoir le digest IA + informatique",
      weeklyDigestBody:
        "Chaque semaine: signaux majeurs, plan d'action concret, et une idee de projet a fort ROI pour etudiants IA/ingenierie.",
      openBlog: "Ouvrir le blog",
      openResources: "Voir les ressources",
      openCompare: "Voir les comparatifs"
    },
    newsletter: {
      badge: "Roadmap carrière IA gratuite",
      title: "Transforme les 30 prochains jours en résultats concrets",
      description:
        "Reçois le système hebdomadaire pour livrer un projet IA, publier du contenu d'autorité et améliorer tes candidatures.",
      cta: "Recevoir la roadmap"
    }
  }
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
