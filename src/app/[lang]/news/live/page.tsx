import type { Metadata } from "next";
import { liveNewsPageTitle } from "@/lib/page-titles";
import { topicLabel } from "@/content/news";
import Link from "next/link";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords, ogImageUrl } from "@/lib/seo";
import { getLiveAiCsUpdates, getLiveNewsSources } from "@/lib/live-news";

/**
 * Thirty minutes, which is what the page has always told the reader.
 *
 * This was `export const dynamic = "force-dynamic"`, and the only 30-minute
 * setting in the path is the `next: { revalidate: 60 * 30 }` on each feed fetch
 * in src/lib/live-news.ts. force-dynamic overrides exactly that -- Next's own
 * docs describe it as setting every fetch in the segment to `no-store`,
 * `revalidate: 0` -- so the number was dead config and the sentence "Auto
 * revalidation every 30 minutes" described a mechanism that had been switched
 * off above it. The page refetched all 23 feeds on every single request.
 *
 * Fixing the claim and the cost are the same change: every request was also an
 * uncached function invocation on the one page that cannot be served from the
 * edge, on a plan whose failure mode is the site pausing.
 */
export const revalidate = 1800;

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
    keywords: getSeoKeywords(params.lang, "news", [
      fr ? "flux actualites ia en direct" : "live ai news stream",
      fr ? "veille informatique temps reel" : "real-time cybersecurity updates"
    ]),
    openGraph: {
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
  const updates = await getLiveAiCsUpdates(24);
  const sources = getLiveNewsSources();
  // Under force-dynamic this was genuinely "now" for the reader. Under ISR it
  // is when the snapshot they are reading was built, which is a different fact
  // and needs a different word -- see the label below.
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
              {fr ? "Instantané du: " : "Snapshot taken: "}
              {formatPublishedDate(refreshedAt, locale)}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-4">
          {updates.length ? (
            updates.map((item, index) => (
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
            ))
          ) : (
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
          )}
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
