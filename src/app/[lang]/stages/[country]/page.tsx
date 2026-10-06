import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { jsonLd } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/site-url";
import { Newsletter } from "@/components/newsletter";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";
import { ogImageUrl } from "@/lib/seo";
import { countryLabel, isClosed, type Stage } from "@/content/stages";
import {
  countriesWithPages,
  countryFromSlug,
  countryPagePath,
  countryPageTitle,
  countrySlug,
  listingsByCountry
} from "@/content/stage-countries";
import { StageRow, stagesCopy } from "../shared";

/**
 * One page per country, for the readers who search that way.
 *
 * The board lives at two URLs and its country views are query parameters that
 * /stages canonicalises back to itself, so "stage IA Maroc" could not land
 * anywhere. These are not a slice of the same page dressed up: each lists
 * different employers in a different country, says how many there are, and
 * links to the rest. Countries with fewer than four listings get no page at
 * all -- see COUNTRY_PAGE_MIN_LISTINGS for why a page for one row is worse
 * than no page.
 */
export function generateStaticParams() {
  return locales.flatMap((lang) =>
    countriesWithPages().map((code) => ({ lang, country: countrySlug(code) }))
  );
}

function describe(code: string, count: number, locale: Locale): string {
  const name = countryLabel(code, locale);
  return locale === "fr"
    ? `${count} stages, alternances et PFE en IA et cybersécurité ouverts aux étudiants, vérifiés un par un. ${name}.`
    : `${count} internships, apprenticeships and final-year projects in AI and cybersecurity, each link opened and checked. ${name}.`;
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string; country: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};
  const code = countryFromSlug(params.country);
  if (!code) return {};
  const locale: Locale = params.lang;
  const count = (listingsByCountry().get(code) ?? []).length;
  const title = countryPageTitle(code, locale);
  const description = describe(code, count, locale);
  const path = `/stages/${countrySlug(code)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${locale}${path}`,
      type: "website",
      images: [{ url: ogImageUrl(title), width: 1200, height: 630, alt: title }]
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: localizedAlternates(path, locale)
  };
}

export default async function StagesByCountryPage(props: {
  params: Promise<{ lang: string; country: string }>;
}) {
  const params = await props.params;
  if (!isLocale(params.lang)) notFound();
  const code = countryFromSlug(params.country);
  // An unknown or too-small country is a 404, not an empty page pretending to
  // be a listing. /stages keeps every country reachable through its filters.
  if (!code) notFound();

  const locale: Locale = params.lang;
  const nonce = (await headers()).get("x-csp-nonce") || undefined;
  const copy = stagesCopy[locale];
  const dateFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const listings: Stage[] = listingsByCountry().get(code) ?? [];
  const openListings = listings.filter((stage) => !isClosed(stage));
  const open = openListings.length;

  /**
   * The same ItemList /stages carries, scoped to this country.
   *
   * These pages shipped without it, so the twelve URLs built to be found in a
   * search described themselves to a crawler less well than the page they were
   * split out of. A crawler reading /fr/stages/ma could see breadcrumbs and a
   * title and nothing about the nine listings that are the reason the page
   * exists.
   *
   * ItemList, deliberately not JobPosting, for the reason written on /stages:
   * JobPosting tells Google this site is where the position is published and
   * where applications are taken, and it is not — every entry links out to the
   * employer's own posting, which they own and can close without telling us.
   * Closed entries are left out, because advertising an expired deadline to a
   * crawler is the same untruth the page works to avoid.
   */
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: countryPageTitle(code, locale),
    description: describe(code, listings.length, locale),
    inLanguage: locale,
    url: absoluteUrl(countryPagePath(code, locale)),
    numberOfItems: openListings.length,
    itemListElement: openListings.map((stage, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${stage.role} - ${stage.company}`,
      url: stage.href
    }))
  };
  const name = countryLabel(code, locale);
  const title = countryPageTitle(code, locale);
  const others = countriesWithPages().filter((other) => other !== code);

  return (
    <div className="page-shell py-10">
      {/* jsonLd(), never bare JSON.stringify: a role or company name carrying
          a "</script>" would otherwise close the tag early. */}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }} />
      <Breadcrumbs
        locale={locale}
        items={[
          { label: copy.title, href: `/${locale}/stages` },
          { label: name }
        ]}
      />

      <h1 className="font-display text-3xl font-bold text-[color:var(--text-strong)] md:text-4xl">{title}</h1>
      <p className="mt-3 text-[color:var(--text)]">{describe(code, listings.length, locale)}</p>
      <p className="provenance mt-2">{copy.openCount(open, listings.length)}</p>

      <p className="mt-4 text-sm">
        <Link href={`/${locale}/stages`} className="do-link py-1.5">
          {locale === "fr"
            ? "Voir toutes les offres, tous pays confondus"
            : "See every opening, across all countries"}
        </Link>
      </p>

      <ul className="mt-6 divide-y divide-[color:var(--border)] border-t border-[color:var(--border)]">
        {listings.map((stage) => (
          <StageRow key={stage.id} stage={stage} locale={locale} copy={copy} dateFmt={dateFmt} />
        ))}
      </ul>

      {others.length ? (
        <nav className="mt-10" aria-label={locale === "fr" ? "Autres pays" : "Other countries"}>
          <p className="provenance">{locale === "fr" ? "Autres pays" : "Other countries"}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {others.map((other) => (
              <Link
                key={other}
                href={countryPagePath(other, locale)}
                className="tap-target rounded-full border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
              >
                {countryLabel(other, locale)} ({(listingsByCountry().get(other) ?? []).length})
              </Link>
            ))}
          </div>
        </nav>
      ) : null}

      <div className="mt-12">
        <Newsletter locale={locale} />
      </div>
    </div>
  );
}
