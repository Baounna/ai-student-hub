import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AffiliateDisclosureInline } from "@/components/affiliate-disclosure-inline";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { comparisons, recommendedTools } from "@/content/posts";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { alternateLanguages } from "@/i18n/helpers";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  const fr = params.lang === "fr";
  const title = fr ? "Comparatifs d'outils IA" : "AI Tool Comparisons";
  const description = fr
    ? "Comparatifs orientes etudiants pour choisir les outils IA avec contraintes budget, vitesse de deploiement et ROI." 
    : "Student-focused comparison guides to choose AI tools by budget, deployment speed, and practical ROI.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${params.lang}/compare`,
      type: "website",
      images: [{ url: "/images/post-deploy.svg", width: 1200, height: 675, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/post-deploy.svg"]
    },
    alternates: {
      languages: alternateLanguages("/compare")
    }
  };
}

export default function LocalizedCompareIndexPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";
  const playbookTitle = fr ? "Playbook de comparaison" : "Comparison playbook";
  const starterComparison = comparisons[0];
  const defaultTool = recommendedTools[0];
  const faqItems =
    fr
      ? [
          {
            q: "Quel comparatif ouvrir en premier ?",
            a: "Commence par le comparatif cloud: c'est le point de blocage principal pour deployer un projet IA etudiant."
          },
          {
            q: "Combien de temps faut-il pour choisir une stack ?",
            a: "Avec cette grille, 20-30 minutes suffisent pour choisir puis commencer l'execution."
          },
          {
            q: "Comment eviter les mauvais achats d'outils ?",
            a: "Fixe un budget mensuel, compare les compromis, puis valide avec un sprint de 7 jours avant d'etendre."
          }
        ]
      : [
          {
            q: "Which comparison should I open first?",
            a: "Start with the cloud comparison. It is usually the main bottleneck when shipping student AI projects."
          },
          {
            q: "How long should stack selection take?",
            a: "Using this framework, 20-30 minutes is enough to decide and start executing."
          },
          {
            q: "How do I avoid bad tool purchases?",
            a: "Set a monthly cap, compare tradeoffs, then validate with a 7-day sprint before committing further."
          }
        ];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a
      }
    }))
  };

  return (
    <div className="page-shell max-w-6xl py-10 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Breadcrumbs
        items={[
          { label: "AI Student Hub", href: `/${locale}` },
          { label: fr ? "Comparatifs" : "Compare" }
        ]}
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <Link href={`/${locale}/resources`} className="btn-secondary">
          {fr ? "← Retour ressources" : "← Back to resources"}
        </Link>
        <Link href={`/${locale}`} className="btn-secondary">
          {fr ? "Accueil" : "Home"}
        </Link>
      </div>

      <div className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{fr ? "Comparaison" : "Comparison Hub"}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {fr ? "Comparatifs d'outils orientes conversion" : "Conversion-Focused Tool Comparisons"}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">
              {fr
                ? "Des pages a forte intention SEO pour aider les etudiants IA/CS a choisir vite, depenser mieux, et livrer plus rapidement."
                : "High-intent SEO pages built to help AI/CS students decide faster, spend smarter, and ship projects quicker."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Pages orientees intention" : "Intent-driven pages"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Budget etudiant" : "Student budget filters"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Disclosure clair" : "Transparent affiliate disclosure"}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/resources`} className="btn-primary">
                {fr ? "Voir ressources" : "See resources"}
              </Link>
              <Link href={`/${locale}/blog`} className="btn-secondary">
                {fr ? "Guides blog" : "Blog guides"}
              </Link>
            </div>
          </div>

          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{playbookTitle}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>
                {fr
                  ? "1. Definir budget + vitesse de livraison souhaites."
                  : "1. Define target budget and shipping speed."}
              </li>
              <li>
                {fr
                  ? "2. Comparer objectivement prix, usage, compromis."
                  : "2. Compare price, use case, and tradeoffs objectively."}
              </li>
              <li>
                {fr
                  ? "3. Choisir une stack et livrer en 7 jours."
                  : "3. Pick one stack and ship in 7 days."}
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/resources`} className="btn-secondary">
                {fr ? "Voir ressources" : "See resources"}
              </Link>
              <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary">
                {fr ? "Guide etudiant" : "Student guide"}
              </Link>
              {defaultTool ? (
                <TrackableAnchor
                  href={defaultTool.affiliateHref}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  event="affiliate_click"
                  meta={{ page: "compare_index_hero", tool: defaultTool.name, locale }}
                  className="btn-secondary"
                >
                  {fr ? `Tester ${defaultTool.name}` : `Try ${defaultTool.name}`}
                </TrackableAnchor>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8">
          {starterComparison ? (
            <section className="surface rounded-2xl p-6">
              <p className="do-kicker">{fr ? "Commencer ici" : "Start here"}</p>
              <h2 className="font-display section-title mt-2 font-semibold text-[color:var(--text-strong)]">
                {starterComparison.title}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--text)]">{starterComparison.intro}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs text-[color:var(--muted)]">
                  {starterComparison.tools.length} {fr ? "outils notes" : "tools scored"}
                </span>
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs text-[color:var(--muted)]">
                  {fr ? "Fort intent SEO" : "High-intent keyword"}
                </span>
              </div>
              <Link href={`/${locale}/compare/${starterComparison.slug}`} className="btn-primary mt-4 inline-flex">
                {fr ? "Ouvrir ce comparatif" : "Open this comparison"}
              </Link>
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: fr ? "Etape 1: Contraintes" : "Step 1: Set constraints",
                body: fr
                  ? "Definis budget mensuel, vitesse de deploiement et exigences minimales."
                  : "Define monthly budget cap, deployment speed target, and required features."
              },
              {
                title: fr ? "Etape 2: Comparer" : "Step 2: Compare objectively",
                body: fr
                  ? "Utilise la grille pour evaluer prix, cas d'usage et compromis reels."
                  : "Use the table to evaluate price, best use case, and practical tradeoffs."
              },
              {
                title: fr ? "Etape 3: Executer" : "Step 3: Ship and measure",
                body: fr
                  ? "Choisis une stack, livre en 7 jours, optimise apres feedback reel."
                  : "Pick one stack, ship in 7 days, and optimize after usage feedback."
              }
            ].map((step) => (
              <article key={step.title} className="glass rounded-2xl p-5">
                <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">{step.title}</h2>
                <p className="card-copy mt-2 text-[color:var(--text)]">{step.body}</p>
              </article>
            ))}
          </section>

          <section className="space-y-4">
            {comparisons.map((comparison, index) => (
              <article key={comparison.slug} className="card-hover glass overflow-hidden rounded-2xl p-4 md:p-5">
                <div className="grid gap-4 md:grid-cols-[230px,1fr] md:items-start">
                  <div className="media-frame group relative aspect-[16/10]">
                    <Image
                      src="/images/post-deploy.svg"
                      alt={comparison.title}
                      width={1200}
                      height={675}
                      sizes="(max-width: 768px) 100vw, 230px"
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/25 to-transparent" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--primary)]">
                      #{index + 1} • {fr ? "Mot-cle" : "Keyword"}: {comparison.intentKeyword}
                    </p>
                    <h2 className="font-display section-title mt-2 font-semibold text-[color:var(--text-strong)]">{comparison.title}</h2>
                    <p className="card-copy mt-3 text-[color:var(--text)]">{comparison.intro}</p>
                    <p className="mt-2 text-xs text-[color:var(--muted)]">
                      {comparison.tools.length} {fr ? "outils evalues" : "tools scored in this guide"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {comparison.tools.slice(0, 3).map((tool) => (
                        <span
                          key={`${comparison.slug}-${tool.name}`}
                          className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] text-[color:var(--muted)]"
                        >
                          {tool.name}
                        </span>
                      ))}
                    </div>
                    <Link href={`/${locale}/compare/${comparison.slug}`} className="btn-primary mt-4 inline-block">
                      {fr ? "Ouvrir le comparatif" : "Open comparison"}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="surface rounded-2xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "Methodologie de scoring" : "Scoring methodology"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr
                ? "Chaque comparatif suit la meme grille: vitesse de mise en ligne, predictibilite budgetaire, signal portfolio, et courbe d'apprentissage."
                : "Each comparison uses the same framework: speed to first deployment, budget predictability, portfolio value, and learning curve."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/resources`} className="btn-secondary">
                {fr ? "Voir ressources" : "See recommended tools"}
              </Link>
              <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary">
                {fr ? "Guide etudiant" : "Open student guide"}
              </Link>
            </div>
            <AffiliateDisclosureInline locale={locale} className="mt-4 text-xs text-[color:var(--muted)]" />
          </section>

          <section className="reading-panel rounded-2xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "FAQ comparatifs" : "Comparison FAQ"}
            </h2>
            <div className="mt-4 space-y-3">
              {faqItems.map((item) => (
                <article key={item.q} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <h3 className="text-sm font-semibold text-[color:var(--text-strong)]">{item.q}</h3>
                  <p className="mt-2 text-sm text-[color:var(--text)]">{item.a}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <EditorialTrust locale={locale} compact />
          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {fr ? "Prochaines actions" : "Next actions"}
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              <Link href={`/${locale}/resources`} className="btn-secondary text-center">
                {fr ? "Ressources" : "Resources"}
              </Link>
              <Link href={`/${locale}/blog`} className="btn-secondary text-center">
                {fr ? "Guides blog" : "Blog guides"}
              </Link>
              <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary text-center">
                {fr ? "Guide etudiant" : "Student guide"}
              </Link>
            </div>
          </div>
          <Newsletter compact locale={locale} source="compare_index_aside" />
        </aside>
      </div>
    </div>
  );
}
