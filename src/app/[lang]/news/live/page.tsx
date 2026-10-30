import type { Metadata } from "next";
import { Suspense } from "react";
import { liveNewsPageTitle } from "@/lib/page-titles";
import { topicLabel } from "@/content/news";
import Link from "next/link";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { getAutoNews } from "@/content/auto-news";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates, openGraphDefaults } from "@/i18n/helpers";
import { getSeoKeywords, ogImageUrl } from "@/lib/seo";
import { getLiveAiCsUpdates, getLiveNewsSources, type LiveNewsItem } from "@/lib/live-news";

/*
 * `export const revalidate = 1800` used to live here, and it never did anything
 * either.
 *
 * It replaced `export const dynamic = "force-dynamic"`, which really was
 * harmful -- it switched off the per-feed `next: { revalidate: 60 * 30 }` in
 * src/lib/live-news.ts and refetched every feed on every request. But the
 * replacement was no more load-bearing than what it replaced: the root layout
 * reads headers() for the CSP nonce, so every page in this tree renders per
 * request regardless. Measured on /en/news with the export still present,
 * Cache-Control came back `private, no-cache, no-store, max-age=0,
 * must-revalidate`.
 *
 * The thirty minutes the copy below promises are the per-feed revalidate, which
 * is a data-cache setting and is unaffected by any of this. Next also infers a
 * segment's revalidate from the fetches inside it, so the number survives the
 * deletion -- and when something eventually makes this page cacheable again, it
 * will cache for the interval the fetches actually use rather than one someone
 * left behind.
 */

/** "https://www.postgresql.org/about/news/..." -> "postgresql.org". */
function hostOf(href: string) {
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return href;
  }
}

function formatPublishedDate(date: string, locale: Locale) {
  if (!date) return locale === "fr" ? "Date indisponible" : "Date unavailable";
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

const LIVE_UPDATE_LIMIT = 24;

/** The committed snapshot of the same feeds, which needs no network at all. */
function snapshotUpdates(locale: Locale): LiveNewsItem[] {
  return getAutoNews(locale, LIVE_UPDATE_LIMIT).map((item) => ({
    title: item.title,
    href: item.href,
    source: item.source,
    publishedAt: item.publishedAt,
    topic: item.topic
  }));
}

function UpdateStream({ updates, locale }: { updates: LiveNewsItem[]; locale: Locale }) {
  const fr = locale === "fr";

  if (!updates.length) {
    return (
      <article className="glass rounded-2xl p-6">
        <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
          {fr ? "Aucune mise à jour disponible" : "No updates available right now"}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--text)]">
          {fr
            ? "Les flux externes n'ont pas répondu pour le moment. Réessayez plus tard."
            : "External feeds did not respond yet. Please retry later."}
        </p>
      </article>
    );
  }

  return (
    <>
      {updates.map((item, index) => (
        <article key={`${item.href}-${index}`} className="card-hover glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]">
              {topicLabel(item.topic, locale)}
            </span>
            <span className="text-xs text-[color:var(--muted)]">{item.source}</span>
            <span className="text-xs text-[color:var(--muted)]">{formatPublishedDate(item.publishedAt, locale)}</span>
          </div>
          <h2 className="font-display mt-3 text-xl font-semibold text-[color:var(--text-strong)]">
            <a href={item.href} target="_blank" rel="noopener noreferrer nofollow" className="hover:opacity-85">
              {item.title}
            </a>
          </h2>
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            {fr ? "Source officielle" : "Official source"}:{" "}
            {/* The full href was printed as visible text, so a card could
                carry 90 characters of URL and overflow on a phone. The
                host is what tells a reader where they are going. */}
            <a href={item.href} target="_blank" rel="noopener noreferrer nofollow" className="do-link">
              {hostOf(item.href)}
            </a>
          </p>
        </article>
      ))}
    </>
  );
}

/**
 * The feed fetch, behind its own Suspense boundary.
 *
 * This was awaited at the top of the page component, so nothing at all reached
 * the reader -- not the heading, not the tracked-source list, not the footer --
 * until the slowest of seventeen third-party hosts had answered or timed out.
 * One feed that accepts a connection and then goes quiet was a blank page for
 * the full timeout, and the timeout was ten seconds. The per-feed ceiling is
 * now 2.5s (see src/lib/live-news.ts), and the page no longer waits for any of
 * it before it starts rendering.
 */
async function LiveUpdateStream({ locale }: { locale: Locale }) {
  const updates = await getLiveAiCsUpdates(LIVE_UPDATE_LIMIT);
  return <UpdateStream updates={updates} locale={locale} />;
}

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const fr = params.lang === "fr";
  const title = liveNewsPageTitle(fr ? "fr" : "en");
  const description = fr
    ? "Mises à jour IA/CS automatiques avec liens source directs."
    : "Automatic AI + Cybersecurity updates with direct source links.";

  return {
    title,
    description,
    /*
     * Out of the index, for the reason already written out at length in
     * src/app/[lang]/news/auto/[slug]/page.tsx -- it applies here word for word
     * and simply was not applied.
     *
     * Everything below the header on this page is somebody else's headline,
     * their hostname and a list of their feed URLs. There is not one original
     * sentence on it. Worse than thin: the French edition renders the same
     * English headlines with only the surrounding chrome translated, so
     * /en/news/live and /fr/news/live are near-identical pages, both were in
     * the sitemap at priority 0.82 and changeFrequency hourly, and each names
     * the other as its hreflang alternate -- two URLs competing to be the
     * canonical copy of a page neither of them wrote.
     *
     * follow stays on. The outbound source links are genuine credit and the
     * links back into /news and /blog should keep carrying weight; this page
     * remains useful to a reader and useful as a hub, it just stops asking to
     * be ranked for other people's words. Undo this the day the page carries
     * its own writing.
     */
    robots: { index: false, follow: true },
    keywords: getSeoKeywords(params.lang, "news", [
      fr ? "flux actualites ia en direct" : "live ai news stream",
      fr ? "veille informatique temps reel" : "real-time cybersecurity updates"
    ]),
    openGraph: {
      // This page gets shared while a story is still moving, so the card is often
      // the only thing a reader sees -- and in French it carried no locale at all.
      ...openGraphDefaults(params.lang),
      title,
      description,
      url: `/${params.lang}/news/live`,
      type: "website",
      images: [{ url: ogImageUrl(title), width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl(title)]
    },
    alternates: localizedAlternates("/news/live", params.lang)
  };
}

export default async function LocalizedLiveNewsPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";
  const sources = getLiveNewsSources();
  // "Snapshot taken", not "updated", and the word still earns its keep. The
  // page itself is rendered per request, so this really is now -- but the
  // headlines under it can be up to half an hour old, because each feed
  // response is cached for that long. Reading it as the age of the news would
  // overstate the freshness of everything below.
  const refreshedAt = new Date().toISOString();

  return (
    <section className="page-shell max-w-6xl py-10 md:py-16">
      <header className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{fr ? "Flux en direct" : "Live stream"}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {fr ? "Nouveautés IA/CS automatiques" : "Automatic AI + Cybersecurity latest updates"}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">
              {fr
                ? "Cette page agrège les dernières publications AI + Cybersecurity depuis des flux fiables, avec lien source direct pour chaque élément."
                : "This page aggregates the latest AI + Cybersecurity publications from trusted feeds, with direct source links for every item."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/news`} className="btn-secondary">
                {fr ? "Retour aux briefs" : "Back to curated briefs"}
              </Link>
              <Link href={`/${locale}/blog`} className="btn-primary">
                {fr ? "Voir analyses" : "Open analysis posts"}
              </Link>
            </div>
          </div>

          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{fr ? "Actualisation" : "Refresh"}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>{fr ? "1. Revalidation automatique toutes les 30 minutes." : "1. Auto revalidation every 30 minutes."}</li>
              <li>{fr ? "2. Chaque élément pointe vers la source originale." : "2. Every item links to the original source."}</li>
              <li>{fr ? "3. Utilisable pour idées d'articles avec citation." : "3. Ready for source-backed article ideas."}</li>
            </ul>
            <p className="mt-3 text-xs text-[color:var(--muted)]">
              {fr ? "Instantané du : " : "Snapshot taken: "}
              {formatPublishedDate(refreshedAt, locale)}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-4">
          {/* The fallback is the committed auto-news snapshot rather than a
              placeholder, because this column is the whole page: a skeleton
              here would be an admission that we have nothing, and we do have
              something -- the same feeds, read on a cron into
              src/content/auto-news.json. The reader gets linked headlines in
              the first flush and the live set swaps in behind them. */}
          <Suspense fallback={<UpdateStream updates={snapshotUpdates(locale)} locale={locale} />}>
            <LiveUpdateStream locale={locale} />
          </Suspense>
        </div>

        <aside
          className="space-y-4 lg:sticky lg:top-52 lg:h-fit"
          aria-label={locale === "fr" ? "Contenu complémentaire" : "Related content"}
        >
          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {fr ? "Sources suivies" : "Tracked sources"}
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              {sources.map((source) => (
                <li key={source.href}>
                  <a href={source.href} target="_blank" rel="noopener noreferrer nofollow" className="do-link">
                    {source.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <EditorialTrust locale={locale} compact />
          <Newsletter compact locale={locale} source="news_live_aside" />
        </aside>
      </div>
    </section>
  );
}
