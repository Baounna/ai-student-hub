import type { Locale } from "@/i18n/config";

function formatPublishedDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(date));
}

/** Curated briefs carry a linked source object; agent items carry a plain name. */
export type ProvenanceSource = string | { name: string; href?: string };

type ProvenanceProps = {
  source?: ProvenanceSource;
  topic?: string;
  publishedAt?: string;
  locale: Locale;
  /** Marks an item the agent captured from a live first-party feed. */
  live?: boolean;
  className?: string;
};

/**
 * The fixed metadata line for anything the ingestion agent collected:
 * source first, then topic, then when it was published. Source leads
 * because first-party provenance is what the editorial policy promises.
 */
export function Provenance({ source, topic, publishedAt, locale, live = false, className }: ProvenanceProps) {
  const published = publishedAt ? formatPublishedDate(publishedAt, locale) : "";
  const sourceName = typeof source === "string" ? source : source?.name;

  return (
    <div className={className ? `provenance ${className}` : "provenance"}>
      {sourceName ? <span className="provenance-source">{sourceName}</span> : null}
      {topic ? <span>{topic}</span> : null}
      {published ? <time dateTime={publishedAt}>{published}</time> : null}
      {live ? (
        <span className="provenance-live">{locale === "fr" ? "Source officielle" : "First-party source"}</span>
      ) : null}
    </div>
  );
}
