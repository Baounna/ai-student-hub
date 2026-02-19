import type { Metadata } from "next";
import Link from "next/link";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { isLocale, type Locale } from "@/i18n/config";
import { alternateLanguages } from "@/i18n/helpers";
import { getLiveAiCsUpdates, getLiveNewsSources } from "@/lib/live-news";

export const revalidate = 60 * 30;

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

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  const fr = params.lang === "fr";
  const title = fr ? "Flux live AI/CS" : "Live AI/CS stream";
  const description = fr
    ? "Mises a jour IA/CS automatiques avec liens source directs."
    : "Automatic AI/CS updates with direct source links.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${params.lang}/news/live`,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    },
    alternates: {
      languages: alternateLanguages("/news/live")
    }
  };
}

export default async function LocalizedLiveNewsPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";
  const updates = await getLiveAiCsUpdates(24);
  const sources = getLiveNewsSources();
  const refreshedAt = new Date().toISOString();

  return (
    <section className="page-shell max-w-6xl py-10 md:py-16">
      <header className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{fr ? "Live stream" : "Live stream"}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {fr ? "Nouveautes IA/CS automatiques" : "Automatic AI/CS latest updates"}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">
              {fr
                ? "Cette page agrege les dernieres publications AI/CS depuis des flux fiables, avec lien source direct pour chaque item."
                : "This page aggregates the latest AI/CS publications from trusted feeds, with direct source links for every item."}
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
            <p className="do-kicker">{fr ? "Refresh" : "Refresh"}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>{fr ? "1. Revalidation automatique toutes les 30 minutes." : "1. Auto revalidation every 30 minutes."}</li>
              <li>{fr ? "2. Chaque item pointe vers la source originale." : "2. Every item links to the original source."}</li>
              <li>{fr ? "3. Utilisable pour idees d'articles avec citation." : "3. Ready for source-backed article ideas."}</li>
            </ul>
            <p className="mt-3 text-xs text-[color:var(--muted)]">
              {fr ? "Derniere generation: " : "Generated at: "}
              {formatPublishedDate(refreshedAt, locale)}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          {updates.length ? (
            updates.map((item, index) => (
              <article key={`${item.href}-${index}`} className="card-hover glass rounded-2xl p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]">
                    {item.topic}
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
                  <a href={item.href} target="_blank" rel="noopener noreferrer nofollow" className="do-link">
                    {item.href}
                  </a>
                </p>
              </article>
            ))
          ) : (
            <article className="glass rounded-2xl p-6">
              <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
                {fr ? "Aucune mise a jour disponible" : "No updates available right now"}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--text)]">
                {fr
                  ? "Les flux externes n'ont pas repondu pour le moment. Reessaie plus tard."
                  : "External feeds did not respond yet. Please retry later."}
              </p>
            </article>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {fr ? "Sources trackees" : "Tracked sources"}
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
