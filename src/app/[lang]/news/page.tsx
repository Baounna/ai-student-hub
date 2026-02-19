import type { Metadata } from "next";
import Link from "next/link";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { getAutoNews, getAutoNewsUpdatedAt } from "@/content/auto-news";
import { getLocalizedNews, getNewsTopics, slugifyTopic } from "@/content/news";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { alternateLanguages } from "@/i18n/helpers";

type NewsSearchParams = {
  topic?: string | string[];
};

function formatPublishedDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(date));
}

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  const dict = getDictionary(params.lang);

  return {
    title: dict.news.title,
    description: dict.news.subtitle,
    openGraph: {
      title: dict.news.title,
      description: dict.news.subtitle,
      url: `/${params.lang}/news`,
      type: "website",
      images: [{ url: "/images/post-deploy.svg", width: 1200, height: 675, alt: dict.news.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: dict.news.title,
      description: dict.news.subtitle,
      images: ["/images/post-deploy.svg"]
    },
    alternates: {
      languages: alternateLanguages("/news")
    }
  };
}

export default function LocalizedNewsPage({
  params,
  searchParams
}: {
  params: { lang: string };
  searchParams?: NewsSearchParams;
}) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const dict = getDictionary(locale);
  const allBriefs = getLocalizedNews(locale);
  const autoNews = getAutoNews(locale, 12);
  const autoUpdatedAt = getAutoNewsUpdatedAt();
  const topics = getNewsTopics();

  const topicValue = searchParams?.topic;
  const topicFilter = typeof topicValue === "string" ? topicValue.trim().toLowerCase() : "";

  const filteredBriefs = topicFilter
    ? allBriefs.filter((brief) => slugifyTopic(brief.topic) === topicFilter)
    : allBriefs;

  const featuredBrief = filteredBriefs[0];
  const otherBriefs = filteredBriefs.slice(1);
  const recentSignals = allBriefs.slice(0, 4);
  const pulseHeading = locale === "fr" ? "Tableau de bord hebdomadaire" : "Weekly signal board";
  const streamHeading = locale === "fr" ? "Flux actualite IA/CS" : "AI/CS signal stream";

  return (
    <section className="page-shell max-w-6xl py-10 md:py-16">
      <div className="do-hero overflow-hidden rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{dict.nav.news}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {dict.news.title}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">{dict.news.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {locale === "fr" ? "Briefs actionnables" : "Actionable briefs"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {locale === "fr" ? "Impact etudiant" : "Student impact first"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {allBriefs.length} {locale === "fr" ? "briefs disponibles" : "briefs available"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {autoNews.length} {locale === "fr" ? "updates auto web" : "auto web updates"}
              </span>
            </div>
          </div>

          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{pulseHeading}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>
                {locale === "fr"
                  ? "1. Nouvelles tendances IA transformees en actions etudiantes."
                  : "1. New AI trends translated into student actions."}
              </li>
              <li>
                {locale === "fr"
                  ? "2. Signal impact: portfolio, stages, candidatures."
                  : "2. Impact signal: portfolio, internships, applications."}
              </li>
              <li>
                {locale === "fr"
                  ? "3. Liens directs vers guides, ressources et comparatifs."
                  : "3. Direct links to guides, resources, and comparisons."}
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/blog`} className="btn-secondary">
                {dict.news.openBlog}
              </Link>
              <Link href={`/${locale}/resources`} className="btn-primary">
                {dict.news.openResources}
              </Link>
              <Link href={`/${locale}/news/live`} className="btn-secondary">
                {locale === "fr" ? "Flux live" : "Live stream"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">
          {locale === "fr" ? "Filtrer par theme" : "Filter by topic"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/${locale}/news`}
            className={`rounded-full border px-3 py-1 text-xs ${
              !topicFilter
                ? "border-[color:var(--primary)] bg-[color:var(--bg-soft)]/60 text-[color:var(--text-strong)]"
                : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)]"
            }`}
          >
            {locale === "fr" ? "Tous" : "All"}
          </Link>
          {topics.map((topic) => {
            const slug = slugifyTopic(topic);
            const active = topicFilter === slug;

            return (
              <Link
                key={topic}
                href={`/${locale}/news?topic=${slug}`}
                className={`rounded-full border px-3 py-1 text-xs ${
                  active
                    ? "border-[color:var(--primary)] bg-[color:var(--bg-soft)]/60 text-[color:var(--text-strong)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)]"
                }`}
              >
                {topic}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">{streamHeading}</h2>
          {featuredBrief && (
            <article className="card-hover glass rounded-2xl p-6 md:p-7">
              <p className="do-kicker">{dict.news.latest}</p>
              <h2 className="font-display section-title mt-2 font-bold text-[color:var(--text-strong)]">
                <Link href={`/${locale}/news/${featuredBrief.slug}`} className="hover:opacity-85">
                  {featuredBrief.title}
                </Link>
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]">
                  {featuredBrief.topic}
                </span>
                <time dateTime={featuredBrief.publishedAt} className="text-xs text-[color:var(--muted)]">
                  {formatPublishedDate(featuredBrief.publishedAt, locale)}
                </time>
                <span className="text-xs text-[color:var(--muted)]">{featuredBrief.readTime}</span>
              </div>
              <p className="card-copy mt-4 text-[color:var(--text)]">{featuredBrief.summary}</p>
              <div className="mt-5 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{dict.news.impact}</p>
                <p className="mt-2 text-sm text-[color:var(--text)]">{featuredBrief.studentImpact}</p>
              </div>
              <Link href={`/${locale}/news/${featuredBrief.slug}`} className="btn-primary mt-5 inline-block">
                {dict.news.readBrief}
              </Link>
            </article>
          )}

          {otherBriefs.map((brief) => (
            <article key={brief.slug} className="card-hover glass rounded-2xl p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]">
                  {brief.topic}
                </span>
                <time dateTime={brief.publishedAt} className="text-xs text-[color:var(--muted)]">
                  {formatPublishedDate(brief.publishedAt, locale)}
                </time>
                <span className="text-xs text-[color:var(--muted)]">{brief.readTime}</span>
              </div>
              <h2 className="font-display section-title mt-3 font-semibold text-[color:var(--text-strong)]">
                <Link href={`/${locale}/news/${brief.slug}`} className="hover:opacity-85">
                  {brief.title}
                </Link>
              </h2>
              <p className="card-copy mt-3 text-[color:var(--text)]">{brief.summary}</p>
              <p className="mt-3 text-sm text-[color:var(--muted)]">
                <span className="font-semibold text-[color:var(--text-strong)]">{dict.news.impact}:</span> {brief.studentImpact}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {brief.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs text-[color:var(--text)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <Link href={`/${locale}/news/${brief.slug}`} className="do-link mt-4 inline-block text-sm">
                {dict.news.readBrief}
              </Link>
            </article>
          ))}

          {!filteredBriefs.length && (
            <article className="glass rounded-2xl p-6">
              <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">
                {locale === "fr" ? "Aucun brief trouve" : "No briefs found"}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--text)]">
                {locale === "fr"
                  ? "Essaie un autre theme, ou reviens au flux principal."
                  : "Try another topic, or go back to the full stream."}
              </p>
              <Link href={`/${locale}/news`} className="btn-secondary mt-4 inline-block">
                {locale === "fr" ? "Voir tous les briefs" : "View all briefs"}
              </Link>
            </article>
          )}

          <section className="surface rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">
                {locale === "fr" ? "Agent automatique: nouveautes web AI/CS" : "Automatic agent: latest AI/CS from the web"}
              </h2>
              <Link href={`/${locale}/news/live`} className="btn-secondary">
                {locale === "fr" ? "Flux live complet" : "Open full live stream"}
              </Link>
            </div>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {locale === "fr"
                ? "Ces updates sont publies automatiquement depuis des sources officielles, sans intervention manuelle."
                : "These updates are published automatically from official sources, with no manual intervention."}
            </p>
            {autoUpdatedAt ? (
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                {locale === "fr" ? "Derniere synchronisation" : "Last sync"}: {formatPublishedDate(autoUpdatedAt, locale)}
              </p>
            ) : null}

            {autoNews.length ? (
              <div className="mt-4 grid gap-3">
                {autoNews.map((item, index) => (
                  <article key={`${item.slug}-${index}`} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--bg-soft)]/50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]">
                        {item.topic}
                      </span>
                      <span className="text-xs text-[color:var(--muted)]">{item.source}</span>
                      <span className="text-xs text-[color:var(--muted)]">{formatPublishedDate(item.publishedAt, locale)}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-[color:var(--text-strong)]">{item.title}</h3>
                    <p className="mt-2 text-sm text-[color:var(--text)]">{item.summary}</p>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="do-link mt-3 inline-block text-sm"
                    >
                      {locale === "fr" ? "Lire la source officielle" : "Read official source"}
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <article className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <p className="text-sm text-[color:var(--text)]">
                  {locale === "fr"
                    ? "Aucun item auto pour le moment. L'agent publiera des updates des qu'une source sort du contenu."
                    : "No auto items yet. The agent will publish updates as soon as sources release new content."}
                </p>
              </article>
            )}
          </section>
        </div>

        <aside className="space-y-4 md:sticky md:top-36 md:h-fit">
          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Signaux recents" : "Recent signals"}
            </h3>
            <div className="mt-3 space-y-3">
              {recentSignals.map((signal, index) => (
                <article key={signal.slug} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    #{index + 1} • {signal.topic}
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-[color:var(--text-strong)]">
                    <Link href={`/${locale}/news/${signal.slug}`} className="hover:opacity-85">
                      {signal.title}
                    </Link>
                  </h4>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">{signal.readTime}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">{dict.news.weeklyDigestTitle}</h3>
            <p className="mt-2 text-sm text-[color:var(--text)]">{dict.news.weeklyDigestBody}</p>
          </div>

          <Newsletter compact locale={locale} source="news_aside" />

          <EditorialTrust locale={locale} />

          <div className="glass rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Liens de progression" : "Execution links"}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/${locale}/blog`} className="btn-secondary">
                {dict.news.openBlog}
              </Link>
              <Link href={`/${locale}/resources`} className="btn-secondary">
                {dict.news.openResources}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-primary">
                {dict.news.openCompare}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
