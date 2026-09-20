import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Newsletter } from "@/components/newsletter";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";
import { jsonLd } from "@/lib/json-ld";
import { ogImageUrl } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";
import {
  countryLabel,
  getOpenStages,
  getStages,
  getStagesAgeDays,
  isClosed,
  isStagesListStale,
  kindLabel,
  remoteLabel
} from "@/content/stages";

const COPY = {
  en: {
    title: "Tech internships in Morocco and France",
    subtitle:
      "Open internships, apprenticeships and final-year projects for students in tech. Checked and updated weekly.",
    empty: "No openings listed yet. The first entries go up this week.",
    closed: "Closed",
    deadline: "Apply by",
    rolling: "Open until filled - no closing date given",
    checked: "link checked",
    apply: "View the offer",
    source: "via",
    updated: "Last checked",
    staleTitle: "This list has not been checked recently",
    staleBody:
      "Deadlines below may have passed. It is shown as it was rather than hidden, so you can judge it for yourself.",
    daysAgo: (n: number) => (n === 0 ? "today" : n === 1 ? "yesterday" : `${n} days ago`),
    openCount: (open: number, total: number) => `${open} open of ${total} listed`
  },
  fr: {
    title: "Stages et alternances tech au Maroc et en France",
    subtitle:
      "Stages, alternances et PFE ouverts aux étudiants en informatique. Vérifiés et mis à jour chaque semaine.",
    empty: "Aucune offre pour le moment. Les premières arrivent cette semaine.",
    closed: "Clôturée",
    deadline: "Candidater avant le",
    rolling: "Ouverte jusqu'à pourvoi - aucune date limite annoncée",
    checked: "lien vérifié le",
    apply: "Voir l'offre",
    source: "via",
    updated: "Dernière vérification",
    staleTitle: "Cette liste n'a pas été vérifiée récemment",
    staleBody:
      "Les dates ci-dessous sont peut-être dépassées. Elle est affichée telle quelle plutôt que masquée, pour que vous puissiez en juger.",
    daysAgo: (n: number) => (n === 0 ? "aujourd'hui" : n === 1 ? "hier" : `il y a ${n} jours`),
    openCount: (open: number, total: number) => `${open} ouverte(s) sur ${total} référencée(s)`
  }
} as const;

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};
  const copy = COPY[params.lang];

  return {
    title: copy.title,
    description: copy.subtitle,
    openGraph: {
      title: copy.title,
      description: copy.subtitle,
      url: `/${params.lang}/stages`,
      type: "website",
      images: [{ url: ogImageUrl(copy.title), width: 1200, height: 630, alt: copy.title }]
    },
    twitter: { card: "summary_large_image", title: copy.title, description: copy.subtitle },
    alternates: localizedAlternates("/stages", params.lang)
  };
}

export default async function StagesPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;
  const locale: Locale = params.lang;
  const copy = COPY[locale];

  const nonce = (await headers()).get("x-csp-nonce") || undefined;

  const stages = getStages();
  const openStages = getOpenStages();
  const openCount = openStages.length;
  const stale = isStagesListStale();
  const ageDays = getStagesAgeDays();

  // One array feeds both the visible trail and the schema, so the markup and
  // the structured data cannot drift apart - a BreadcrumbList that disagrees
  // with the breadcrumbs on the page is exactly what Search Console flags.
  const breadcrumbs = [{ label: "AI and Cybersecurity News", href: `/${locale}` }, { label: copy.title }];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      // The last crumb renders as plain text rather than a link, so it has no
      // href of its own; it still identifies this page.
      item: absoluteUrl(crumb.href ?? `/${locale}/stages`)
    }))
  };

  /**
   * ItemList, deliberately not JobPosting.
   *
   * JobPosting tells Google this site is where the position is published and
   * where applications are taken. It is not: every entry here links out to the
   * employer's own posting, which they own and can close without telling us.
   * Claiming otherwise invites a manual action and, worse, would be a claim
   * about someone else's hiring that we are in no position to make.
   *
   * ItemList describes what this page honestly is - an ordered set of links -
   * and closed entries are left out because a list that advertises expired
   * deadlines to a crawler is the same untruth the page works to avoid.
   */
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: copy.title,
    description: copy.subtitle,
    inLanguage: locale,
    url: absoluteUrl(`/${locale}/stages`),
    numberOfItems: openStages.length,
    itemListElement: openStages.map((stage, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${stage.role} - ${stage.company}`,
      url: stage.href
    }))
  };

  const dateFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <section className="page-shell max-w-5xl py-10 md:py-12">
      {/* jsonLd(), never bare JSON.stringify: a role or company name carrying
          "<" would otherwise close the script block and turn data into markup. */}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }} />

      <Breadcrumbs items={breadcrumbs} />

      <header className="mt-4">
        <h1 className="font-display hero-title font-bold text-[color:var(--text-strong)]">{copy.title}</h1>
        <p className="mt-3 max-w-2xl text-[color:var(--text)]">{copy.subtitle}</p>
        <p className="provenance mt-4">
          {copy.updated}: {copy.daysAgo(ageDays)}
          {stages.length > 0 ? ` · ${copy.openCount(openCount, stages.length)}` : ""}
        </p>
      </header>

      {/* The page states its own age. A list of deadlines that quietly goes out
          of date is worse than one that admits it, and this is the failure this
          format is most likely to have. */}
      {stale ? (
        <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <p className="font-semibold text-[color:var(--text-strong)]">{copy.staleTitle}</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">{copy.staleBody}</p>
        </div>
      ) : null}

      {stages.length === 0 ? (
        <p className="mt-8 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-[color:var(--text)]">
          {copy.empty}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {stages.map((stage) => {
            const closed = isClosed(stage);
            return (
              <li
                key={stage.id}
                className={`rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 ${closed ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <h2 className="text-base font-semibold text-[color:var(--text-strong)]">{stage.role}</h2>
                  <span className="text-sm text-[color:var(--muted)]">— {stage.company}</span>
                  {closed ? (
                    <span className="rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[11px] uppercase tracking-wide text-[color:var(--muted)]">
                      {copy.closed}
                    </span>
                  ) : null}
                </div>

                <p className="provenance mt-2">
                  {kindLabel(stage.kind, locale)} · {stage.city}, {countryLabel(stage.country, locale)}
                  {stage.remote ? ` · ${remoteLabel(stage.remote, locale)}` : ""}
                  {stage.duration ? ` · ${stage.duration}` : ""}
                  {stage.level ? ` · ${stage.level}` : ""}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {/* An entry with no published closing date says so plainly.
                      Showing a date we made up would be worse than showing none. */}
                  {stage.deadline ? (
                    <span className="text-sm text-[color:var(--text)]">
                      {copy.deadline} {dateFmt.format(new Date(`${stage.deadline}T12:00:00Z`))}
                    </span>
                  ) : (
                    <span className="text-sm text-[color:var(--muted)]">{copy.rolling}</span>
                  )}
                  {!closed ? (
                    <a href={stage.href} target="_blank" rel="noopener noreferrer" className="btn-secondary px-3 py-1.5 text-xs">
                      {copy.apply}
                    </a>
                  ) : null}
                  {stage.source ? (
                    <span className="text-xs text-[color:var(--muted)]">
                      {copy.source} {stage.source}
                    </span>
                  ) : null}
                  {stage.checkedAt ? (
                    <span className="text-xs text-[color:var(--muted)]">
                      {copy.checked} {dateFmt.format(new Date(`${stage.checkedAt}T12:00:00Z`))}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10">
        <Newsletter locale={locale} source="stages" />
      </div>

      <p className="mt-6 text-sm text-[color:var(--muted)]">
        <Link href={`/${locale}/blog`} className="do-link">
          {locale === "fr" ? "Lire les articles" : "Read the articles"}
        </Link>
      </p>
    </section>
  );
}
