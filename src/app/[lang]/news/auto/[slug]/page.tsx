import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArticleToc } from "@/components/article-toc";
import { BackToTop } from "@/components/back-to-top";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { ReadingProgress } from "@/components/reading-progress";
import { getAutoNews, getAutoNewsBySlug } from "@/content/auto-news";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords, ogImageUrl } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";
import { jsonLd } from "@/lib/json-ld";

function formatPublishedDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(date));
}

function getTopicBrief(topic: string, locale: Locale) {
  const fr = locale === "fr";
  const map: Record<string, { why: string; actions: string[]; nextStep: string }> = {
    "AI Performance": {
      why: fr
        ? "Les benchmarks influencent directement le choix de modèle pour les projets étudiants."
        : "Benchmarks directly influence model selection for student projects.",
      actions: fr
        ? [
            "Choisissez un benchmark qui correspond à votre cas d'usage réel.",
            "Ajoutez un tableau coût vs qualité dans votre README.",
            "Mettez à jour votre stack si une option apporte un meilleur ratio performance/prix."
          ]
        : [
            "Choose a benchmark aligned with your real use case.",
            "Add a cost-vs-quality table in your README.",
            "Update your stack when a better performance/price option appears."
          ],
      nextStep: fr
        ? "Prochaine étape: écrivez une comparaison claire avec un tableau coût/qualité."
        : "Next step: write a clear comparison with a cost/quality table."
    },
    "AI Systems": {
      why: fr
        ? "Les nouveautés LLM/agents changent la manière de construire des apps portfolio."
        : "LLM/agent updates change how portfolio apps should be built.",
      actions: fr
        ? [
            "Transformez la nouveauté en mini démo déployable.",
            "Ajoutez une section architecture claire dans votre article.",
            "Mesurez latence, coût et qualité pour rester crédible."
          ]
        : [
            "Turn the update into a small deployable demo.",
            "Add a clear architecture section in your article.",
            "Measure latency, cost, and quality for credibility."
          ],
      nextStep: fr
        ? "Prochaine étape: publiez un mini tutoriel avec architecture + mesure de latence."
        : "Next step: publish a mini tutorial with architecture and latency checks."
    },
    "Computer Systems": {
      why: fr
        ? "Les updates infra/systèmes impactent les décisions de déploiement et de coût."
        : "Infra/system updates impact deployment and cost decisions.",
      actions: fr
        ? [
            "Comparez les options par vitesse de livraison et budget.",
            "Mettez en avant les compromis dans un tableau simple.",
            "Liez vers votre page compare pour capter l'intention forte."
          ]
        : [
            "Compare options by shipping speed and budget.",
            "Highlight tradeoffs in a simple comparison table.",
            "Link to your compare page to capture high intent."
          ],
      nextStep: fr
        ? "Prochaine étape: créez un guide 'quelle option choisir selon votre budget'."
        : "Next step: create a 'which option fits your budget' guide."
    },
    "Computer Science": {
      why: fr
        ? "Les évolutions CS aident à produire des projets plus robustes et différenciants."
        : "CS updates help students produce more robust, differentiated projects.",
      actions: fr
        ? [
            "Ajoutez une section 'ce que ça change pour votre projet'.",
            "Reliez le sujet à un exemple concret déployé.",
            "Publiez un récap court sur LinkedIn avec lien vers votre article."
          ]
        : [
            "Add a 'what this changes for your project' section.",
            "Connect the topic to a concrete deployed example.",
            "Publish a short LinkedIn recap linking back to your article."
          ],
      nextStep: fr
        ? "Prochaine étape: transformez ce sujet en article pédagogique basé sur un exemple concret."
        : "Next step: turn this into a teaching article backed by one concrete example."
    }
  };

  return (
    map[topic] ?? {
      why: fr
        ? "Ce signal peut être transformé en contenu actionnable pour étudiants."
        : "This signal can be turned into actionable student content.",
      actions: fr
        ? [
            "Résumer la nouveauté en langage simple.",
            "Montrer une application pratique immédiate.",
            "Ajouter 2 liens utiles vers resources/compare."
          ]
        : [
            "Summarize the update in simple terms.",
            "Show one immediate practical application.",
            "Add 2 useful links to resources/compare."
          ],
      nextStep: fr
        ? "Prochaine étape: reliez ce brief à une ressource et à un guide pratique."
        : "Next step: connect this brief to one resource and one practical guide."
    }
  );
}

export function generateStaticParams() {
  // Cap prerender volume so builds stay fast even if the auto-news store grows.
  const slugs = getAutoNews("en", 80).map((item) => item.slug);
  return locales.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export async function generateMetadata(props: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const item = getAutoNewsBySlug(params.slug, params.lang);
  if (!item) return {};

  return {
    title: item.title,
    // Kept out of the index on purpose.
    //
    // These briefs are 480 of the site's 687 URLs, and each carries roughly
    // fifty words of summary quoted from the original source plus a
    // "why this matters" paragraph drawn from a handful of per-topic
    // templates — sample five pages and three are word-for-word identical.
    // That is scraped, near-duplicate content by Google's own description,
    // and a site that is seventy percent of it risks having the whole domain
    // judged on that, which would bury the long-form posts that took real
    // work. A page reprinting AWS's own summary was never going to outrank
    // AWS anyway.
    //
    // follow stays on: the links out to sources and back into the site are
    // genuine and should still count. The /news index remains indexable —
    // the curation there is ours. Undo by deleting this block the day these
    // pages carry original writing.
    robots: { index: false, follow: true },
    description: item.summary,
    keywords: getSeoKeywords(params.lang, "newsPost", [
      item.topic,
      item.source,
      params.lang === "fr" ? "brief auto ia" : "auto ai brief"
    ]),
    openGraph: {
      title: item.title,
      description: item.summary,
      url: `/${params.lang}/news/auto/${params.slug}`,
      type: "article",
      publishedTime: item.publishedAt,
      images: [{ url: ogImageUrl(item.title), width: 1200, height: 630, alt: item.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: item.title,
      description: item.summary,
      images: [ogImageUrl(item.title)]
    },
    alternates: localizedAlternates(`/news/auto/${params.slug}`, params.lang)
  };
}

export default async function AutoNewsDetailPage(props: { params: Promise<{ lang: string; slug: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const nonce = (await headers()).get("x-csp-nonce") || undefined;
  const fr = locale === "fr";
  const dict = getDictionary(locale);
  const item = getAutoNewsBySlug(params.slug, locale);
  if (!item) notFound();

  const topicBrief = getTopicBrief(item.topic, locale);
  const recentSignals = getAutoNews(locale, 5).filter((entry) => entry.slug !== item.slug).slice(0, 3);
  const tocItems = [
    { id: "summary", label: fr ? "Résumé" : "Summary" },
    { id: "impact", label: fr ? "Impact pratique" : "Practical impact" },
    { id: "actions", label: fr ? "Actions" : "Actions" },
    { id: "references", label: "References" },
    { id: "next", label: fr ? "Suite" : "Next steps" },
    { id: "newsletter", label: "Newsletter" }
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    description: item.summary,
    datePublished: item.publishedAt,
    dateModified: item.discoveredAt,
    inLanguage: locale,
    publisher: {
      "@type": "Organization",
      name: "AI and Cybersecurity News",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.svg")
      }
    },
    author: {
      "@type": "Organization",
      name: "AI and Cybersecurity News"
    },
    mainEntityOfPage: absoluteUrl(`/${locale}/news/auto/${item.slug}`),
    image: [absoluteUrl(ogImageUrl(item.title, item.topic))],
    articleSection: item.topic,
    citation: [item.href, item.sourceFeed]
  };

  return (
    <article className="page-shell max-w-6xl py-10 md:py-12">
      <ReadingProgress />
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }} />
      <Breadcrumbs
        locale={locale}
        items={[
          { label: "AI and Cybersecurity News", href: `/${locale}` },
          { label: dict.nav.news, href: `/${locale}/news` },
          { label: fr ? "Brief auto" : "Auto brief" }
        ]}
      />

      <div className="mb-5">
        <Link href={`/${locale}/news`} className="btn-secondary">
          {fr ? "← Retour aux actualités" : "← Back to news"}
        </Link>
      </div>

      <header className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{fr ? "Auto web brief" : "Auto web brief"}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">{item.title}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[color:var(--muted)]">
              <span>{item.topic}</span>
              <span className="hidden h-1 w-1 rounded-full bg-[color:var(--muted)] sm:block" />
              <time dateTime={item.publishedAt}>{formatPublishedDate(item.publishedAt, locale)}</time>
            </div>
          </div>

          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{fr ? "Source principale" : "Primary source"}</p>
            <p className="mt-2 text-sm text-[color:var(--text)]">{item.source}</p>
            <a href={item.href} target="_blank" rel="noopener noreferrer nofollow" className="do-link mt-2 inline-block text-sm">
              {fr ? "Lire l'article original" : "Read original article"}
            </a>
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              {fr
                ? "Ce brief est généré automatiquement depuis une source officielle."
                : "This brief is automatically generated from an official source."}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-8">
          <section id="summary" className="anchor-offset reading-panel rounded-3xl p-6 md:p-8">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "Résumé rapide" : "Fast summary"}
            </h2>
            <p className="mt-3 text-[16px] leading-8 text-[color:var(--text)]">{item.summary}</p>
          </section>

          <section id="impact" className="anchor-offset reading-panel rounded-3xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "Pourquoi ça compte pour étudiants" : "Why this matters for students"}
            </h2>
            <p className="mt-3 text-sm text-[color:var(--text)]">{topicBrief.why}</p>
          </section>

          <section id="actions" className="anchor-offset reading-panel rounded-3xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "Actions recommandées" : "Recommended actions"}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              {topicBrief.actions.map((step) => (
                <li key={step}>- {step}</li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-xs text-[color:var(--muted)]">
              {topicBrief.nextStep}
            </p>
          </section>

          <section id="references" className="anchor-offset reading-panel rounded-3xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">References</h2>
            <ol className="mt-4 space-y-2 text-sm text-[color:var(--text)]">
              <li className="leading-7">
                <span className="mr-2 text-[color:var(--muted)]">[1]</span>
                <a href={item.href} target="_blank" rel="noopener noreferrer nofollow" className="do-link">
                  {item.title}
                </a>
                <span className="ml-2 text-xs text-[color:var(--muted)]">({item.source})</span>
              </li>
              <li className="leading-7">
                <span className="mr-2 text-[color:var(--muted)]">[2]</span>
                <a href={item.sourceFeed} target="_blank" rel="noopener noreferrer nofollow" className="do-link">
                  {fr ? "Flux source" : "Source feed"}
                </a>
              </li>
            </ol>
          </section>

          <section id="next" className="anchor-offset surface rounded-2xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "Passer à l'exécution" : "Move to execution"}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/resources`} className="btn-secondary">
                {fr ? "Resources" : "Resources"}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-primary">
                {fr ? "Compare" : "Compare"}
              </Link>
            </div>
          </section>

          <div id="newsletter" className="anchor-offset">
            <Newsletter locale={locale} source="auto_news_brief" />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <ArticleToc title={fr ? "Dans cette page" : "On this page"} items={tocItems} className="mt-0" />
          <EditorialTrust locale={locale} compact />
          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {fr ? "Autres signaux auto" : "More auto signals"}
            </h3>
            <div className="mt-3 space-y-3">
              {recentSignals.map((signal) => (
                <article key={signal.slug} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                  <p className="text-xs text-[color:var(--muted)]">{signal.topic}</p>
                  <h4 className="mt-1 text-sm font-semibold text-[color:var(--text-strong)]">
                    <Link href={`/${locale}/news/auto/${signal.slug}`} className="hover:opacity-85">
                      {signal.title}
                    </Link>
                  </h4>
                </article>
              ))}
            </div>
          </div>
          <Newsletter compact locale={locale} source="auto_news_brief_aside" />
        </aside>
      </div>
      <BackToTop />
    </article>
  );
}
