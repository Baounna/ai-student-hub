import Link from "next/link";
import type { Locale } from "@/i18n/config";

type Crumb = {
  label: string;
  href?: string;
};

/**
 * The landmark label is the only string here the component owns, and it was
 * English on every page including the French ones — so a French screen-reader
 * user landed on a navigation landmark announced as "Breadcrumb". Every call
 * site sits inside a [lang] route and already has the locale to hand, so it is
 * passed rather than guessed. It stays optional so an English default is the
 * worst case rather than a build error.
 */
export function Breadcrumbs({ items, locale = "en" }: { items: Crumb[]; locale?: Locale }) {
  if (!items.length) return null;

  return (
    <nav
      aria-label={locale === "fr" ? "Fil d'Ariane" : "Breadcrumb"}
      className="mb-4 text-xs text-[color:var(--muted)]"
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-[color:var(--text)]">
                  {item.label}
                </Link>
              ) : (
                // aria-current tells a screen reader which crumb is the page
                // being read. Without it the trail is just a list of words.
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-[color:var(--text-strong)]" : ""}>
                  {item.label}
                </span>
              )}
              {!isLast ? <span aria-hidden>/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
