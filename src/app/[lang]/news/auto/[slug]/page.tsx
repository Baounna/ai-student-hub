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
        ? "Les benchmarks influencent directement le choix de modele pour les projets etudiants."
        : "Benchmarks directly influence model selection for student projects.",
      actions: fr
        ? [
            "Choisis un benchmark qui correspond a ton cas d'usage reel.",
            "Ajoute un tableau cout vs qualite dans ton README.",
            "Mets a jour ton stack si une option apporte un meilleur ratio performance/prix."
          ]
        : [
            "Choose a benchmark aligned with your real use case.",
            "Add a cost-vs-quality table in your README.",
            "Update your stack when a better performance/price option appears."
          ],
      nextStep: fr
        ? "Prochaine etape: ecris une comparaison claire avec un tableau cout/qualite."
        : "Next step: write a clear comparison with a cost/quality table."
    },
    "AI Systems": {
      why: fr
        ? "Les nouveautes LLM/agents changent la maniere de construire des apps portfolio."
        : "LLM/agent updates change how portfolio apps should be built.",
      actions: fr
        ? [
            "Transforme la nouveaute en mini demo deployable.",
            "Ajoute une section architecture claire dans ton article.",
            "Mesure latence, cout et qualite pour rester credible."
          ]
        : [
            "Turn the update into a small deployable demo.",
            "Add a clear architecture section in your article.",
            "Measure latency, cost, and quality for credibility."
          ],
      nextStep: fr
        ? "Prochaine etape: publie un mini tutoriel avec architecture + mesure de latence."
        : "Next step: publish a mini tutorial with architecture and latency checks."
    },
    "Computer Systems": {
      why: fr
        ? "Les updates infra/systemes impactent les decisions de deploiement et de cout."
        : "Infra/system updates impact deployment and cost decisions.",
      actions: fr
        ? [
            "Compare les options par vitesse de livraison et budget.",
            "Mets en avant les compromis dans un tableau simple.",
            "Lie vers ta page compare pour capter l'intention forte."
          ]
        : [
            "Compare options by shipping speed and budget.",
            "Highlight tradeoffs in a simple comparison table.",
            "Link to your compare page to capture high intent."
          ],
      nextStep: fr
        ? "Prochaine etape: cree un guide 'quelle option choisir selon ton budget'."
        : "Next step: create a 'which option fits your budget' guide."
    },
    "Computer Science": {
      why: fr
        ? "Les evolutions CS aident a produire des projets plus robustes et differenciants."
        : "CS updates help students produce more robust, differentiated projects.",
      actions: fr
        ? [
            "Ajoute une section 'ce que ca change pour ton projet'.",
            "Relie le sujet a un exemple concret deploye.",
            "Publie un recap court sur LinkedIn avec lien vers ton article."
          ]
        : [
            "Add a 'what this changes for your project' section.",
            "Connect the topic to a concrete deployed example.",
            "Publish a short LinkedIn recap linking back to your article."
          ],
      nextStep: fr
        ? "Prochaine etape: transforme ce sujet en article pedagogique base sur un exemple concret."
        : "Next step: turn this into a teaching article backed by one concrete example."
    }
  };

  return (
    map[topic] ?? {
      why: fr
        ? "Ce signal peut etre transforme en contenu actionnable pour etudiants."
        : "This signal can be turned into actionable student content.",
      actions: fr
        ? [
            "Resumer la nouveaute en langage simple.",
            "Montrer une application pratique immediate.",
            "Ajouter 2 liens utiles vers resources/compare."
          ]
        : [
            "Summarize the update in simple terms.",
            "Show one immediate practical application.",
            "Add 2 useful links to resources/compare."
          ],
      nextStep: fr
        ? "Prochaine etape: relie ce brief a une ressource et a un guide pratique."
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
    { id: "summary", label: fr ? "Resume" : "Summary" },
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
    image: [absoluteUrl("/images/post-deploy.svg")],
    articleSection: item.topic,
    citation: [item.href, item.sourceFeed]
  };

  return (
    <article className="page-shell max-w-6xl py-10 md:py-12">
      <ReadingProgress />
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Breadcrumbs
        items={[
          { label: "AI and Cybersecurity News", href: `/${locale}` },
          { label: dict.nav.news, href: `/${locale}/news` },
          { label: fr ? "Brief auto" : "Auto brief" }
        ]}
      />

      <div className="mb-5">
        <Link href={`/${locale}/news`} className="btn-secondary">
          {fr ? "← Retour aux actualites" : "← Back to news"}
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
                ? "Ce brief est genere automatiquement depuis une source officielle."
                : "This brief is automatically generated from an official source."}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8">
          <section id="summary" className="anchor-offset reading-panel rounded-3xl p-6 md:p-8">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "Resume rapide" : "Fast summary"}
            </h2>
            <p className="mt-3 text-[16px] leading-8 text-[color:var(--text)]">{item.summary}</p>
          </section>

          <section id="impact" className="anchor-offset reading-panel rounded-3xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "Pourquoi ca compte pour etudiants" : "Why this matters for students"}
            </h2>
            <p className="mt-3 text-sm text-[color:var(--text)]">{topicBrief.why}</p>
          </section>

          <section id="actions" className="anchor-offset reading-panel rounded-3xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {fr ? "Actions recommandees" : "Recommended actions"}
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
              {fr ? "Passer a l'execution" : "Move to execution"}
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
