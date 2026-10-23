import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { jsonLd } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/site-url";
import { Newsletter } from "@/components/newsletter";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { localizedAlternates, openGraphDefaults } from "@/i18n/helpers";
import { ogImageUrl } from "@/lib/seo";
import { countryLabel, isClosed, isStagesListStale, type Stage } from "@/content/stages";
import {
  countriesWithPages,
  countryFromSlug,
  countryPageBlurb,
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

export async function generateMetadata(props: {
  params: Promise<{ lang: string; country: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};
  const code = countryFromSlug(params.country);
  if (!code) return {};
  const locale: Locale = params.lang;
  const title = countryPageTitle(code, locale);
  /*
   * Counted here, not written out once for every country.
   *
   * This sentence promised "internships, apprenticeships and final-year
   * projects" on every country page. The United States lists twelve
   * internships and nothing else, Canada four, and Morocco has no
   * apprenticeship -- so two of the three categories a reader was offered were
   * empty, in the search result as well as on the page. countryPageBlurb names
   * only the kinds that are there, and only promises cyber where there is
   * some.
   */
  const description = countryPageBlurb(code, locale);
  const path = `/stages/${countrySlug(code)}`;

  return {
    title,
    description,
    openGraph: {
      ...openGraphDefaults(locale),
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
  // The same judgment /stages makes, read from the same entries. See
  // getStagesLastCheckedAt: it is derived from the rows rather than the file's
  // mtime, because the two disagreed and the page showed the flattering one.
  const stale = isStagesListStale();

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
    description: countryPageBlurb(code, locale),
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
      <p className="mt-3 text-[color:var(--text)]">{countryPageBlurb(code, locale)}</p>
      <p className="provenance mt-2">{copy.openCount(open, listings.length)}</p>

      {/* The same warning /stages carries, on the pages a stranger actually
          lands on. These ten URLs exist because they are what a search for
          "stage IA Maroc" can reach, so for most readers this page IS the
          board -- and it was the one version of it that did not admit when the
          list had gone unchecked. A page of deadlines that quietly goes out of
          date is worse than one that says so, and the staleness judgment was
          already computed from the same rows a few files away. */}
      {stale ? (
        <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <h2 className="font-semibold text-[color:var(--text-strong)]">{copy.staleTitle}</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">{copy.staleBody}</p>
        </div>
      ) : null}

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
                // --control-border, for the reason written on the board page's
                // chipClass: --border over no fill is 1.29:1 against the page
                // in light and 1.44:1 in dark, so these were words with
                // nothing around them. 3.45:1 and 4.66:1 now.
                className="tap-target rounded-full border border-[color:var(--control-border)] px-3 py-1 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
              >
                {countryLabel(other, locale)} ({(listingsByCountry().get(other) ?? []).length})
              </Link>
            ))}
          </div>
        </nav>
      ) : null}

      {/* What "checked" means, on the pages that need it most.
          These ten country boards are the ones a stranger arrives on from a
          search, and they rendered the listings, the check dates and the
          "we could not verify this link" admissions without the paragraph that
          explains any of it -- the one thing on this site a scraped job board
          does not have. The copy was already imported here for the row labels;
          only the section was missing. It also carries the sentence that says
          deadlines appear only where the employer published one, which is what
          the rows themselves no longer repeat 92 times. */}
      {listings.length > 0 ? (
        <section className="mt-10 border-t border-[color:var(--border)] pt-6">
          <h2 className="text-sm font-semibold text-[color:var(--text-strong)]">{copy.methodTitle}</h2>
          <p className="mt-1 max-w-[70ch] text-sm text-[color:var(--muted)]">{copy.methodBody}</p>
        </section>
      ) : null}

      <div className="mt-12">
        <Newsletter locale={locale} />
      </div>
    </div>
  );
}
