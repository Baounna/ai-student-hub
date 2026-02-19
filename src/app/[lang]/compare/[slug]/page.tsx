import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateDisclosureInline } from "@/components/affiliate-disclosure-inline";
import { ArticleToc } from "@/components/article-toc";
import { BackToTop } from "@/components/back-to-top";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ReadingProgress } from "@/components/reading-progress";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { comparisons, getComparisonBySlug } from "@/content/posts";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords } from "@/lib/seo";

function getEvidenceSource(toolName: string, locale: Locale) {
  const sources: Record<string, { label: string; href: string }> = {
    DigitalOcean: {
      label: locale === "fr" ? "Documentation + prix DigitalOcean" : "DigitalOcean docs + pricing",
      href: "https://www.digitalocean.com/pricing"
    },
    Render: {
      label: locale === "fr" ? "Documentation + prix Render" : "Render docs + pricing",
      href: "https://render.com/pricing"
    },
    Railway: {
      label: locale === "fr" ? "Documentation + prix Railway" : "Railway docs + pricing",
      href: "https://railway.com/pricing"
    }
  };

  return sources[toolName] || null;
}

export function generateStaticParams() {
  return locales.flatMap((lang) => comparisons.map((comparison) => ({ lang, slug: comparison.slug })));
}

export async function generateMetadata({ params }: { params: { lang: string; slug: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  const comparison = getComparisonBySlug(params.slug);

  if (!comparison) {
    return { title: "Comparison Not Found" };
  }

  const fr = params.lang === "fr";
  const title = fr ? `${comparison.title} | Comparatif` : comparison.title;
  const description = fr
    ? `Comparatif etudiant: ${comparison.intro}`
    : comparison.intro;

  return {
    title,
    description,
    keywords: getSeoKeywords(params.lang, "compare", [
      comparison.intentKeyword,
      ...comparison.tools.map((tool) => `${tool.name} vs`)
    ]),
    openGraph: {
      title,
      description,
      url: `/${params.lang}/compare/${params.slug}`,
      type: "article",
      images: [{ url: "/images/post-deploy.svg", width: 1200, height: 675, alt: comparison.title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/post-deploy.svg"]
    },
    alternates: localizedAlternates(`/compare/${params.slug}`, params.lang)
  };
}

export default function LocalizedComparisonPage({ params }: { params: { lang: string; slug: string } }) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";
  const comparison = getComparisonBySlug(params.slug);
  const tocItems = [
    { id: "verdict", label: fr ? "Verdict" : "Verdict" },
    { id: "comparison-table", label: fr ? "Tableau" : "Comparison table" },
    { id: "framework", label: fr ? "Cadre" : "Framework" },
    { id: "references", label: "References" },
    { id: "next-steps", label: fr ? "Actions" : "Next steps" }
  ];

  if (!comparison) notFound();
  const recommendedTool = comparison.tools[0];

  return (
    <article className="page-shell max-w-6xl py-10 md:py-16">
      <ReadingProgress />
      <Breadcrumbs
        items={[
          { label: "AI Student Hub", href: `/${locale}` },
          { label: fr ? "Comparatifs" : "Compare", href: `/${locale}/compare` },
          { label: comparison.title }
        ]}
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <Link href={`/${locale}/compare`} className="btn-secondary">
          {fr ? "← Retour aux comparatifs" : "← Back to comparisons"}
        </Link>
        <Link href={`/${locale}/resources`} className="btn-secondary">
          {fr ? "Ressources" : "Resources"}
        </Link>
      </div>

      <div className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{fr ? "Template comparatif" : "Comparison Template"}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {comparison.title}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">{comparison.intro}</p>
            <p className="mt-4 text-sm text-[color:var(--muted)]">
              {fr
                ? `${comparison.tools.length} options comparees selon budget, vitesse, et impact portfolio.`
                : `${comparison.tools.length} options scored by budget, shipping speed, and portfolio impact.`}
            </p>
          </div>
          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{fr ? "Choix recommande" : "Recommended default"}</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--text-strong)]">{recommendedTool?.name}</p>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr
                ? "Premier choix pour les etudiants qui veulent livrer vite sans exploser leur budget."
                : "First pick for students who need fast shipping without budget surprises."}
            </p>
            {recommendedTool ? (
              <TrackableAnchor
                href={recommendedTool.affiliateHref}
                target="_blank"
                rel="noopener noreferrer sponsored"
                event="affiliate_click"
                meta={{ page: "comparison_hero", tool: recommendedTool.name, slug: comparison.slug, locale }}
                className="btn-primary mt-4 inline-block"
              >
                {fr ? "Tester cet outil" : "Try this tool"}
              </TrackableAnchor>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8">
          <div className="media-frame group relative aspect-[16/10] rounded-2xl">
            <Image
              src="/images/post-deploy.svg"
              alt={comparison.title}
              width={1200}
              height={675}
              priority
              sizes="(max-width: 1024px) 100vw, 900px"
              className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
          </div>

          <section id="verdict" className="anchor-offset surface rounded-2xl p-6">
            <p className="do-kicker">{fr ? "Verdict rapide" : "Quick verdict"}</p>
            <h2 className="font-display section-title mt-2 font-semibold text-[color:var(--text-strong)]">
              {fr ? "Choix par defaut" : "Best default choice"}: {recommendedTool?.name}
            </h2>
            <p className="card-copy mt-2 text-[color:var(--text)]">
              {fr
                ? `${recommendedTool?.name} est le meilleur choix general pour les etudiants grace a un bon equilibre vitesse/cout/qualite portfolio.`
                : `${recommendedTool?.name} is the default pick for most students because it balances speed-to-deploy, predictable costs, and portfolio-ready output.`}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {fr ? "Vitesse de delivery" : "Time-to-deploy"}
                </p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--text-strong)]">40%</p>
              </article>
              <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {fr ? "Controle budget" : "Budget control"}
                </p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--text-strong)]">35%</p>
              </article>
              <article className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {fr ? "Signal portfolio" : "Portfolio signal"}
                </p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--text-strong)]">25%</p>
              </article>
            </div>
          </section>

          <section
            id="comparison-table"
            className="anchor-offset overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]"
          >
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-[color:var(--bg-soft)]/60 text-[color:var(--text)]">
                <tr>
                  <th className="px-4 py-3">{fr ? "Outil" : "Tool"}</th>
                  <th className="px-4 py-3">{fr ? "Prix" : "Price"}</th>
                  <th className="px-4 py-3">{fr ? "Ideal pour" : "Best For"}</th>
                  <th className="px-4 py-3">{fr ? "Action" : "Action"}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.tools.map((tool, index) => (
                  <tr
                    key={tool.name}
                    className="border-t border-[color:var(--border)] transition hover:bg-[color:var(--bg-soft)]/20"
                  >
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[color:var(--text-strong)]">{tool.name}</p>
                        {index === 0 ? (
                          <span className="rounded-full border border-[color:var(--primary)]/45 bg-[color:var(--bg-soft)]/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-strong)]">
                            {fr ? "Recommande" : "Recommended"}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">{tool.summary}</p>
                    </td>
                    <td className="px-4 py-4 text-[color:var(--text)]">{tool.price}</td>
                    <td className="px-4 py-4 text-[color:var(--text)]">{tool.bestFor}</td>
                    <td className="px-4 py-4">
                      <TrackableAnchor
                        href={tool.affiliateHref}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        event="affiliate_click"
                        meta={{ page: "comparison", tool: tool.name, slug: comparison.slug, locale }}
                        className="btn-primary px-3 py-2 text-xs"
                      >
                        {fr ? "Voir l'outil" : "Visit tool"}
                      </TrackableAnchor>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section id="framework" className="anchor-offset surface rounded-2xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "Cadre de decision" : "Decision Framework"}
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--text)]">
              <li>1. {fr ? "Priorise vitesse de mise en ligne, pas la liste de features." : "Choose based on time-to-deploy, not feature count."}</li>
              <li>2. {fr ? "Fixe une limite budget mensuel etudiant." : "Keep monthly tool spend under a fixed student budget cap."}</li>
              <li>3. {fr ? "Choisis les outils qui accelerent le shipping portfolio." : "Prioritize tools that make portfolio shipping easier."}</li>
            </ul>
            <AffiliateDisclosureInline locale={locale} className="mt-4 text-xs text-[color:var(--muted)]" />
          </section>

          <section id="references" className="anchor-offset reading-panel rounded-2xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "References et transparence" : "References and transparency"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr
                ? "Les recommandations sont basees sur les pages officielles prix/documentation et l'usage pratique etudiant."
                : "Recommendations are based on official pricing/docs pages and practical student usage."}
            </p>
            <ol className="mt-4 space-y-2 text-sm text-[color:var(--text)]">
              {comparison.tools.map((tool, index) => {
                const evidence = getEvidenceSource(tool.name, locale);
                const evidenceHref = evidence?.href || tool.affiliateHref;
                const evidenceIsAffiliate = !evidence;
                const evidenceLabel =
                  evidence?.label || (fr ? `Page officielle ${tool.name}` : `${tool.name} official page`);

                return (
                  <li key={`${tool.name}-${index}`} className="leading-7">
                    <span className="mr-2 text-[color:var(--muted)]">[{index + 1}]</span>
                    {evidenceIsAffiliate ? (
                      <TrackableAnchor
                        href={evidenceHref}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        event="affiliate_click"
                        meta={{ page: "comparison_references", tool: tool.name, slug: comparison.slug, locale, slot: "evidence" }}
                        className="do-link"
                      >
                        {evidenceLabel}
                      </TrackableAnchor>
                    ) : (
                      <a href={evidenceHref} target="_blank" rel="noopener noreferrer nofollow" className="do-link">
                        {evidenceLabel}
                      </a>
                    )}
                    <span className="mx-2 text-[color:var(--muted)]">•</span>
                    <TrackableAnchor
                      href={tool.affiliateHref}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      event="affiliate_click"
                      meta={{ page: "comparison_references", tool: tool.name, slug: comparison.slug, locale }}
                      className="do-link"
                    >
                      {fr ? "Lien partenaire" : "Partner link"}
                    </TrackableAnchor>
                  </li>
                );
              })}
            </ol>
          </section>

          <section id="next-steps" className="anchor-offset grid gap-3 md:grid-cols-3">
            <Link href={`/${locale}/resources`} className="btn-secondary text-center">
              {fr ? "Voir ressources" : "See resources"}
            </Link>
            <Link href={`/${locale}/compare`} className="btn-secondary text-center">
              {fr ? "Autres comparatifs" : "Browse more comparisons"}
            </Link>
            <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary text-center">
              {fr ? "Guide etudiant" : "Open student guide"}
            </Link>
          </section>

          <Newsletter locale={locale} source="compare_detail" />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <ArticleToc title={fr ? "Dans cette page" : "On this page"} items={tocItems} className="mt-0" />
          <EditorialTrust locale={locale} compact />
          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {fr ? "Besoin d'un point de depart ?" : "Need a starting point?"}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr
                ? "Commence par la stack recommandee puis optimise apres 7 jours de retour terrain."
                : "Start with the recommended stack, then optimize after 7 days of real usage."}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href={`/${locale}/resources`} className="btn-secondary text-center">
                {fr ? "Stacks recommandees" : "Recommended stacks"}
              </Link>
              <Link href={`/${locale}/blog`} className="btn-secondary text-center">
                {fr ? "Guides blog" : "Blog guides"}
              </Link>
            </div>
          </div>
        </aside>
      </div>
      <BackToTop />
    </article>
  );
}
