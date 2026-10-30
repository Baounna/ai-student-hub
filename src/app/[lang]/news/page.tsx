import type { Metadata } from "next";
import { Suspense } from "react";
import { tagLabel } from "@/lib/tags";
import Image from "next/image";
import Link from "next/link";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { getAutoNews, getAutoNewsUpdatedAt } from "@/content/auto-news";
import { getLocalizedNews, getNewsTopics, getNewsTrack, getNewsTrackCounts, slugifyTopic, topicLabel, type NewsTrack } from "@/content/news";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates, openGraphDefaults } from "@/i18n/helpers";
import { getLiveAiCsUpdates } from "@/lib/live-news";
import { getSeoKeywords, ogImageUrl, coverImageUrl } from "@/lib/seo";
import { formatReadTime } from "@/lib/read-time";
import { Provenance } from "@/components/provenance";
import { getGuideCtaHref, getGuideCtaLabel } from "@/lib/product";

/*
 * There is no `export const revalidate` here any more, and that is not an
 * omission.
 *
 * It said 1800, it read like the thing that kept this page half an hour fresh,
 * and it did nothing at all: the root layout reads headers() for the CSP nonce,
 * which makes every page in the tree render per request. Measured on this URL
 * with the exported value still in place -- Cache-Control came back as
 * `private, no-cache, no-store, max-age=0, must-revalidate`, which is the
 * opposite of a 30-minute window.
 *
 * The thirty minutes that do exist are the `next: { revalidate: 60 * 30 }` on
 * each feed fetch in src/lib/live-news.ts, and those keep working whatever this
 * segment does -- the data cache is not the route cache. Next also infers a
 * segment's revalidate from the fetches inside it, so should the layout ever
 * stop calling headers(), this page lands on the same 1800 by itself rather
 * than freezing. Keeping the line would have meant keeping a number that
 * described a cache nobody had.
 */

type NewsSearchParams = {
  topic?: string | string[];
  track?: string | string[];
};

function formatPublishedDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(date));
}

const WEB_UPDATE_LIMIT = 12;

type WebUpdate = {
  key: string;
  topic: string;
  source: string;
  publishedAt: string;
  title: string;
  summary: string;
  href: string;
  briefHref: string;
};

/** The committed snapshot of the same feeds, which needs no network at all. */
function snapshotWebUpdates(locale: Locale): WebUpdate[] {
  return getAutoNews(locale, WEB_UPDATE_LIMIT).map((item) => ({
    key: `auto-${item.slug}`,
    topic: item.topic,
    source: item.source,
    publishedAt: item.publishedAt,
    title: item.title,
    summary: item.summary,
    href: item.href,
    briefHref: `/${locale}/news/auto/${item.slug}`
  }));
}

function WebUpdatesBody({
  items,
  updatedAt,
  locale
}: {
  items: WebUpdate[];
  updatedAt: string;
  locale: Locale;
}) {
  return (
    <>
      {updatedAt ? (
        <p className="mt-1 text-xs text-[color:var(--muted)]">
          {locale === "fr" ? "Dernière synchronisation" : "Last sync"}: {formatPublishedDate(updatedAt, locale)}
        </p>
      ) : null}

      {items.length ? (
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <article key={item.key} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <Provenance
                source={item.source}
                topic={item.topic}
                publishedAt={item.publishedAt}
                locale={locale}
                live
              />
              <h3 className="mt-2 text-base font-semibold text-[color:var(--text-strong)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--text)]">{item.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.briefHref ? (
                  <Link href={item.briefHref} className="btn-secondary px-3 py-1.5 text-xs">
                    {locale === "fr" ? "Lire brief auto" : "Read auto brief"}
                  </Link>
                ) : null}
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="do-link inline-block pt-1 text-sm"
                >
                  {locale === "fr" ? "Source officielle" : "Official source"}
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <article className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <p className="text-sm text-[color:var(--text)]">
            {locale === "fr"
              ? "Aucun nouvel item pour le moment. Revenez plus tard pour les prochaines mises à jour."
              : "No new items yet. Check back soon for fresh updates."}
          </p>
        </article>
      )}
    </>
  );
}

/**
 * The only part of this page that touches the network, kept behind its own
 * Suspense boundary.
 *
 * getLiveAiCsUpdates fetches seventeen third-party feeds and used to be awaited
 * as the first statement of the page component, before a single element of JSX
 * existed. So the time to first byte for /news was the time of the slowest of
 * seventeen hosts we do not run, and the twenty-seven hand-written briefs
 * underneath -- which are plain imports and need nothing -- waited behind them.
 * Measured before this change: 270.8ms to first byte against 12-18ms for every
 * other page on the site, and that was with DNS broken, so all seventeen
 * fetches failed instantly. In production each one is a real request.
 */
async function LiveWebUpdates({ locale }: { locale: Locale }) {
  const liveUpdates = await getLiveAiCsUpdates(WEB_UPDATE_LIMIT);

  if (!liveUpdates.length) {
    return <WebUpdatesBody items={snapshotWebUpdates(locale)} updatedAt={getAutoNewsUpdatedAt()} locale={locale} />;
  }

  return (
    <WebUpdatesBody
      items={liveUpdates.map((item, index) => ({
        key: `live-${index}-${item.href}`,
        topic: item.topic,
        source: item.source,
        publishedAt: item.publishedAt,
        title: item.title,
        summary:
          locale === "fr"
            ? "Mise à jour source officielle capturée en direct."
            : "Official source update captured from live feed.",
        href: item.href,
        briefHref: ""
      }))}
      updatedAt={new Date().toISOString()}
      locale={locale}
    />
  );
}

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const dict = getDictionary(params.lang);

  return {
    title: dict.news.title,
    description: dict.news.subtitle,
    keywords: getSeoKeywords(params.lang, "news", [
      params.lang === "fr" ? "actualites ia" : "ai news",
      params.lang === "fr" ? "outils ia" : "ai tools",
      params.lang === "fr" ? "mises a jour ia" : "ai updates",
      params.lang === "fr" ? "sorties machine learning" : "machine learning releases",
      params.lang === "fr" ? "outils developpeur" : "developer tools"
    ]),
    openGraph: {
      // /news is the most-shared URL on the site and the French one shared as
      // en_US, because a page that sets its own openGraph drops the layout's
      // og:site_name and og:locale with it.
      ...openGraphDefaults(params.lang),
      title: dict.news.title,
      description: dict.news.subtitle,
      url: `/${params.lang}/news`,
      type: "website",
      images: [{ url: ogImageUrl(dict.news.title), width: 1200, height: 630, alt: dict.news.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: dict.news.title,
      description: dict.news.subtitle,
      images: [ogImageUrl(dict.news.title)]
    },
    alternates: localizedAlternates("/news", params.lang)
  };
}

export default async function LocalizedNewsPage(
  props: {
    params: Promise<{ lang: string }>;
    searchParams?: Promise<NewsSearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const dict = getDictionary(locale);
  const allBriefs = getLocalizedNews(locale);
  const topics = getNewsTopics();

  const topicValue = searchParams?.topic;
  const topicFilter = typeof topicValue === "string" ? topicValue.trim().toLowerCase() : "";
  const trackValue = searchParams?.track;
  const parsedTrack = typeof trackValue === "string" ? trackValue.trim().toLowerCase() : "";
  const trackFilter: NewsTrack | "all" = parsedTrack === "ai" || parsedTrack === "cs" || parsedTrack === "career" ? parsedTrack : "all";
  const trackCounts = getNewsTrackCounts();

  const trackScopedBriefs = trackFilter === "all" ? allBriefs : allBriefs.filter((brief) => getNewsTrack(brief.topic) === trackFilter);
  const filteredBriefs = topicFilter
    ? trackScopedBriefs.filter((brief) => slugifyTopic(brief.topic) === topicFilter)
    : trackScopedBriefs;

  const featuredBrief = filteredBriefs[0];
  const relatedBriefs = filteredBriefs.slice(1, 8);
  const streamBriefs = filteredBriefs.slice(1);
  const recentSignals = allBriefs.slice(0, 4);
  const streamHeading =
    trackFilter === "ai"
      ? locale === "fr"
        ? "Flux actualité IA"
        : "AI signal stream"
      : trackFilter === "cs"
        ? locale === "fr"
          ? "Flux actualité informatique"
          : "Computer science signal stream"
        : trackFilter === "career"
          ? locale === "fr"
            ? "Flux actualité carrière"
            : "Career signal stream"
          : locale === "fr"
            ? "Flux actualité IA/CS"
            : "AI + Cybersecurity signal stream";

  const trackOptions: Array<{ key: NewsTrack | "all"; label: string; count: number }> = [
    { key: "all", label: locale === "fr" ? "Tout IA + CS" : "All AI + Cybersecurity", count: allBriefs.length },
    { key: "ai", label: locale === "fr" ? "IA" : "AI", count: trackCounts.ai },
    { key: "cs", label: locale === "fr" ? "Informatique" : "Computer Science", count: trackCounts.cs },
    { key: "career", label: locale === "fr" ? "Carrière" : "Career", count: trackCounts.career }
  ];

  const buildNewsFilterHref = (nextTrack: NewsTrack | "all", nextTopic = topicFilter) => {
    const params = new URLSearchParams();
    if (nextTrack !== "all") params.set("track", nextTrack);
    if (nextTopic) params.set("topic", nextTopic);
    const suffix = params.toString();
    return suffix ? `/${locale}/news?${suffix}` : `/${locale}/news`;
  };

  // These three tiles are cropped to a third of their width, and the old SVGs
  // carried headline text, so every one was sliced mid-word. The generated
  // covers are geometric, so they crop cleanly at any aspect — and three
  // different topics give the strip three distinct palettes.
  const featuredVisuals = [
    coverImageUrl("news-ai-systems", "none"),
    coverImageUrl("news-security-standards", "none"),
    coverImageUrl("news-computer-systems", "none")
  ] as const;

  return (
    <section className="page-shell max-w-6xl py-10 md:py-16">
      <div className="do-hero overflow-hidden rounded-3xl p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="do-kicker">{dict.nav.news}</p>
            <h1 className="font-display mt-2 text-4xl font-bold leading-[1.08] text-[color:var(--text-strong)] md:text-5xl">
              {locale === "fr" ? "Actualités IA + cybersécurité" : "AI + Cybersecurity News"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-[color:var(--text)] md:text-base">{dict.news.subtitle}</p>
          </div>
          <Link href={`/${locale}/news/live`} className="btn-secondary">
            {locale === "fr" ? "Flux live complet" : "Open full live stream"}
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.92fr,1.45fr]">
          <aside
            className="space-y-3"
            aria-label={locale === "fr" ? "Actualités liées" : "Related updates"}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--primary)]">
              {locale === "fr" ? "Actualités liées" : "Related updates"}
            </p>
            {(relatedBriefs.length ? relatedBriefs : recentSignals).map((brief) => (
              <article key={brief.slug} className="news-related-card rounded-2xl p-4">
                <Provenance
                  className="mb-2"
                  source={brief.source}
                  topic={brief.topic}
                  publishedAt={brief.publishedAt}
                  locale={locale}
                />
                <h2 className="line-clamp-2 text-sm font-semibold text-[color:var(--text-strong)] md:text-base">
                  <Link href={`/${locale}/news/${brief.slug}`} className="hover:opacity-85">
                    {brief.title}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-2 text-xs text-[color:var(--muted)]">{brief.summary}</p>
              </article>
            ))}
          </aside>

          {featuredBrief ? (
            <article className="news-feature-card overflow-hidden rounded-3xl">
              <div className="news-feature-media grid grid-cols-3 gap-1 p-1">
                {featuredVisuals.map((src, index) => (
                  <div key={`${src}-${index}`} className="relative h-[16rem] overflow-hidden rounded-2xl md:h-[22rem]">
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(max-width: 1280px) 33vw, 24vw"
                      className="object-cover object-center opacity-90"
                      // All three, not just the first. This row is grid-cols-3
                      // at every breakpoint -- it never stacks -- so all three
                      // tiles are above the fold, the same size, and equally
                      // likely to be the LCP element. On desktop it was tile 1,
                      // which was lazy: Lighthouse failed lcp-lazy-loaded on
                      // /en/news and the LCP phase showed 67-81ms of load time
                      // for an image the browser had been told not to hurry.
                      // The three together are 3.7 kB, so eager costs nothing.
                      priority
                    />
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 pt-4 md:px-7 md:pb-7">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]">
                    {topicLabel(featuredBrief.topic, locale)}
                  </span>
                  <span className="text-xs text-[color:var(--muted)]">{formatReadTime(featuredBrief.readTime, locale)}</span>
                  <time dateTime={featuredBrief.publishedAt} className="text-xs text-[color:var(--muted)]">
                    {formatPublishedDate(featuredBrief.publishedAt, locale)}
                  </time>
                </div>
                <h2 className="font-display text-2xl font-bold leading-tight text-[color:var(--text-strong)] md:text-4xl">
                  <Link href={`/${locale}/news/${featuredBrief.slug}`} className="hover:opacity-85">
                    {featuredBrief.title}
                  </Link>
                </h2>
                <p className="mt-3 text-sm text-[color:var(--text)] md:text-base">{featuredBrief.summary}</p>
                <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">{dict.news.impact}</p>
                  <p className="mt-2 text-sm text-[color:var(--text)]">{featuredBrief.studentImpact}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/${locale}/news/${featuredBrief.slug}`} className="btn-primary">
                    {dict.news.readBrief}
                  </Link>
                  {featuredBrief.source.href ? (
                    <a href={featuredBrief.source.href} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                      {locale === "fr" ? "Source officielle" : "Official source"}
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </div>

      <section className="mt-6 surface rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">
            {locale === "fr" ? "Nouveautés AI + Cybersecurity depuis le web" : "Latest AI + Cybersecurity from the web"}
          </h2>
          <Link href={`/${locale}/news/live`} className="btn-secondary">
            {locale === "fr" ? "Flux live complet" : "Open full live stream"}
          </Link>
        </div>
        <p className="mt-2 text-sm text-[color:var(--text)]">
          {locale === "fr"
            ? "Ces updates viennent de sources officielles et passent en priorité en haut de la page."
            : "These updates come from official sources and stay prioritized at the top of this page."}
        </p>
        {/* The fallback is not a skeleton: it is the committed auto-news
            snapshot, the same items this block falls back to when the feeds
            answer with nothing. So the reader gets real, readable, linked
            headlines in the first flush of HTML and the live set replaces them
            when it arrives -- rather than an empty page held open by whichever
            of seventeen hosts is slowest today. */}
        <Suspense fallback={<WebUpdatesBody items={snapshotWebUpdates(locale)} updatedAt={getAutoNewsUpdatedAt()} locale={locale} />}>
          <LiveWebUpdates locale={locale} />
        </Suspense>
      </section>

      <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">
          {locale === "fr" ? "Répartition IA + cybersécurité" : "AI + Cybersecurity split"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {trackOptions.map((option) => {
            const isActive = option.key === trackFilter;
            return (
              <Link
                key={option.key}
                href={buildNewsFilterHref(option.key)}
                className={`tap-target rounded-full border px-3 py-1 text-xs ${
                  isActive
                    ? "border-[color:var(--primary)] bg-[color:var(--bg-soft)]/60 text-[color:var(--text-strong)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)]"
                }`}
              >
                {option.label} ({option.count})
              </Link>
            );
          })}
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">
          {locale === "fr" ? "Filtrer par thème" : "Filter by topic"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={buildNewsFilterHref(trackFilter, "")}
            className={`tap-target rounded-full border px-3 py-1 text-xs ${
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
                href={buildNewsFilterHref(trackFilter, slug)}
                className={`tap-target rounded-full border px-3 py-1 text-xs ${
                  active
                    ? "border-[color:var(--primary)] bg-[color:var(--bg-soft)]/60 text-[color:var(--text-strong)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)]"
                }`}
              >
                {topicLabel(topic, locale)}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">{streamHeading}</h2>

          {streamBriefs.map((brief) => (
            <article key={brief.slug} className="card-hover glass rounded-2xl p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]">
                  {topicLabel(brief.topic, locale)}
                </span>
                <span className="text-xs text-[color:var(--muted)]">{brief.source.name}</span>
                <time dateTime={brief.publishedAt} className="text-xs text-[color:var(--muted)]">
                  {formatPublishedDate(brief.publishedAt, locale)}
                </time>
                <span className="text-xs text-[color:var(--muted)]">{formatReadTime(brief.readTime, locale)}</span>
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
                    #{tagLabel(tag, locale)}
                  </span>
                ))}
              </div>
              <Link href={`/${locale}/news/${brief.slug}`} className="do-link mt-4 inline-block text-sm">
                {dict.news.readBrief}
              </Link>
              {brief.source.href ? (
                <a href={brief.source.href} target="_blank" rel="noopener noreferrer" className="do-link mt-4 ml-3 inline-block text-sm">
                  {locale === "fr" ? "Source officielle" : "Official source"}
                </a>
              ) : null}
            </article>
          ))}

          {!streamBriefs.length && (
            <article className="glass rounded-2xl p-6">
              <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">
                {locale === "fr" ? "Aucun brief trouvé" : "No briefs found"}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--text)]">
                {locale === "fr"
                  ? "Essayez un autre thème, ou revenez au flux principal."
                  : "Try another topic, or go back to the full stream."}
              </p>
              <Link href={`/${locale}/news`} className="btn-secondary mt-4 inline-block">
                {locale === "fr" ? "Voir tous les briefs" : "View all briefs"}
              </Link>
            </article>
          )}
        </div>

        <aside
          className="space-y-4 md:sticky md:top-52 md:h-fit"
          aria-label={locale === "fr" ? "Signaux récents" : "Recent signals"}
        >
          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Signaux récents" : "Recent signals"}
            </h3>
            <div className="mt-3 space-y-3">
              {recentSignals.map((signal, index) => (
                <article key={signal.slug} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    #{index + 1} • {topicLabel(signal.topic, locale)}
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-[color:var(--text-strong)]">
                    <Link href={`/${locale}/news/${signal.slug}`} className="hover:opacity-85">
                      {signal.title}
                    </Link>
                  </h4>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">{formatReadTime(signal.readTime, locale)}</p>
                </article>
              ))}
            </div>
          </div>

          {/* A second newsletter pitch used to sit here, directly above the
              real one, promising a different email: "top signals, practical
              action plan, and one high-ROI project idea" every week, where the
              block below promises verified internships and at most one email.
              Two offers for one list is how a reader concludes we do not know
              what we send -- and the digest was the one nothing was built to
              deliver. The Newsletter component is the only thing that
              describes the email now. */}
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
              <Link href={getGuideCtaHref(locale)} className="btn-secondary">
                {getGuideCtaLabel(locale)}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
