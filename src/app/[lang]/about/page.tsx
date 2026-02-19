import type { Metadata } from "next";
import Link from "next/link";
import { Newsletter } from "@/components/newsletter";
import { siteConfig } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { alternateLanguages } from "@/i18n/helpers";

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};
  const dict = getDictionary(params.lang);

  return {
    title: dict.nav.about,
    description: dict.about.subtitle,
    openGraph: {
      title: dict.nav.about,
      description: dict.about.subtitle,
      url: `/${params.lang}/about`,
      type: "website",
      images: [{ url: "/images/post-portfolio.svg", width: 1200, height: 675, alt: dict.about.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: dict.nav.about,
      description: dict.about.subtitle,
      images: ["/images/post-portfolio.svg"]
    },
    alternates: {
      languages: alternateLanguages("/about")
    }
  };
}

export default function LocalizedAboutPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const dict = getDictionary(locale);
  const socialStats =
    siteConfig.socialProofStats.length > 0
      ? siteConfig.socialProofStats
      : locale === "fr"
        ? ["+1000 etudiants soutenus (objectif 2026)", "Mises a jour hebdomadaires IA + CS", "Ressources pratiques orientees resultats"]
        : ["1000+ students supported (2026 target)", "Weekly AI + CS updates", "Practical resources built for outcomes"];
  const principles = [
    locale === "fr" ? "Construire des projets utiles, pas seulement des notebooks." : "Ship useful projects, not only notebooks.",
    locale === "fr" ? "Mesurer les resultats: demos, candidatures, entretiens." : "Measure outcomes: demos, applications, interviews.",
    locale === "fr" ? "Respecter le budget etudiant sans sacrifier la qualite." : "Respect student budgets without sacrificing quality."
  ];
  const roadmap = [
    {
      phase: "30 days",
      body:
        locale === "fr"
          ? "Construire un premier projet deploye avec documentation claire."
          : "Ship one deployed project with clear documentation."
    },
    {
      phase: "60 days",
      body:
        locale === "fr"
          ? "Publier contenu d'autorite + optimiser ressources et comparatifs."
          : "Publish authority content and optimize resources/comparisons."
    },
    {
      phase: "90 days",
      body:
        locale === "fr"
          ? "Transformer execution en stages, freelancing ou premiere monetisation."
          : "Convert execution into internships, freelance opportunities, or first monetization."
    }
  ];

  return (
    <div className="page-shell max-w-6xl py-10 md:py-16">
      <div className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{dict.nav.about}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {dict.about.title}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">{dict.about.subtitle}</p>
          </div>
          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{locale === "fr" ? "Positionnement" : "Positioning"}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              {siteConfig.authoritySignals[locale].slice(0, 3).map((signal) => (
                <li key={signal}>- {signal}</li>
              ))}
            </ul>
            <a href={siteConfig.linkedinUrl} className="do-link mt-4 inline-block text-sm">
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        {socialStats.map((line) => (
          <article key={line} className="surface rounded-2xl p-4 text-sm text-[color:var(--text)]">
            {line}
          </article>
        ))}
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-[1.35fr,1fr]">
        <section className="surface rounded-2xl p-6 text-[color:var(--text)]">
          <p className="do-kicker">{locale === "fr" ? "Fondateur" : "Founder"}</p>
          <p className="body-copy mt-4">
            {locale === "fr"
              ? siteConfig.founderBio.fr
              : siteConfig.founderBio.en}
          </p>
          <p className="body-copy mt-4">
            {locale === "fr"
              ? "La mission d'AI Student Hub: transformer l'apprentissage passif en exécution mesurable avec résultats carrière."
              : "AI Student Hub exists to convert passive learning into measurable execution and career outcomes."}
          </p>
          <p className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--text)]">
            {siteConfig.linkedinShortBio[locale]}
          </p>
          <p className="mt-4">
            <a href={siteConfig.linkedinUrl} className="do-link">
              LinkedIn
            </a>
          </p>
        </section>

        <section className="glass rounded-2xl p-6">
          <p className="do-kicker">{locale === "fr" ? "Principes" : "Operating principles"}</p>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
            {principles.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
          {locale === "fr" ? "Roadmap execution" : "Execution roadmap"}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--text)]">
          {locale === "fr"
            ? "Plan simple pour convertir apprentissage IA/CS en projets deployes, signal recruteur et premiers revenus."
            : "Simple plan to convert AI/CS learning into deployed projects, recruiter signal, and early revenue."}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {roadmap.map((step) => (
            <article key={step.phase} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <p className="text-sm font-semibold text-[color:var(--primary)]">{step.phase}</p>
              <p className="mt-2 text-sm text-[color:var(--text)]">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      {siteConfig.testimonials.length ? (
        <section className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
            {locale === "fr" ? "Avis etudiants" : "Student testimonials"}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {siteConfig.testimonials.map((testimonial) => (
              <article key={`${testimonial.name}-${testimonial.role[locale]}`} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <p className="text-sm text-[color:var(--text)]">&ldquo;{testimonial.quote[locale]}&rdquo;</p>
                <p className="mt-3 text-sm font-semibold text-[color:var(--text-strong)]">{testimonial.name}</p>
                <p className="text-xs text-[color:var(--muted)]">{testimonial.role[locale]}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
          {locale === "fr" ? "Commencer maintenant" : "Start now"}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--text)]">
          {locale === "fr"
            ? "Commence par les actualites, puis ressources, comparatifs, et enfin le blog pour l'execution."
            : "Start with news, then resources, comparisons, and the blog for weekly execution."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/${locale}/news`} className="btn-secondary">
            {locale === "fr" ? "Actualites" : "News"}
          </Link>
          <Link href={`/${locale}/resources`} className="btn-primary">
            {locale === "fr" ? "Ressources" : "Resources"}
          </Link>
          <Link href={`/${locale}/compare`} className="btn-secondary">
            {locale === "fr" ? "Comparatifs" : "Compare"}
          </Link>
          <Link href={`/${locale}/blog`} className="btn-secondary">
            {locale === "fr" ? "Blog" : "Blog"}
          </Link>
        </div>
      </section>

      <div className="mt-10">
        <Newsletter locale={locale} source="about_main" />
      </div>
    </div>
  );
}
