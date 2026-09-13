import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArticleToc } from "@/components/article-toc";
import { BackToTop } from "@/components/back-to-top";
import { EditorialTrust } from "@/components/editorial-trust";
import { LatestUpdatesBlock } from "@/components/latest-updates-block";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Newsletter } from "@/components/newsletter";
import { ReadingProgress } from "@/components/reading-progress";
import { getNewsBySlug, getLocalizedNews, getNewsTrack } from "@/content/news";
import { getLocalizedPost, slugify } from "@/content/posts";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";

function formatPublishedDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(date));
}

function getTopicReference(topic: string, locale: Locale) {
  const map: Record<string, { label: string; href: string; source: string }> = {
    "AI Systems": {
      label: locale === "fr" ? "Cadre de gestion du risque IA (NIST)" : "NIST AI Risk Management Framework",
      href: "https://www.nist.gov/itl/ai-risk-management-framework",
      source: "NIST"
    },
    "AI Research": {
      label: locale === "fr" ? "Publications Google Research" : "Google Research publications",
      href: "https://research.google/pubs/",
      source: "Google Research"
    },
    "ML Engineering": {
      label: locale === "fr" ? "Guide MLOps Google Cloud" : "Google Cloud MLOps guide",
      href: "https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning",
      source: "Google Cloud"
    },
    "Computer Systems": {
      label: locale === "fr" ? "NVIDIA Edge Computing" : "NVIDIA Edge Computing",
      href: "https://developer.nvidia.com/edge-computing",
      source: "NVIDIA"
    },
    "Cloud/DevOps": {
      label: locale === "fr" ? "Documentation Kubernetes" : "Kubernetes documentation",
      href: "https://kubernetes.io/docs/home/",
      source: "Kubernetes"
    },
    "Systems & Backend": {
      label: locale === "fr" ? "Documentation OpenTelemetry" : "OpenTelemetry documentation",
      href: "https://opentelemetry.io/docs/",
      source: "OpenTelemetry"
    },
    "Security & Performance": {
      label: locale === "fr" ? "OWASP API Security Top 10" : "OWASP API Security Top 10",
      href: "https://owasp.org/API-Security/",
      source: "OWASP"
    },
    MLOps: {
      label: locale === "fr" ? "MLOps Community" : "MLOps Community",
      href: "https://ml-ops.org/",
      source: "MLOps Community"
    },
    Career: {
      label: locale === "fr" ? "Programmes de stage (DOL)" : "Internship programs (U.S. DOL)",
      href: "https://www.dol.gov/agencies/whd/fact-sheets/71-flsa-internships",
      source: "U.S. Department of Labor"
    },
    "AI Performance": {
      label: locale === "fr" ? "Table benchmarks GPT-5 (OpenAI, aout 2025)" : "OpenAI GPT-5 benchmark table (August 2025)",
      href: "https://openai.com/index/introducing-gpt-5-for-developers/",
      source: "OpenAI"
    }
  };

  return (
    map[topic] ?? {
      label: locale === "fr" ? "Curricula informatique (ACM)" : "ACM computing curricula",
      href: "https://www.acm.org/education/curricula-recommendations",
      source: "ACM"
    }
  );
}

export function generateStaticParams() {
  return locales.flatMap((lang) => getLocalizedNews(lang).map((brief) => ({ lang, slug: brief.slug })));
}

export async function generateMetadata(props: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const brief = getNewsBySlug(params.slug, params.lang);
  if (!brief) return {};

  return {
    title: brief.title,
    description: brief.summary,
    keywords: getSeoKeywords(params.lang, "newsPost", brief.keywords),
    openGraph: {
      title: brief.title,
      description: brief.summary,
      url: `/${params.lang}/news/${params.slug}`,
      type: "article",
      publishedTime: brief.publishedAt,
      images: [{ url: "/images/post-deploy.svg", width: 1200, height: 675, alt: brief.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: brief.title,
      description: brief.summary,
      images: ["/images/post-deploy.svg"]
    },
    alternates: localizedAlternates(`/news/${params.slug}`, params.lang)
  };
}

export default async function LocalizedNewsArticlePage(props: { params: Promise<{ lang: string; slug: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const nonce = (await headers()).get("x-csp-nonce") || undefined;
  const dict = getDictionary(locale);
  const brief = getNewsBySlug(params.slug, locale);

  if (!brief) notFound();

  const relatedPosts = brief.relatedPostSlugs
    .map((slug) => getLocalizedPost(slug, locale))
    .filter((post): post is NonNullable<typeof post> => Boolean(post));
  const newsTrack = getNewsTrack(brief.topic);
  const crossImpact =
    newsTrack === "cs"
      ? locale === "fr"
        ? "Impact CS: architecture backend, fiabilite systeme, et performance deploiement."
        : "CS impact: backend architecture, system reliability, and deployment performance."
      : newsTrack === "ai"
        ? locale === "fr"
          ? "Impact IA: choix modele, evaluation, et workflow experimentation."
          : "AI impact: model selection, evaluation quality, and experimentation workflow."
        : locale === "fr"
          ? "Impact carriere: portfolio, candidatures, et storytelling entretien."
          : "Career impact: portfolio signal, applications, and interview storytelling.";
  const recentSignals = getLocalizedNews(locale).filter((item) => item.slug !== brief.slug).slice(0, 3);
  const topicReference = getTopicReference(brief.topic, locale);
  const references = [
    {
      label: brief.source.name,
      href: brief.source.href,
      source: locale === "fr" ? "Source principale" : "Primary source"
    },
    {
      label: topicReference.label,
      href: topicReference.href,
      source: topicReference.source
    }
  ];
  const tocItems = [
    { id: "summary", label: locale === "fr" ? "Resume" : "Summary" },
    { id: "latest-updates", label: locale === "fr" ? "Dernieres actus" : "Latest updates" },
    ...(brief.statsByTheme?.length ? [{ id: "performance", label: locale === "fr" ? "Stats par theme" : "Theme stats" }] : []),
    { id: "references", label: "References" },
    { id: "resources", label: locale === "fr" ? "Ressources" : "Resources" },
    ...(relatedPosts.length ? [{ id: "related", label: locale === "fr" ? "Lectures" : "Deep dives" }] : []),
    { id: "newsletter", label: "Newsletter" }
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: brief.title,
    description: brief.summary,
    datePublished: brief.publishedAt,
    dateModified: brief.publishedAt,
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
    mainEntityOfPage: absoluteUrl(`/${locale}/news/${brief.slug}`),
    image: [absoluteUrl("/images/post-deploy.svg")],
    keywords: brief.keywords.join(", "),
    about: brief.topic
  };

  return (
    <article className="page-shell max-w-6xl py-10 md:py-12">
      <ReadingProgress />
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Breadcrumbs
        items={[
          { label: "AI and Cybersecurity News", href: `/${locale}` },
          { label: dict.nav.news, href: `/${locale}/news` },
          { label: brief.title }
        ]}
      />

      <div className="mb-5">
        <Link href={`/${locale}/news`} className="btn-secondary">
          {locale === "fr" ? "← Retour aux actualites" : "← Back to news"}
        </Link>
      </div>

      <header className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{brief.topic}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {brief.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[color:var(--muted)]">
              <time dateTime={brief.publishedAt}>{formatPublishedDate(brief.publishedAt, locale)}</time>
              <span className="hidden h-1 w-1 rounded-full bg-[color:var(--muted)] sm:block" />
              <span>{brief.readTime}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {brief.tags.slice(0, 4).map((tag) => (
                <Link
                  key={tag}
                  href={`/${locale}/blog/tag/${slugify(tag)}`}
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs text-[color:var(--text)]"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{locale === "fr" ? "Brief en bref" : "Brief at a glance"}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>{locale === "fr" ? `1. Theme: ${brief.topic}` : `1. Topic: ${brief.topic}`}</li>
              <li>{locale === "fr" ? "2. Sources: 2 references croisees." : "2. Sources: 2 cross-checked references."}</li>
              <li>{locale === "fr" ? `3. Temps de lecture: ${brief.readTime}.` : `3. Reading time: ${brief.readTime}.`}</li>
              {brief.statsByTheme?.length ? (
                <li>{`4. ${brief.statsByTheme.length} benchmark themes covered.`}</li>
              ) : null}
            </ul>
            <p className="mt-3 text-sm text-[color:var(--text)]">{brief.studentImpact}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/resources`} className="btn-secondary">
                {dict.news.openResources}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-primary">
                {dict.news.openCompare}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8">
          <section id="summary" className="anchor-offset reading-panel rounded-3xl p-6 md:p-8">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Ce qui change" : "What changed"}
            </h2>
            <p className="mt-3 text-[16px] leading-8 text-[color:var(--text)]">
              {brief.summary}{" "}
              <a href="#reference-1" className="inline-citation">
                [1]
              </a>
            </p>

            <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-soft)]/45 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">{dict.news.impact}</p>
              <p className="card-copy mt-2 text-[color:var(--text)]">
                {brief.studentImpact}{" "}
                <a href="#reference-2" className="inline-citation">
                  [2]
                </a>
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{crossImpact}</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                <h3 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
                  {locale === "fr" ? "Takeaways cles" : "Key takeaways"}
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
                  {brief.takeaways.map((takeaway) => (
                    <li key={takeaway}>- {takeaway}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                <h3 className="font-display section-title font-semibold text-[color:var(--text-strong)]">{dict.news.actions}</h3>
                <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
                  {brief.actionSteps.map((step) => (
                    <li key={step}>- {step}</li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">{dict.news.source}</p>
              <a
                href={brief.source.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="do-link mt-2 inline-block text-sm"
              >
                {brief.source.name}
              </a>
            </div>
          </section>

          <div id="latest-updates" className="anchor-offset">
            <LatestUpdatesBlock locale={locale} limit={6} />
          </div>

          {brief.statsByTheme?.length ? (
            <section id="performance" className="anchor-offset reading-panel rounded-3xl p-6">
              <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
                {locale === "fr" ? "Performance IA par theme" : "AI performance by theme"}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--text)]">
                {locale === "fr"
                  ? "Snapshot base sur des tableaux benchmarks officiels publies en fevrier 2026."
                  : "Snapshot based on official benchmark tables published in February 2026."}{" "}
                <a href="#reference-1" className="inline-citation">
                  [1]
                </a>{" "}
                <a href="#reference-2" className="inline-citation">
                  [2]
                </a>
              </p>
              <div className="mt-4 space-y-4">
                {brief.statsByTheme.map((row) => (
                  <article key={row.benchmark} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">
                          {row.theme[locale]}
                        </p>
                        <h3 className="mt-1 text-sm font-semibold text-[color:var(--text-strong)]">{row.benchmark}</h3>
                      </div>
                      <p className="text-xs text-[color:var(--muted)]">{row.snapshot[locale]}</p>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      {row.stats.map((stat) => (
                        <div
                          key={`${row.benchmark}-${stat.model}`}
                          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-soft)]/40 p-3"
                        >
                          <p className="text-xs text-[color:var(--muted)]">{stat.model}</p>
                          <p className="mt-1 text-base font-semibold text-[color:var(--text-strong)]">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section id="references" className="anchor-offset reading-panel rounded-3xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "References et sources" : "References and sources"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {locale === "fr"
                ? "Chaque brief s'appuie sur une source principale + une reference technique complementaire."
                : "Each brief is grounded in a primary source plus one supporting technical reference."}
            </p>
            <ol className="mt-4 space-y-2 text-sm text-[color:var(--text)]">
              {references.map((reference, index) => (
                <li key={`${reference.href}-${index}`} id={`reference-${index + 1}`} className="leading-7">
                  <span className="mr-2 text-[color:var(--muted)]">[{index + 1}]</span>
                  <a href={reference.href} target="_blank" rel="noopener noreferrer nofollow" className="do-link">
                    {reference.label}
                  </a>
                  <span className="ml-2 text-xs text-[color:var(--muted)]">({reference.source})</span>
                </li>
              ))}
            </ol>
          </section>

          <section id="resources" className="anchor-offset surface rounded-2xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Ressources liees" : "Related resources"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {locale === "fr"
                ? "Passe de l'actualite a l'execution avec ces pages a fort ROI."
                : "Move from news to execution with these high-ROI pages."}
            </p>
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              {locale === "fr"
                ? "Chemin recommande: News -> Blog -> Lab outils -> Roadmap execution."
                : "Recommended path: News -> Blog -> Tools lab -> Execution roadmap."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/resources`} className="btn-secondary">
                {dict.news.openResources}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-primary">
                {dict.news.openCompare}
              </Link>
              <Link href={`/${locale}/blog`} className="btn-secondary">
                {dict.news.openBlog}
              </Link>
              <Link href={`/${locale}/product/ai-career-guide`} className="btn-secondary">
                {locale === "fr" ? "Roadmap execution" : "Execution roadmap"}
              </Link>
            </div>
          </section>

          {!!relatedPosts.length && (
            <section id="related" className="anchor-offset">
              <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
                {locale === "fr" ? "Lectures approfondies" : "Deep dives"}
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {relatedPosts.map((post) => (
                  <article key={post.slug} className="card-hover glass rounded-2xl p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{post.category}</p>
                    <h3 className="font-display mt-2 text-lg font-semibold text-[color:var(--text-strong)]">{post.title}</h3>
                    <p className="mt-2 text-sm text-[color:var(--text)]">{post.excerpt}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.slice(0, 2).map((tag) => (
                        <Link
                          key={tag}
                          href={`/${locale}/blog/tag/${slugify(tag)}`}
                          className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs text-[color:var(--text)]"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                    <Link href={`/${locale}/blog/${post.slug}`} className="do-link mt-3 inline-block text-sm">
                      {locale === "fr" ? "Lire l'analyse" : "Read analysis"}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div id="newsletter" className="anchor-offset">
            <Newsletter locale={locale} source="news_article_main" />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <ArticleToc title={locale === "fr" ? "Dans cette page" : "On this page"} items={tocItems} className="mt-0" />
          <EditorialTrust locale={locale} compact />
          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Signaux recents" : "Recent signals"}
            </h3>
            <div className="mt-3 space-y-3">
              {recentSignals.map((signal) => (
                <article key={signal.slug} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                  <p className="text-xs text-[color:var(--muted)]">{signal.topic}</p>
                  <h4 className="mt-1 text-sm font-semibold text-[color:var(--text-strong)]">
                    <Link href={`/${locale}/news/${signal.slug}`} className="hover:opacity-85">
                      {signal.title}
                    </Link>
                  </h4>
                </article>
              ))}
            </div>
          </div>
          <Newsletter compact locale={locale} source="news_article_aside" />
        </aside>
      </div>
      <BackToTop />
    </article>
  );
}
