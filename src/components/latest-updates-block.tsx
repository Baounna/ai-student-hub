import Link from "next/link";
import { getAutoNews } from "@/content/auto-news";
import type { Locale } from "@/i18n/config";

type LatestUpdatesBlockProps = {
  locale: Locale;
  limit?: number;
  compact?: boolean;
  className?: string;
};

function formatUpdateDate(value: string, locale: Locale) {
  if (!value) return locale === "fr" ? "Date indisponible" : "Date unavailable";
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export async function LatestUpdatesBlock({ locale, limit = 6, compact = false, className = "" }: LatestUpdatesBlockProps) {
  const fr = locale === "fr";
  const updates = getAutoNews(locale, limit).map((item) => ({
    title: item.title,
    href: item.href,
    source: item.source,
    publishedAt: item.publishedAt
  }));

  const sectionClass = compact
    ? "surface rounded-2xl p-5"
    : "reading-panel rounded-3xl p-6";

  return (
    <section className={`${sectionClass} ${className}`.trim()}>
      <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
        {fr ? "Dernières mises à jour IA/CS (avec source)" : "Latest AI + Cybersecurity updates (with sources)"}
      </h2>
      <p className="mt-2 text-sm text-[color:var(--text)]">
        {fr
          ? "Flux automatisé depuis les briefs vérifiés. Chaque lien pointe vers la publication originale."
          : "Automated stream from verified briefs. Every link points to the original publication."}
      </p>

      {updates.length ? (
        <ol className="mt-4 space-y-3">
          {updates.map((item, index) => (
            <li key={`${item.href}-${index}`} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
              <p className="text-xs text-[color:var(--muted)]">
                [{index + 1}] {item.source} • {formatUpdateDate(item.publishedAt, locale)}
              </p>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-1 block text-sm font-semibold text-[color:var(--text-strong)] transition hover:opacity-80"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <p className="text-sm text-[color:var(--text)]">
            {fr
              ? "Les flux externes sont temporairement indisponibles. Réessayez plus tard."
              : "External feeds are temporarily unavailable. Please retry shortly."}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/${locale}/news/live`} className="btn-secondary">
          {fr ? "Ouvrir le flux live" : "Open live stream"}
        </Link>
        <Link href={`/${locale}/news`} className="btn-primary">
          {fr ? "Voir les briefs" : "View curated briefs"}
        </Link>
      </div>
    </section>
  );
}
