import Link from "next/link";
import { headers } from "next/headers";
import type { Locale } from "@/i18n/config";
import { absoluteUrl } from "@/lib/site-url";
import { jsonLd } from "@/lib/json-ld";

type Crumb = {
  label: string;
  href?: string;
};

/**
 * The visible trail and its BreadcrumbList, from one array.
 *
 * The landmark label is the only string this component owns, and it was
 * English on every page including the French ones — so a French screen-reader
 * user landed on a navigation landmark announced as "Breadcrumb". Every call
 * site sits inside a [lang] route and already has the locale to hand, so it is
 * passed rather than guessed. It stays optional so an English default is the
 * worst case rather than a build error.
 *
 * The structured data lives here rather than at the call sites.
 *
 * 218 pages rendered this visible trail with no structured data at all --
 * every blog post, every news item, and all 150 category and tag pages. Only
 * /stages emitted the schema, by building it from its own copy of the array,
 * and its comment says exactly why that shape is right: "a BreadcrumbList that
 * disagrees with the breadcrumbs on the page is exactly what Search Console
 * flags". Emitting it from the component takes that from a rule six call sites
 * have to remember to a property one array cannot violate.
 *
 * The last crumb has no href -- it is the page being read -- so its item URL
 * comes from the pathname middleware already sets for the language switcher.
 */
export async function Breadcrumbs({ items, locale = "en" }: { items: Crumb[]; locale?: Locale }) {
  if (!items.length) return null;

  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-csp-nonce") || undefined;
  const currentPath = requestHeaders.get("x-pathname") || `/${locale}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href ?? currentPath)
    }))
  };

  return (
    <>
    <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
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
                <Link href={item.href} className="inline-block py-1.5 hover:text-[color:var(--text)]">
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
    </>
  );
}
