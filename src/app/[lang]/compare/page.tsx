import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { AffiliateDisclosureInline } from "@/components/affiliate-disclosure-inline";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { ToolLogo } from "@/components/ui/tool-logo";
import { getAutoTools, getAutoToolsUpdatedAt } from "@/content/auto-tools";
import { comparisons, recommendedTools, studentStudyTools } from "@/content/posts";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";
import { sanitizeSearchQuery } from "@/lib/input";
import { getSeoKeywords, ogImageUrl, coverImageUrl } from "@/lib/seo";
import { isSafeHttpUrl } from "@/lib/url";
import { jsonLd } from "@/lib/json-ld";

function formatPublishedDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(date));
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const fr = params.lang === "fr";
  const title = fr ? "Outils IA + cybersecurite pratiques pour le travail reel" : "Practical AI + Cybersecurity Tools for Real Work";
  const description = fr
    ? "Guides d'outils et comparatifs IA + cybersecurite: budget-friendly, vitesse de deploiement, et impact execution."
    : "Tool guides and comparisons for AI + Cybersecurity projects: budget-friendly options, deployment speed, and execution impact.";

  return {
    title,
    description,
    keywords: getSeoKeywords(params.lang, "compare"),
    openGraph: {
      title,
      description,
      url: `/${params.lang}/compare`,
      type: "website",
      images: [{ url: ogImageUrl(title), width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl(title)]
    },
    alternates: localizedAlternates("/compare", params.lang)
  };
}

type CompareSearchParams = {
  tool?: string | string[];
};

export default async function LocalizedCompareIndexPage(
  props: {
    params: Promise<{ lang: string }>;
    searchParams?: Promise<CompareSearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const nonce = (await headers()).get("x-csp-nonce") || undefined;
  const fr = locale === "fr";
  const playbookTitle = fr ? "Framework de selection" : "Selection framework";
  const toolParam = Array.isArray(searchParams?.tool) ? searchParams?.tool[0] : searchParams?.tool;
  const toolQueryRaw = sanitizeSearchQuery(typeof toolParam === "string" ? toolParam : "", 80);
  const toolQuery = toolQueryRaw.toLowerCase();

  const availableComparisons = comparisons
    .map((comparison) => ({
      ...comparison,
      tools: comparison.tools.filter((tool) => isSafeHttpUrl(tool.affiliateHref))
    }))
    .filter((comparison) => comparison.tools.length > 0);

  const starterComparison = availableComparisons[0];
  const defaultTool = recommendedTools[0];
  const autoTools = getAutoTools(locale, 8).filter((item) => isSafeHttpUrl(item.href));
  const autoToolsUpdatedAt = getAutoToolsUpdatedAt();
  const studyTools = studentStudyTools.filter((tool) => isSafeHttpUrl(tool.href));
  const audienceSegments = fr ? ["Equipes", "Fondateurs", "Chercheurs", "Developpeurs"] : ["Teams", "Founders", "Researchers", "Developers"];
  const filteredStudyTools = toolQuery
    ? studyTools.filter((tool) =>
        [tool.name, tool.category[locale], tool.summary[locale], tool.bestFor[locale], tool.source, ...tool.keywords]
          .join(" ")
          .toLowerCase()
          .includes(toolQuery)
      )
    : studyTools;
  const totalScoredOptions = availableComparisons.reduce((count, comparison) => count + comparison.tools.length, 0);
  const uniqueToolCount = new Set(availableComparisons.flatMap((comparison) => comparison.tools.map((tool) => tool.name))).size;

  const faqItems = fr
    ? [
        {
          q: "Quel guide ouvrir en premier ?",
          a: "Commence par le guide cloud. C'est souvent le blocage principal quand on veut livrer vite un projet concret."
        },
        {
          q: "Combien de temps pour choisir une stack ?",
          a: "Avec ce framework, 20-30 minutes suffisent pour choisir une option puis lancer l'execution."
        },
        {
          q: "Comment eviter d'acheter des outils inutiles ?",
          a: "Fixe une limite budget mensuelle, compare les compromis, puis valide avec un sprint reel de 7 jours."
        }
      ]
    : [
        {
          q: "Which guide should I open first?",
          a: "Start with the cloud guide. It is usually the biggest blocker when builders need to ship quickly."
        },
        {
          q: "How long should stack selection take?",
          a: "With this framework, 20-30 minutes is enough to choose and move into execution."
        },
        {
          q: "How do I avoid buying tools I do not need?",
          a: "Set a monthly cap, compare tradeoffs, then validate with a real 7-day sprint before scaling."
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
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />

      <section className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{fr ? "Tools Lab" : "Tools Lab"}</p>
            <h1 className="font-display tools-hero-title mt-3 font-bold text-[color:var(--text-strong)]">
                {fr
                ? "Outils IA + cybersecurite pratiques pour le travail reel"
                : "Practical AI + Cybersecurity Tools for Real Work"}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">
              {fr
                ? "Un hub d'outils orienté execution: pages a forte intention, grille de decision claire, et liens officiels pour avancer vite avec budget controle."
                : "An execution-first tools hub with high-intent pages, a clear decision model, and official references so you can ship faster without budget drift."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="blog-chip rounded-full px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Sources officielles" : "Official sources"}
              </span>
              <span className="blog-chip rounded-full px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Filtre budget-friendly" : "Budget-friendly filter"}
              </span>
              <span className="blog-chip rounded-full px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Aucun lien remunere" : "No paid links"}
              </span>
              {audienceSegments.map((segment) => (
                <span key={segment} className="blog-chip rounded-full px-3 py-1 text-xs text-[color:var(--muted)]">
                  {segment}
                </span>
              ))}
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

          <div className="blog-aside-card rounded-2xl p-5">
            <p className="do-kicker">{playbookTitle}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>{fr ? "1. Definir le resultat cible (demo, API, portfolio)." : "1. Define your target outcome (demo, API, portfolio)."}</li>
              <li>{fr ? "2. Comparer cout, vitesse, et maintenance." : "2. Compare cost, speed, and maintenance."}</li>
              <li>{fr ? "3. Lancer une execution de 7 jours puis iterer." : "3. Run a 7-day sprint, then iterate."}</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary">
                {fr ? "Guide carriere" : "Career guide"}
              </Link>
              {defaultTool ? (
                <TrackableAnchor
                  href={defaultTool.affiliateHref}
                  target="_blank"
                  rel="noopener noreferrer"
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
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="tools-metric-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--primary)]">{fr ? "Guides actifs" : "Active guides"}</p>
          <p className="mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">{availableComparisons.length}</p>
        </article>
        <article className="tools-metric-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--primary)]">{fr ? "Options evaluees" : "Scored options"}</p>
          <p className="mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">{totalScoredOptions}</p>
        </article>
        <article className="tools-metric-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--primary)]">{fr ? "Stacks uniques" : "Unique stacks"}</p>
          <p className="mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">{uniqueToolCount}</p>
        </article>
        <article className="tools-metric-card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--primary)]">{fr ? "Ressources recommandees" : "Recommended tools"}</p>
          <p className="mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">{recommendedTools.length}</p>
        </article>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8">
          {starterComparison ? (
            <section className="blog-aside-card rounded-2xl p-6">
              <p className="do-kicker">{fr ? "Guide prioritaire" : "Priority guide"}</p>
              <h2 className="font-display section-title mt-2 font-semibold text-[color:var(--text-strong)]">
                {starterComparison.title}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--text)]">{starterComparison.intro}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="blog-chip rounded-full px-2.5 py-1 text-xs text-[color:var(--muted)]">
                  {starterComparison.tools.length} {fr ? "options notees" : "options scored"}
                </span>
                <span className="blog-chip rounded-full px-2.5 py-1 text-xs text-[color:var(--muted)]">
                  {fr ? "Intent SEO fort" : "High-intent keyword"}
                </span>
              </div>
              <Link href={`/${locale}/compare/${starterComparison.slug}`} className="btn-primary mt-4 inline-flex">
                {fr ? "Ouvrir ce guide" : "Open this guide"}
              </Link>
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: fr ? "Etape 1: Contraintes" : "Step 1: Constraints",
                body: fr
                  ? "Definis ton plafond budget, la vitesse de livraison cible, et les exigences minimum."
                  : "Set your budget cap, target shipping speed, and minimum requirements."
              },
              {
                title: fr ? "Etape 2: Evaluation" : "Step 2: Evaluation",
                body: fr
                  ? "Lis les compromis reels par outil: cout, usage ideal, et dette de maintenance."
                  : "Review practical tradeoffs per tool: cost, ideal use case, and maintenance debt."
              },
              {
                title: fr ? "Etape 3: Execution" : "Step 3: Execution",
                body: fr
                  ? "Choisis une option, livre en 7 jours, puis optimise selon tes retours terrain."
                  : "Pick one option, ship in 7 days, then optimize from real usage feedback."
              }
            ].map((step) => (
              <article key={step.title} className="tools-step-card rounded-2xl p-5">
                <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">{step.title}</h2>
                <p className="card-copy mt-2 text-[color:var(--text)]">{step.body}</p>
              </article>
            ))}
          </section>

          <section className="surface rounded-2xl p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="do-kicker">{fr ? "Tools etude" : "Study tools"}</p>
                <h2 className="font-display section-title mt-1 font-semibold text-[color:var(--text-strong)]">
                  {fr
                    ? "Tous les outils utiles pour apprendre, produire, et executer des projets"
                    : "All high-utility tools for learning, projects, and real execution"}
                </h2>
              </div>
              <span className="blog-chip rounded-full px-2.5 py-1 text-xs text-[color:var(--muted)]">
                {filteredStudyTools.length}/{studyTools.length} {fr ? "outils affiches" : "tools shown"}
              </span>
            </div>

            <form action={`/${locale}/compare`} method="get" role="search" className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
              <label htmlFor="study-tool-search" className="sr-only">
                {fr ? "Rechercher un outil pratique" : "Search for a practical tool"}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="study-tool-search"
                  type="search"
                  name="tool"
                  defaultValue={toolQueryRaw}
                  placeholder={
                    fr
                      ? "Rechercher NotebookLM, Antigravity, Anki, Quizlet..."
                      : "Search NotebookLM, Antigravity, Anki, Quizlet..."
                  }
                  className="search-input w-full"
                />
                <button type="submit" className="btn-primary sm:min-w-[110px]">
                  {fr ? "Chercher" : "Search"}
                </button>
                {toolQueryRaw ? (
                  <Link href={`/${locale}/compare`} className="btn-secondary text-center sm:min-w-[110px]">
                    {fr ? "Effacer" : "Clear"}
                  </Link>
                ) : null}
              </div>
            </form>

            {filteredStudyTools.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {filteredStudyTools.map((tool) => (
                  <article key={tool.name} className="card-hover blog-chip rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <ToolLogo
                        src={tool.icon}
                        alt={`${tool.name} logo`}
                        size={44}
                        className="h-11 w-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--primary)]">
                            {tool.category[locale]}
                          </span>
                          <span className="text-xs text-[color:var(--muted)]">{tool.source}</span>
                        </div>
                        <h3 className="mt-2 text-base font-semibold text-[color:var(--text-strong)]">{tool.name}</h3>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-[color:var(--text)]">{tool.summary[locale]}</p>
                    <p className="mt-2 text-xs text-[color:var(--muted)]">{tool.bestFor[locale]}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tool.keywords.slice(0, 4).map((keyword) => (
                        <span key={`${tool.name}-${keyword}`} className="blog-chip rounded-full px-2 py-0.5 text-[11px] text-[color:var(--muted)]">
                          #{keyword}
                        </span>
                      ))}
                    </div>
                    <a
                      href={tool.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary mt-3 inline-flex"
                    >
                      {fr ? "Site officiel" : "Official site"}
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--text)]">
                {fr
                  ? "Aucun outil ne correspond a ta recherche. Essaie NotebookLM, Antigravity, Anki, Notion, ou Quizlet."
                  : "No tools match your search. Try NotebookLM, Antigravity, Anki, Notion, or Quizlet."}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="do-kicker">{fr ? "Guides disponibles" : "Available guides"}</p>
                <h2 className="font-display section-title mt-1 font-semibold text-[color:var(--text-strong)]">
                  {fr ? "Parcours outils IA + cybersecurite" : "AI + Cybersecurity tools decision guides"}
                </h2>
              </div>
              <Link href={`/${locale}/resources`} className="btn-secondary">
                {fr ? "Ouvrir ressources" : "Open resources"}
              </Link>
            </div>

            <div className="space-y-4">
              {availableComparisons.map((comparison, index) => (
                <article key={comparison.slug} className="card-hover blog-stream-card overflow-hidden rounded-2xl p-4 md:p-5">
                  <div className="grid gap-4 md:grid-cols-[230px,1fr] md:items-start">
                    <div className="media-frame group relative aspect-[16/10]">
                      <Image
                        src={coverImageUrl("compare-index", "Cloud/DevOps")}
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
                      <h3 className="font-display section-title mt-2 font-semibold text-[color:var(--text-strong)]">{comparison.title}</h3>
                      <p className="card-copy mt-3 text-[color:var(--text)]">{comparison.intro}</p>
                      <p className="mt-2 text-xs text-[color:var(--muted)]">
                        {comparison.tools.length} {fr ? "outils evalues" : "tools scored in this guide"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {comparison.tools.slice(0, 3).map((tool) => (
                          <span
                            key={`${comparison.slug}-${tool.name}`}
                            className="blog-chip rounded-full px-2.5 py-1 text-[11px] text-[color:var(--muted)]"
                          >
                            {tool.name}
                          </span>
                        ))}
                      </div>
                      <Link href={`/${locale}/compare/${comparison.slug}`} className="btn-primary mt-4 inline-block">
                        {fr ? "Ouvrir le guide" : "Open guide"}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="surface rounded-2xl p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="do-kicker">{fr ? "Automation outils" : "Tools automation"}</p>
                <h2 className="font-display section-title mt-1 font-semibold text-[color:var(--text-strong)]">
                  {fr ? "Nouveautes outils depuis les sources officielles" : "New tools from official release channels"}
                </h2>
              </div>
              {autoToolsUpdatedAt ? (
                <p className="text-xs text-[color:var(--muted)]">
                  {fr ? "Derniere synchro" : "Last sync"}: {formatPublishedDate(autoToolsUpdatedAt, locale)}
                </p>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr
                ? "NotebookLM, plateformes cloud, outils dev et updates CS: le flux agent ajoute les nouveautes automatiquement."
                : "NotebookLM, cloud platforms, dev tooling, and CS updates: the agent adds new releases automatically."}
            </p>

            {autoTools.length ? (
              <div className="mt-4 space-y-3">
                {autoTools.map((item) => (
                  <article key={item.slug} className="blog-chip rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--primary)]">
                        {item.category}
                      </span>
                      <span className="text-xs text-[color:var(--muted)]">{item.toolName}</span>
                      <span className="text-xs text-[color:var(--muted)]">
                        {formatPublishedDate(item.publishedAt, locale)}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-[color:var(--text-strong)]">{item.title}</h3>
                    <p className="mt-2 text-sm text-[color:var(--text)]">{item.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span className="text-[color:var(--muted)]">
                        {fr ? "Source" : "Source"}: {item.source}
                      </span>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="do-link text-sm font-semibold"
                      >
                        {fr ? "Lien officiel" : "Official release"}
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <p className="text-sm text-[color:var(--text)]">
                  {fr
                    ? "Aucune nouveaute captee pour le moment. L'agent continue la veille et publie automatiquement quand une release officielle apparait."
                    : "No new tools captured yet. The agent keeps monitoring and auto-publishes when an official release appears."}
                </p>
              </div>
            )}
          </section>

          <section className="blog-aside-card rounded-2xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "Modele d'evaluation" : "Evaluation model"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr
                ? "Chaque guide suit le meme cadre: vitesse de mise en ligne, predictibilite budgetaire, valeur portfolio, et courbe d'apprentissage."
                : "Each guide follows the same model: time-to-deploy, budget predictability, portfolio value, and learning curve."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/resources`} className="btn-secondary">
                {fr ? "Voir ressources" : "See recommended tools"}
              </Link>
              <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary">
                {fr ? "Guide carriere" : "Open the career guide"}
              </Link>
            </div>
            <AffiliateDisclosureInline locale={locale} className="mt-4 text-xs text-[color:var(--muted)]" />
          </section>

          <section className="reading-panel rounded-2xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "FAQ outils" : "Tools FAQ"}
            </h2>
            <div className="mt-4 space-y-3">
              {faqItems.map((item) => (
                <article key={item.q} className="blog-chip rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-[color:var(--text-strong)]">{item.q}</h3>
                  <p className="mt-2 text-sm text-[color:var(--text)]">{item.a}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <EditorialTrust locale={locale} compact />
          <div className="blog-aside-card rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {fr ? "Actions rapides" : "Quick actions"}
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              <Link href={`/${locale}/resources`} className="btn-secondary text-center">
                {fr ? "Ressources" : "Resources"}
              </Link>
              <Link href={`/${locale}/blog`} className="btn-secondary text-center">
                {fr ? "Guides blog" : "Blog guides"}
              </Link>
              <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary text-center">
                {fr ? "Guide carriere" : "Career guide"}
              </Link>
            </div>
          </div>
          <Newsletter compact locale={locale} source="tools_page" />
        </aside>
      </div>
    </div>
  );
}
