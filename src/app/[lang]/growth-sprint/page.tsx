import type { Metadata } from "next";
import Link from "next/link";
import { Newsletter } from "@/components/newsletter";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { siteConfig } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords } from "@/lib/seo";
import { isSafeHttpUrl, normalizeHttpUrl } from "@/lib/url";

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  const fr = params.lang === "fr";
  const title = fr ? "Sprint croissance 14 jours" : "14-day growth sprint";
  const description = fr
    ? "Plan d'execution concret pour rendre AI Student Hub plus attractif et plus utile aux etudiants."
    : "Concrete execution plan to make AI Student Hub more attractive and more useful for students.";

  return {
    title,
    description,
    keywords: getSeoKeywords(params.lang, "growth", [
      fr ? "sprint croissance blog" : "blog growth sprint",
      fr ? "plan 14 jours blog ia" : "14 day ai blog plan"
    ]),
    openGraph: {
      title,
      description,
      url: `/${params.lang}/growth-sprint`,
      type: "website",
      images: [{ url: "/images/post-roadmap.svg", width: 1200, height: 675, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/post-roadmap.svg"]
    },
    alternates: localizedAlternates("/growth-sprint", params.lang)
  };
}

type SprintDay = {
  day: string;
  task: Record<Locale, string>;
  output: Record<Locale, string>;
};

const sprintDays: SprintDay[] = [
  {
    day: "Day 1",
    task: {
      en: "Select 3 high-intent topics from the auto AI/CS feed (comparison, budget, tools).",
      fr: "Selectionne 3 sujets a forte intention depuis le flux auto AI/CS (comparaison, budget, outils)."
    },
    output: {
      en: "3 article titles + target keyword each.",
      fr: "3 titres d'articles + 1 keyword cible chacun."
    }
  },
  {
    day: "Day 2",
    task: {
      en: "Publish article #1 with 2 affiliate CTAs and 1 lead magnet CTA.",
      fr: "Publie l'article #1 avec 2 CTA affiliation et 1 CTA lead magnet."
    },
    output: {
      en: "1 live article with source references.",
      fr: "1 article en ligne avec references source."
    }
  },
  {
    day: "Day 3",
    task: {
      en: "Repurpose article #1 into LinkedIn post + short summary thread.",
      fr: "Reconvertis l'article #1 en post LinkedIn + thread resume."
    },
    output: {
      en: "1 social post driving traffic to blog.",
      fr: "1 post social qui renvoie vers le blog."
    }
  },
  {
    day: "Day 4",
    task: {
      en: "Publish article #2 (comparison angle) and link to resources + compare page.",
      fr: "Publie l'article #2 (angle comparatif) et lie vers resources + compare."
    },
    output: {
      en: "1 comparison-style article.",
      fr: "1 article style comparaison."
    }
  },
  {
    day: "Day 5",
    task: {
      en: "Send weekly email digest with 2 articles + 1 product CTA.",
      fr: "Envoie digest email hebdo avec 2 articles + 1 CTA produit."
    },
    output: {
      en: "1 email campaign sent.",
      fr: "1 campagne email envoyee."
    }
  },
  {
    day: "Day 6",
    task: {
      en: "Update resources page with one new partner tool and fresh value note.",
      fr: "Mets a jour resources avec un nouvel outil partenaire + note de valeur."
    },
    output: {
      en: "Resources freshness signal improved.",
      fr: "Signal de fraicheur resources renforce."
    }
  },
  {
    day: "Day 7",
    task: {
      en: "Review CTR on affiliate links and optimize weakest CTA copy.",
      fr: "Analyse CTR des liens affilies et optimise le CTA le plus faible."
    },
    output: {
      en: "Improved CTA copy v2.",
      fr: "Copy CTA v2 amelioree."
    }
  },
  {
    day: "Day 8",
    task: {
      en: "Publish article #3 from latest auto signals with strict source citations.",
      fr: "Publie l'article #3 depuis les derniers signaux auto avec citations strictes."
    },
    output: {
      en: "1 source-backed trend article.",
      fr: "1 article tendance source-backed."
    }
  },
  {
    day: "Day 9",
    task: {
      en: "Add internal links between all 3 new articles and the product page.",
      fr: "Ajoute des liens internes entre les 3 nouveaux articles et la page produit."
    },
    output: {
      en: "Stronger internal funnel.",
      fr: "Funnel interne plus solide."
    }
  },
  {
    day: "Day 10",
    task: {
      en: "Publish one short “best free tools” post for low-friction clicks.",
      fr: "Publie un post court “best free tools” pour clics faciles."
    },
    output: {
      en: "1 additional affiliate entry point.",
      fr: "1 point d'entree affiliation supplementaire."
    }
  },
  {
    day: "Day 11",
    task: {
      en: "Create one FAQ block in top-performing article to improve SEO snippet chances.",
      fr: "Ajoute un bloc FAQ dans l'article le plus performant pour ameliorer le SEO snippet."
    },
    output: {
      en: "Improved search relevance.",
      fr: "Pertinence recherche amelioree."
    }
  },
  {
    day: "Day 12",
    task: {
      en: "Re-share best article on LinkedIn with updated hook and direct CTA.",
      fr: "Repartage le meilleur article sur LinkedIn avec nouveau hook + CTA direct."
    },
    output: {
      en: "Second social traffic wave.",
      fr: "Deuxieme vague de trafic social."
    }
  },
  {
    day: "Day 13",
    task: {
      en: "Review product page copy and improve trust note + urgency sentence.",
      fr: "Revois le copy de la page produit et ameliore trust note + phrase d'urgence."
    },
    output: {
      en: "Higher product conversion readiness.",
      fr: "Conversion produit mieux preparee."
    }
  },
  {
    day: "Day 14",
    task: {
      en: "Weekly KPI review: traffic, CTR, opt-ins, product clicks; pick next 3 topics.",
      fr: "Review KPI hebdo: trafic, CTR, opt-ins, clics produit; choisis 3 prochains sujets."
    },
    output: {
      en: "Next sprint queue ready.",
      fr: "Queue du prochain sprint prete."
    }
  }
];

export default function GrowthSprintPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";
  const leadMagnetHref = fr ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;
  const checkoutUrlRaw = (process.env.NEXT_PUBLIC_PRODUCT_CHECKOUT_URL || "").trim();
  const checkoutUrl = isSafeHttpUrl(checkoutUrlRaw) ? normalizeHttpUrl(checkoutUrlRaw) : "";
  const hasCheckoutUrl = Boolean(checkoutUrl);

  const kpis = fr
    ? [
        { kpi: "Trafic hebdo", target: "75-150 visites", alert: "< 40 visites" },
        { kpi: "CTR affiliation", target: "3%-6%", alert: "< 2%" },
        { kpi: "Opt-in email", target: "2%-5%", alert: "< 1.5%" },
        { kpi: "Clic produit", target: "1%-3%", alert: "< 0.8%" }
      ]
    : [
        { kpi: "Weekly traffic", target: "75-150 visits", alert: "< 40 visits" },
        { kpi: "Affiliate CTR", target: "3%-6%", alert: "< 2%" },
        { kpi: "Email opt-in rate", target: "2%-5%", alert: "< 1.5%" },
        { kpi: "Product click rate", target: "1%-3%", alert: "< 0.8%" }
      ];

  const templates = fr
    ? {
        intro:
          "Si tu construis un projet IA cette semaine, commence par cette comparaison et choisis un stack adapte a ton budget.",
        mid:
          "Pour aller plus vite, ouvre notre page resources et prends un outil deploy + un outil productivity.",
        end:
          "Tu veux un systeme complet? Recupere la roadmap gratuite puis passe au guide etudiant."
      }
    : {
        intro:
          "If you are building an AI project this week, start with this comparison and pick a stack that fits your budget.",
        mid:
          "To ship faster, open our resources page and choose one deploy tool plus one productivity tool.",
        end:
          "Want the full system? Get the free roadmap, then move to the student guide."
      };

  return (
    <section className="page-shell max-w-6xl py-10 md:py-16">
      <header className="do-hero rounded-3xl p-7 md:p-10">
        <p className="do-kicker">{fr ? "Execution sprint" : "Execution sprint"}</p>
        <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
          {fr ? "Plan 14 jours pour rendre le blog attractif et utile" : "14-day plan to make the blog attractive and useful"}
        </h1>
        <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">
          {fr
            ? "Playbook concret pour ameliorer contenu, SEO et conversion avec un systeme simple."
            : "Concrete playbook to improve content, SEO, and conversion with a simple system."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/${locale}/news`} className="btn-secondary">
            {fr ? "Actualites AI/CS" : "AI/CS news"}
          </Link>
          <Link href={`/${locale}/resources`} className="btn-secondary">
            {fr ? "Resources" : "Resources"}
          </Link>
          <Link href={`/${locale}/compare`} className="btn-secondary">
            {fr ? "Compare" : "Compare"}
          </Link>
          <TrackableAnchor href={leadMagnetHref} event="lead_magnet_click" meta={{ page: "growth_sprint_hero", locale }} className="btn-primary">
            {fr ? "Roadmap gratuite" : "Free roadmap"}
          </TrackableAnchor>
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {sprintDays.map((item) => (
          <article key={item.day} className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">{item.day}</p>
            <p className="mt-2 text-sm text-[color:var(--text)]">{item.task[locale]}</p>
            <p className="mt-3 text-xs text-[color:var(--muted)]">
              {fr ? "Livrable:" : "Output:"} {item.output[locale]}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.15fr,1fr]">
        <article className="surface rounded-2xl p-6">
          <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
            {fr ? "Templates CTA prets a copier" : "Copy-ready CTA templates"}
          </h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{fr ? "Intro" : "Intro"}</p>
              <p className="mt-2 text-sm text-[color:var(--text)]">{templates.intro}</p>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{fr ? "Milieu" : "Middle"}</p>
              <p className="mt-2 text-sm text-[color:var(--text)]">{templates.mid}</p>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{fr ? "Fin" : "End"}</p>
              <p className="mt-2 text-sm text-[color:var(--text)]">{templates.end}</p>
            </div>
          </div>
        </article>

        <article className="surface rounded-2xl p-6">
          <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
            {fr ? "KPI a suivre chaque semaine" : "Weekly KPI checkpoints"}
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[22rem] border-collapse text-sm">
              <thead>
                <tr className="text-left text-[color:var(--muted)]">
                  <th className="border-b border-[color:var(--border)] pb-2 pr-3">{fr ? "KPI" : "KPI"}</th>
                  <th className="border-b border-[color:var(--border)] pb-2 pr-3">{fr ? "Cible" : "Target"}</th>
                  <th className="border-b border-[color:var(--border)] pb-2">{fr ? "Alerte" : "Alert"}</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map((row) => (
                  <tr key={row.kpi}>
                    <td className="border-b border-[color:var(--border)] py-2 pr-3 text-[color:var(--text-strong)]">{row.kpi}</td>
                    <td className="border-b border-[color:var(--border)] py-2 pr-3 text-[color:var(--text)]">{row.target}</td>
                    <td className="border-b border-[color:var(--border)] py-2 text-[color:var(--muted)]">{row.alert}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/${locale}/resources`} className="btn-secondary">
              {fr ? "Optimiser resources" : "Optimize resources"}
            </Link>
            <Link href={`/${locale}/product/ai-career-guide`} className="btn-secondary">
              {fr ? "Optimiser page produit" : "Optimize product page"}
            </Link>
            {hasCheckoutUrl ? (
              <TrackableAnchor
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                event="product_checkout_click"
                meta={{ page: "growth_sprint_kpi", locale, offer: "ai-career-guide" }}
                className="btn-primary"
              >
                {fr ? "Tester checkout" : "Test checkout"}
              </TrackableAnchor>
            ) : null}
          </div>
        </article>
      </section>

      <section className="mt-6">
        <Newsletter locale={locale} source="growth_sprint_main" />
      </section>
    </section>
  );
}
