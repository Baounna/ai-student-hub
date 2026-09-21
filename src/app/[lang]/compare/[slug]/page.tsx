import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateDisclosureInline } from "@/components/affiliate-disclosure-inline";
import { ArticleToc } from "@/components/article-toc";
import { BackToTop } from "@/components/back-to-top";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { ReadingProgress } from "@/components/reading-progress";
import { StickyToolsCta } from "@/components/sticky-tools-cta";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { comparisons, getLocalizedComparison } from "@/content/posts";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords, ogImageUrl, coverImageUrl } from "@/lib/seo";
import { isSafeHttpUrl } from "@/lib/url";

/**
 * Only three of the nine tools had an entry here, so the other six fell through
 * to the affiliate URL — and that URL is not always the tool's own site. The
 * "GitHub Actions + Docker" row points at coursera.org, "Node.js + NestJS" at
 * render.com and "Go + Fiber" at railway.com. With the fallback labelled
 * "Official site", the page was telling a reader that Coursera is the official
 * home of GitHub Actions.
 *
 * Every tool now has its real documentation or pricing page, each one checked
 * for a 200 before being written down.
 */
const EVIDENCE_SOURCES: Record<string, { en: string; fr: string; href: string }> = {
  DigitalOcean: { en: "DigitalOcean docs + pricing", fr: "Documentation + prix DigitalOcean", href: "https://www.digitalocean.com/pricing" },
  Render: { en: "Render docs + pricing", fr: "Documentation + prix Render", href: "https://render.com/pricing" },
  Railway: { en: "Railway docs + pricing", fr: "Documentation + prix Railway", href: "https://railway.com/pricing" },
  FastAPI: { en: "FastAPI documentation", fr: "Documentation FastAPI", href: "https://fastapi.tiangolo.com/" },
  "Node.js + NestJS": { en: "NestJS documentation", fr: "Documentation NestJS", href: "https://docs.nestjs.com/" },
  "Go + Fiber": { en: "Fiber documentation", fr: "Documentation Fiber", href: "https://docs.gofiber.io/" },
  "GitHub Actions + Docker": { en: "GitHub Actions documentation", fr: "Documentation GitHub Actions", href: "https://docs.github.com/en/actions" },
  "Render Blueprints": { en: "Render infrastructure-as-code docs", fr: "Documentation infrastructure-as-code Render", href: "https://render.com/docs/infrastructure-as-code" },
  "Railway Templates": { en: "Railway templates documentation", fr: "Documentation templates Railway", href: "https://docs.railway.com/reference/templates" }
};

function getEvidenceSource(toolName: string, locale: Locale) {
  const source = EVIDENCE_SOURCES[toolName];
  if (!source) return null;
  return { label: locale === "fr" ? source.fr : source.en, href: source.href };
}

export function generateStaticParams() {
  return locales.flatMap((lang) => comparisons.map((comparison) => ({ lang, slug: comparison.slug })));
}

export async function generateMetadata(props: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const comparison = getLocalizedComparison(params.slug, params.lang);

  if (!comparison) {
    return { title: "Tools Guide Not Found" };
  }

  const fr = params.lang === "fr";
  const title = comparison.title;
  // seoTitle replaces the whole <title>, section suffix included, because the
  // suffix is 14 characters of the same budget. comparison.title still drives
  // the H1, the OG card title and the OG image text below.
  const metadataTitle = comparison.seoTitle || title;
  const description = fr ? `Guide outils étudiant: ${comparison.intro}` : comparison.intro;

  return {
    title: metadataTitle,
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
      images: [{ url: ogImageUrl(comparison.title), width: 1200, height: 630, alt: comparison.title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl(comparison.title)]
    },
    alternates: localizedAlternates(`/compare/${params.slug}`, params.lang)
  };
}

export default async function LocalizedComparisonPage(props: { params: Promise<{ lang: string; slug: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";
  const comparison = getLocalizedComparison(params.slug, locale);

  if (!comparison) notFound();

  const safeTools = comparison.tools.filter((tool) => isSafeHttpUrl(tool.affiliateHref));
  const recommendedTool = safeTools[0];
  const recommendedLabel = recommendedTool?.name || (fr ? "Aucune option active" : "No active option");

  const tocItems = [
    { id: "verdict", label: fr ? "Verdict" : "Verdict" },
    { id: "comparison-table", label: fr ? "Matrice outils" : "Tools matrix" },
    { id: "framework", label: fr ? "Cadre" : "Framework" },
    { id: "references", label: fr ? "Références" : "References" },
    { id: "next-steps", label: fr ? "Actions" : "Next steps" }
  ];

  return (
    <article className="page-shell max-w-6xl py-10 md:py-16">
      <ReadingProgress />

      <div className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{fr ? "Guide outils" : "Tools guide"}</p>
            <h1 className="font-display tools-hero-title mt-3 font-bold text-[color:var(--text-strong)]">{comparison.title}</h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">{comparison.intro}</p>
            <p className="mt-4 text-sm text-[color:var(--muted)]">
              {fr
                ? `${safeTools.length} options comparées selon budget, vitesse de shipping, et valeur portfolio.`
                : `${safeTools.length} options scored by budget, shipping speed, and portfolio signal.`}
            </p>
          </div>

          <div className="blog-aside-card rounded-2xl p-5">
            <p className="do-kicker">{fr ? "Choix par défaut" : "Default choice"}</p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--text-strong)]">{recommendedLabel}</p>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr
                ? "Option conseillée pour livrer vite sans surprise budgétaire majeure."
                : "Recommended when you need speed-to-ship with predictable monthly spend."}
            </p>
            {recommendedTool ? (
              <TrackableAnchor
                href={recommendedTool.affiliateHref}
                target="_blank"
                rel="noopener noreferrer"
                event="affiliate_click"
                meta={{ page: "comparison_hero", tool: recommendedTool.name, slug: comparison.slug, locale }}
                className="btn-primary mt-4 inline-block"
              >
                {fr ? "Tester cet outil" : "Try this tool"}
              </TrackableAnchor>
            ) : (
              <Link href={`/${locale}/resources`} className="btn-secondary mt-4 inline-block">
                {fr ? "Voir ressources" : "Open resources"}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8">
          <div className="media-frame group relative aspect-[16/10] rounded-2xl">
            <Image
              src={coverImageUrl(params.slug, "Cloud/DevOps")}
              alt={comparison.title}
              width={1200}
              height={675}
              priority
              sizes="(max-width: 1024px) 100vw, 900px"
              className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
          </div>

          <section id="verdict" className="anchor-offset blog-aside-card rounded-2xl p-6">
            <p className="do-kicker">{fr ? "Verdict rapide" : "Quick verdict"}</p>
            <h2 className="font-display section-title mt-2 font-semibold text-[color:var(--text-strong)]">
              {fr ? "Option recommandée" : "Recommended default"}: {recommendedLabel}
            </h2>
            <p className="card-copy mt-2 text-[color:var(--text)]">
              {fr
                ? `${recommendedLabel} ressort en tête selon le meilleur compromis entre vitesse de delivery, maîtrise budget, et valeur portfolio.`
                : `${recommendedLabel} ranks first based on practical balance across delivery speed, budget control, and portfolio value.`}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <article className="tools-metric-card rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {fr ? "Vitesse de delivery" : "Time-to-deploy"}
                </p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--text-strong)]">40%</p>
              </article>
              <article className="tools-metric-card rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {fr ? "Contrôle budget" : "Budget control"}
                </p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--text-strong)]">35%</p>
              </article>
              <article className="tools-metric-card rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {fr ? "Signal portfolio" : "Portfolio signal"}
                </p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--text-strong)]">25%</p>
              </article>
            </div>
          </section>

          {safeTools.length ? (
            <section
              id="comparison-table"
              className="anchor-offset overflow-x-auto rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[0_18px_30px_-30px_rgba(8,24,54,0.72)]"
            >
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-[color:var(--bg-soft)]/60 text-[color:var(--text)]">
                  <tr>
                    <th className="px-4 py-3">{fr ? "Outil" : "Tool"}</th>
                    <th className="px-4 py-3">{fr ? "Prix" : "Price"}</th>
                    <th className="px-4 py-3">{fr ? "Idéal pour" : "Best for"}</th>
                    <th className="px-4 py-3">{fr ? "Action" : "Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  {safeTools.map((tool, index) => (
                    <tr
                      key={tool.name}
                      className="border-t border-[color:var(--border)] transition hover:bg-[color:var(--bg-soft)]/20"
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[color:var(--text-strong)]">{tool.name}</p>
                          {index === 0 ? (
                            <span className="rounded-full border border-[color:var(--primary)]/45 bg-[color:var(--bg-soft)]/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-strong)]">
                              {fr ? "Recommandé" : "Recommended"}
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
                          rel="noopener noreferrer"
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
          ) : (
            <section
              id="comparison-table"
              className="anchor-offset blog-aside-card rounded-2xl p-5"
            >
              <p className="text-sm text-[color:var(--text)]">
                {fr
                  ? "Aucun lien outil actif pour ce guide. Utilisez la page resources pour les options disponibles."
                  : "No active tool links are available for this guide. Use the resources page for available options."}
              </p>
            </section>
          )}

          <section id="framework" className="anchor-offset blog-aside-card rounded-2xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "Cadre de décision" : "Decision framework"}
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--text)]">
              <li>1. {fr ? "Priorisez la vitesse de mise en ligne, pas la liste de features." : "Prioritize time-to-deploy over feature lists."}</li>
              <li>2. {fr ? "Fixez une limite de dépense mensuelle claire." : "Set a strict monthly spending cap."}</li>
              <li>3. {fr ? "Choisissez l'option qui facilite le shipping portfolio." : "Pick the option that removes shipping friction."}</li>
            </ul>
            <AffiliateDisclosureInline locale={locale} className="mt-4 text-xs text-[color:var(--muted)]" />
          </section>

          <section id="references" className="anchor-offset reading-panel rounded-2xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "Références et transparence" : "References and transparency"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr
                ? "Les recommandations s'appuient sur les pages officielles de documentation/prix et l'usage pratique étudiant."
                : "Recommendations are based on official pricing/docs pages plus practical student usage."}
            </p>
            <ol className="mt-4 space-y-2 text-sm text-[color:var(--text)]">
              {safeTools.map((tool, index) => {
                // Every tool has a real source now, so nothing falls through
                // to an affiliate URL wearing the word "official".
                const evidence = getEvidenceSource(tool.name, locale);

                return (
                  <li key={`${tool.name}-${index}`} className="leading-7">
                    <span className="mr-2 text-[color:var(--muted)]">[{index + 1}]</span>
                    <span className="mr-2 font-medium text-[color:var(--text-strong)]">{tool.name}</span>
                    {evidence ? (
                      <a href={evidence.href} target="_blank" rel="noopener noreferrer nofollow" className="do-link">
                        {evidence.label}
                      </a>
                    ) : null}
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
              {fr ? "Autres guides outils" : "More tools guides"}
            </Link>
            <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary text-center">
              {fr ? "Guide étudiant" : "Open student guide"}
            </Link>
          </section>

          <Newsletter locale={locale} source="tools_page_detail" />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <ArticleToc title={fr ? "Dans cette page" : "On this page"} items={tocItems} className="mt-0" />
          <EditorialTrust locale={locale} compact />
          <div className="blog-aside-card rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {fr ? "Besoin d'un point de départ ?" : "Need a starting point?"}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr
                ? "Commencez par l'option recommandée puis optimisez après 7 jours de retour terrain."
                : "Start with the recommended option, then optimize after 7 days of real usage."}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href={`/${locale}/resources`} className="btn-secondary text-center">
                {fr ? "Stacks recommandées" : "Recommended stacks"}
              </Link>
              <Link href={`/${locale}/blog`} className="btn-secondary text-center">
                {fr ? "Guides blog" : "Blog guides"}
              </Link>
            </div>
          </div>
        </aside>
      </div>
      <BackToTop />
      <StickyToolsCta locale={locale} source="tools_detail" />
    </article>
  );
}
