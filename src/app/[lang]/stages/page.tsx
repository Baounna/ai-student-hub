import type { Metadata } from "next";
import { stagesPageTitle } from "@/lib/page-titles";
import Link from "next/link";
import { headers } from "next/headers";
import { Newsletter } from "@/components/newsletter";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";
import { jsonLd } from "@/lib/json-ld";
import { formatDuration, formatLevel } from "@/lib/stage-format";
import { ogImageUrl } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";
import { siteConfig } from "@/config/site";
import { matchesAllTerms, searchTerms } from "@/lib/search";
import {
  countryLabel,
  isRecentlyAdded,
  RECENTLY_ADDED_DAYS,
  type Stage,
  getOpenStages,
  getStages,
  getStagesCheckedAgeDays,
  isClosed,
  isStagesListStale,
  kindLabel,
  remoteLabel
} from "@/content/stages";

const COPY = {
  en: {
    // Regions, not a country list. The exact breakdown is on the next line and
    // is counted from the data; naming countries here meant editing the title
    // every time the board grew, which is how it came to say "Morocco and
    // France" for a list that was 73 French and 9 Moroccan.
    title: stagesPageTitle("en"),
    // <title> only, the same split the posts and news briefs use: the heading
    // above stays readable while the search result fits. The regional title
    // runs to 79 characters with the brand suffix, against a site where every
    // other page sits at 60 or under.
    seoTitle: "AI and cyber internships: Europe, US, Morocco",
    subtitle:
      "Open internships, apprenticeships and final-year projects for students in tech. Checked and updated weekly.",
    empty: "No openings listed yet. The first entries go up this week.",
    closed: "Closed",
    deadline: "Apply by",
    rolling: "Open until filled - no closing date given",
    checked: "link checked",
    apply: "View the offer",
    // Every card renders the same visible link text, so a screen reader's link
    // list was 96 identical "View the offer" entries with nothing to tell them
    // apart. The visible text stays short; the accessible name carries the
    // role and the company that the link actually leads to.
    applyLabel: (role: string, company: string, place: string) => `View the offer: ${role} at ${company}, ${place}`,
    source: "via",
    updated: "Last checked",
    staleTitle: "This list has not been checked recently",
    staleBody:
      "Deadlines below may have passed. It is shown as it was rather than hidden, so you can judge it for yourself.",
    daysAgo: (n: number) => (n === 0 ? "today" : n === 1 ? "yesterday" : `${n} days ago`),
    openCount: (open: number, total: number) => `${open} open of ${total} listed`,
    // Counted from the data on every render, so it cannot drift from the list
    // it describes. The page was titled "Morocco and France" for a list that is
    // 73 French and 9 Moroccan, which is a real thing to offer and not the
    // thing the title promised a Moroccan reader.
    scope: (breakdown: string, security: number, total: number) =>
      `${breakdown}. ${security} of ${total} are security or cyber roles.`,
    filterCountry: "Country",
    filterKind: "Type",
    // "Added", not "Posted". postedAt is the day this board imported the
    // listing, which is a date we can stand behind; the employer's own
    // publication date is not in the data and must not be implied.
    filterAdded: "Added",
    filterRecent: (days: number) => `Last ${days} days`,
    recentBadge: "Recently added",
    filterAll: "All",
    filtersLabel: "Filter openings",
    searchLabel: "Keyword",
    searchHint: "Role, company or city",
    // Every example is checked against the board. "NLP" and "Python" were
    // here first and both return nothing, which would have made the
    // reader's very first query look like a broken filter.
    searchPlaceholder: "cyber, data, Casablanca\u2026",
    searchAction: "Filter",
    filterShowing: (shown: number, total: number) => `Showing ${shown} of ${total}`,
    // Naming the words back is the difference between "nothing here" and
    // "nothing here for that": a reader can see at a glance whether they
    // mistyped, and the total tells them the board is not empty.
    filterNoneQuery: (term: string, total: number) =>
      `Nothing matches \u201c${term}\u201d. All ${total} openings are one click away.`,
    filterClear: "Clear filters",
    // "The others are below" was printed in place of the list, with nothing
    // below it -- the sentence described the layout of a page that renders when
    // there ARE matches. Say the count and give the reader the way out.
    filterNone: (total: number) =>
      `No openings match that combination. All ${total} are one click away.`,
    methodTitle: "What \u201cchecked\u201d means here",
    methodBody:
      "Every link is opened and its page read, not just pinged for a status code \u2014 three postings have answered HTTP 200 while saying, in the body, that they had closed. A listing is removed only after a person confirms it is gone; a refusal to serve us is treated as a fact about us, not about the job. Deadlines are shown only where the employer published one."
  },
  fr: {
    title: stagesPageTitle("fr"),
    seoTitle: "Stages IA et cyber : Europe, USA, Maroc",
    subtitle:
      "Stages, alternances et PFE ouverts aux étudiants en informatique. Vérifiés et mis à jour chaque semaine.",
    empty: "Aucune offre pour le moment. Les premières arrivent cette semaine.",
    closed: "Clôturée",
    deadline: "Candidater avant le",
    rolling: "Ouverte jusqu'à pourvoi - aucune date limite annoncée",
    checked: "lien vérifié le",
    apply: "Voir l'offre",
    applyLabel: (role: string, company: string, place: string) => `Voir l'offre : ${role} chez ${company}, ${place}`,
    source: "via",
    updated: "Dernière vérification",
    staleTitle: "Cette liste n'a pas été vérifiée récemment",
    staleBody:
      "Les dates ci-dessous sont peut-être dépassées. Elle est affichée telle quelle plutôt que masquée, pour que vous puissiez en juger.",
    daysAgo: (n: number) => (n === 0 ? "aujourd'hui" : n === 1 ? "hier" : `il y a ${n} jours`),
    // "(s)" on a line that always knows its own count reads as an untranslated
    // template. The numbers are in hand, so agree properly.
    openCount: (open: number, total: number) =>
      `${open} ${open === 1 ? "ouverte" : "ouvertes"} sur ${total} ${total === 1 ? "référencée" : "référencées"}`,
    scope: (breakdown: string, security: number, total: number) =>
      `${breakdown}. ${security} sur ${total} sont des postes sécurité ou cyber.`,
    filterCountry: "Pays",
    filterKind: "Type",
    filterAdded: "Ajoutées",
    filterRecent: (days: number) => `${days} derniers jours`,
    recentBadge: "Ajoutée récemment",
    filterAll: "Tous",
    filtersLabel: "Filtrer les offres",
    searchLabel: "Mot-cl\u00e9",
    searchHint: "Poste, entreprise ou ville",
    searchPlaceholder: "cyber, ing\u00e9nieur, Casablanca\u2026",
    searchAction: "Filtrer",
    filterShowing: (shown: number, total: number) => `${shown} sur ${total} affichées`,
    filterNoneQuery: (term: string, total: number) =>
      `Aucun r\u00e9sultat pour \u00ab\u00a0${term}\u00a0\u00bb. Les ${total} offres sont \u00e0 un clic.`,
    filterClear: "Effacer les filtres",
    filterNone: (total: number) =>
      `Aucune offre ne correspond à cette combinaison. Les ${total} autres sont à un clic.`,
    methodTitle: "Ce que « vérifié » veut dire ici",
    methodBody:
      "Chaque lien est ouvert et sa page lue, pas seulement testée par code HTTP : trois offres ont répondu 200 tout en indiquant, dans le corps de la page, qu'elles étaient closes. Une offre n'est retirée qu'après vérification humaine ; un refus de nous répondre est traité comme un fait nous concernant, pas comme une fermeture. Les dates limites ne sont affichées que lorsque l'employeur en publie une."
  }
} as const;

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};
  const copy = COPY[params.lang];

  return {
    title: copy.seoTitle,
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

export default async function StagesPage(props: {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  if (!isLocale(params.lang)) return null;
  const locale: Locale = params.lang;
  const copy = COPY[locale];

  const nonce = (await headers()).get("x-csp-nonce") || undefined;

  const stages = getStages();
  const openStages = getOpenStages();
  const openCount = openStages.length;
  // Counted per country rather than naming two, so the line stays true as the
  // list grows past the two it started with.
  const byCountry = new Map<string, number>();
  for (const stage of stages) byCountry.set(stage.country, (byCountry.get(stage.country) ?? 0) + 1);
  const countryBreakdown = [...byCountry.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([code, n]) => `${n} ${countryLabel(code, locale)}`)
    .join(" · ");

  /**
   * Country and kind, read from the URL.
   *
   * Eleven countries and 111 rows in one flat list means a student in
   * Casablanca scrolls past a hundred French listings to find nine, and the
   * scope line above now tells them those nine exist -- which made the absence
   * of a way to reach them worse, not better. Naming a subset you give nobody a
   * route to is its own small cruelty.
   *
   * Links rather than a client component: the filtered view gets a real URL a
   * reader can share or bookmark, it works with JavaScript off, and the page
   * stays a server component. The blog index already filters this way.
   *
   * Validated against what is actually in the data, so a hand-typed ?country=ZZ
   * falls back to everything rather than rendering an empty page.
   */
  const rawCountry = typeof searchParams?.country === "string" ? searchParams.country.toUpperCase() : "";
  const rawKind = typeof searchParams?.kind === "string" ? searchParams.kind.toLowerCase() : "";
  const availableCountries = [...byCountry.keys()].sort(
    (a, b) => (byCountry.get(b) ?? 0) - (byCountry.get(a) ?? 0) || a.localeCompare(b)
  );
  const availableKinds = [...new Set(stages.map((stage) => stage.kind))];
  const countryFilter = availableCountries.includes(rawCountry) ? rawCountry : "";
  const kindFilter = (availableKinds as string[]).includes(rawKind) ? rawKind : "";
  /**
   * A returning reader wants the difference, not the list.
   *
   * Somebody who looked last week has no way to tell what changed without
   * re-reading a hundred rows, so most of them do not come back. postedAt
   * records when a listing was added HERE -- the field says so itself -- which
   * is why every label below says "added" and none of them says "posted".
   * Calling an import date a publication date would tell a student a role is
   * fresher than we know it to be.
   */
  const recentOnly = searchParams?.added === "recent";

  /**
   * Eleven countries and three types do not reach "a pentest internship".
   *
   * The data has no skills field, so the only route to a topic is the words the
   * employer already wrote: a reader after NLP, Kubernetes or Casablanca has to
   * read all 104 rows to find the four.
   *
   * The blog's matcher, not a second one. It already folds accents -- half
   * these roles are French and nobody types "Sécurité" with the accent on a
   * phone -- requires every term, and anchors each at a word boundary, which is
   * what stops "rag" matching "storage". A private copy here would have had to
   * learn all three of those again.
   *
   * Searchable text is what the row actually shows, including the localised
   * country and type, so "maroc" works on the French page and "morocco" on the
   * English one. A reader should not have to guess at a hidden index.
   *
   * A GET form, not a client component: the result has a URL a reader can
   * share, it works with JavaScript off, and the page stays a server component
   * like every other filter here.
   */
  const rawQuery = typeof searchParams?.q === "string" ? searchParams.q.trim().slice(0, 64) : "";
  const terms = searchTerms(rawQuery);
  const matchesQuery = (stage: Stage) =>
    matchesAllTerms(terms, [
      stage.role,
      stage.company,
      stage.city,
      countryLabel(stage.country, locale),
      kindLabel(stage.kind, locale)
    ]);

  /**
   * One predicate for the list and for every count on the page.
   *
   * Each filter used to re-state the others inline, so a fourth dimension meant
   * editing five copies of the same condition and any miss produced the one
   * failure these chips exist to prevent: a number a reader trusts, leading to
   * a page that does not have it. `ignore` drops exactly the dimension whose
   * chip is being counted, which is what "how many would this click give me"
   * means.
   */
  const matches = (stage: Stage, ignore?: "country" | "kind" | "recent") =>
    (ignore === "country" || !countryFilter || stage.country === countryFilter) &&
    (ignore === "kind" || !kindFilter || stage.kind === kindFilter) &&
    (ignore === "recent" || !recentOnly || isRecentlyAdded(stage)) &&
    matchesQuery(stage);

  const filtered = stages.filter((stage) => matches(stage));
  const isFiltered = Boolean(countryFilter || kindFilter || recentOnly || terms.length);
  const hasRecent = stages.some((stage) => isRecentlyAdded(stage));
  const countAcrossCountries = stages.filter((stage) => matches(stage, "country")).length;
  const recentCount = stages.filter(
    (stage) => isRecentlyAdded(stage) && matches(stage, "recent")
  ).length;
  /**
   * Chip counts within the other active filters, not across the whole board.
   *
   * They counted the full list, so with ?country=MA the Type row still read
   * "Apprenticeship (8)" and clicking it delivered nothing: Morocco has no
   * apprenticeships. Sixteen of the thirty country-kind pairs are empty, which
   * made thirty-two chip states advertise a number and hand back an empty page.
   *
   * That is the exact failure these chips were added to avoid -- a count a
   * reader trusts, leading somewhere that does not exist -- and it bit hardest
   * on the Morocco view, which is what they were built for.
   *
   * A chip reading (0) is honest and still clickable; what it must never do is
   * promise eight and deliver none.
   */
  const countInCountry = (code: string) =>
    stages.filter((stage) => stage.country === code && matches(stage, "country")).length;
  const countInKind = (kind: string) =>
    stages.filter((stage) => stage.kind === kind && matches(stage, "kind")).length;
  const filterHref = (next: { country?: string; kind?: string; recent?: boolean }) => {
    const country = next.country ?? countryFilter;
    const kind = next.kind ?? kindFilter;
    const recent = next.recent ?? recentOnly;
    const qs = new URLSearchParams();
    if (country) qs.set("country", country);
    if (kind) qs.set("kind", kind);
    if (recent) qs.set("added", "recent");
    // Kept on every chip, or narrowing a search by country would silently
    // throw the search away and hand back the whole country.
    if (rawQuery) qs.set("q", rawQuery);
    const query = qs.toString();
    return query ? `/${locale}/stages?${query}` : `/${locale}/stages`;
  };
  // Matched on the role text because the data has no field for it. Deliberately
  // broad: the claim is "security or cyber", and over-counting a borderline
  // role is a smaller error than telling a reader the list is general tech.
  const securityCount = stages.filter((stage) =>
    /cyber|s[\u00e9e]curit|\bSOC\b|\bSSI\b|pentest|forensic|\bIAM\b|\bCERT\b|vuln/i.test(stage.role)
  ).length;
  const stale = isStagesListStale();
  // Derived from the entries, not from the file's mtime: see
  // getStagesLastCheckedAt. The two disagreed by a day and the page showed the
  // flattering one.
  const ageDays = getStagesCheckedAgeDays();

  // One array feeds both the visible trail and the schema, so the markup and
  // the structured data cannot drift apart - a BreadcrumbList that disagrees
  // with the breadcrumbs on the page is exactly what Search Console flags.
  const breadcrumbs = [{ label: siteConfig.brandName, href: `/${locale}` }, { label: copy.title }];

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
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }} />

      <Breadcrumbs items={breadcrumbs} locale={locale} />

      <header className="mt-4">
        <h1 className="font-display hero-title font-bold text-[color:var(--text-strong)]">{copy.title}</h1>
        <p className="mt-3 max-w-2xl text-[color:var(--text)]">{copy.subtitle}</p>
        <p className="provenance mt-4">
          {copy.updated}: {copy.daysAgo(ageDays)}
          {stages.length > 0 ? ` · ${copy.openCount(openCount, stages.length)}` : ""}
        </p>
        {/* The shape of the list, in its own numbers. The title said "Morocco
            and France" over 73 French listings and 9 Moroccan ones, and said
            nothing about three quarters of the roles being security work -- so
            a reader arrived expecting one list and found another. Counted at
            render time rather than written down, so it stays true as the list
            changes and nobody has to remember to update it. */}
        {stages.length > 0 ? (
          <p className="provenance mt-1">{copy.scope(countryBreakdown, securityCount, stages.length)}</p>
        ) : null}
      </header>

      {/* What the weekly check actually does. All of this was written down in
          code comments and commit messages, where a student deciding whether to
          trust the list cannot read it. */}
      {stages.length > 0 ? (
        <section className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <h2 className="text-sm font-semibold text-[color:var(--text-strong)]">{copy.methodTitle}</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">{copy.methodBody}</p>
        </section>
      ) : null}

      {/* The page states its own age. A list of deadlines that quietly goes out
          of date is worse than one that admits it, and this is the failure this
          format is most likely to have. */}
      {stale ? (
        <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <p className="font-semibold text-[color:var(--text-strong)]">{copy.staleTitle}</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">{copy.staleBody}</p>
        </div>
      ) : null}

      {/* Links, not a client component: each filtered view gets a URL a reader
          can share, it works without JavaScript, and the page stays a server
          component. Counts sit on the chips because "9 Morocco" is the fact
          that decides whether the click is worth it. */}
      {stages.length > 0 ? (
        <nav className="mt-6 space-y-2" aria-label={copy.filtersLabel}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="provenance mr-1">{copy.filterCountry}</span>
            <Link
              href={filterHref({ country: "" })}
              aria-current={countryFilter ? undefined : "true"}
              className={`tap-target rounded-full border px-3 py-1 text-xs transition ${
                countryFilter
                  ? "border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]"
                  : "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
              }`}
            >
              {/* Counted under whatever else is active, like every other chip
                  here. Printing the board's full total while a filter narrows
                  the page is the bug this convention exists to prevent: a
                  number on a chip has to be the number of rows the click
                  produces. */}
              {copy.filterAll} ({countAcrossCountries})
            </Link>
            {availableCountries.map((code) => (
              <Link
                key={code}
                href={filterHref({ country: code })}
                aria-current={countryFilter === code ? "true" : undefined}
                className={`tap-target rounded-full border px-3 py-1 text-xs transition ${
                  countryFilter === code
                    ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                    : "border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]"
                }`}
              >
                {countryLabel(code, locale)} ({countInCountry(code)})
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="provenance mr-1">{copy.filterKind}</span>
            <Link
              href={filterHref({ kind: "" })}
              aria-current={kindFilter ? undefined : "true"}
              className={`tap-target rounded-full border px-3 py-1 text-xs transition ${
                kindFilter
                  ? "border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]"
                  : "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
              }`}
            >
              {copy.filterAll}
            </Link>
            {availableKinds.map((kind) => (
              <Link
                key={kind}
                href={filterHref({ kind })}
                aria-current={kindFilter === kind ? "true" : undefined}
                className={`tap-target rounded-full border px-3 py-1 text-xs transition ${
                  kindFilter === kind
                    ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                    : "border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]"
                }`}
              >
                {kindLabel(kind, locale)} ({countInKind(kind)})
              </Link>
            ))}
          </div>
          {/* Only when there is something to show. A chip offering "the last
              seven days" on a board where nothing was added in seven days
              sends the reader to an empty page and makes the site look
              abandoned, which is the opposite of what the chip is for. */}
          {hasRecent ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="provenance mr-1">{copy.filterAdded}</span>
              <Link
                href={filterHref({ recent: false })}
                aria-current={recentOnly ? undefined : "true"}
                className={`tap-target rounded-full border px-3 py-1 text-xs transition ${
                  recentOnly
                    ? "border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]"
                    : "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                }`}
              >
                {copy.filterAll}
              </Link>
              <Link
                href={filterHref({ recent: true })}
                aria-current={recentOnly ? "true" : undefined}
                className={`tap-target rounded-full border px-3 py-1 text-xs transition ${
                  recentOnly
                    ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                    : "border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--text)]"
                }`}
              >
                {copy.filterRecent(RECENTLY_ADDED_DAYS)} ({recentCount})
              </Link>
            </div>
          ) : null}
          {/* "Keyword", not "Search", and last in the group rather than first.
              The header already carries a site-wide search box with typeahead
              that indexes these internships among the guides and tools; a
              second input labelled "Search" at the top of the same page reads
              as a duplicate and leaves the reader guessing which one they are
              in. This one does a different job -- it narrows the 104 rows in
              place and the result keeps its URL -- so it is named for the
              dimension it filters on, beside Country, Type and Added.

              A plain GET form. method defaults to get, so with JavaScript off
              this still works, and the result is a shareable URL rather than
              client state.

              The active chips ride along as hidden inputs: a form submit
              replaces the whole query string, so without these, searching
              inside ?country=MA would quietly drop the reader back to all
              eleven countries -- a filter undoing itself is worse than no
              search at all.

              min-w-0 on the input, for the reason written on the Turnstile
              widget: a flex child keeps its intrinsic minimum width and pushes
              the row wider than the card, and the overflow is then clipped
              rather than scrollable. basis-48 lets it shrink on a phone. */}
          <form action={`/${locale}/stages`} method="get" className="flex flex-wrap items-center gap-2">
            {countryFilter ? <input type="hidden" name="country" value={countryFilter} /> : null}
            {kindFilter ? <input type="hidden" name="kind" value={kindFilter} /> : null}
            {recentOnly ? <input type="hidden" name="added" value="recent" /> : null}
            <label htmlFor="stages-q" className="provenance mr-1">
              {copy.searchLabel}
            </label>
            <input
              id="stages-q"
              type="search"
              name="q"
              defaultValue={rawQuery}
              maxLength={64}
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchHint}
              className="tap-target min-w-0 flex-1 basis-48 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--text)] placeholder:text-[color:var(--muted)]"
            />
            <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
              {copy.searchAction}
            </button>
          </form>
          {isFiltered ? (
            <p className="provenance">
              {copy.filterShowing(filtered.length, stages.length)} ·{" "}
              <Link href={`/${locale}/stages`} className="do-link py-1.5">
                {copy.filterClear}
              </Link>
            </p>
          ) : null}
        </nav>
      ) : null}

      {stages.length === 0 ? (
        <p className="mt-8 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-[color:var(--text)]">
          {copy.empty}
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-[color:var(--text)]">
          {rawQuery ? copy.filterNoneQuery(rawQuery, stages.length) : copy.filterNone(stages.length)}{" "}
          <Link href={`/${locale}/stages`} className="do-link py-1.5">
            {copy.filterClear}
          </Link>
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((stage) => {
            const closed = isClosed(stage);
            // Listings arrive in whatever language the employer posted in, so
            // half the board showed "3 MOIS MINIMUM" and "BAC+3" beside a
            // translated "UNITED KINGDOM". Formatting at render time fixes the
            // rows that exist and every row added later.
            // Not every employer publishes a city -- Cohere lists these two
            // roles as "Canada", remote. The city field held the placeholder
            // "Remote", so the row read "Remote, Canada · Remote".
            const place = stage.city
              ? `${stage.city}, ${countryLabel(stage.country, locale)}`
              : countryLabel(stage.country, locale);
            const durationText = formatDuration(stage.duration, locale);
            const levelText = formatLevel(stage.level, locale);
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
                  {/* "Recently added", not "New": the role may have been
                      advertised for months before this board picked it up, and
                      a student reading "new" would reasonably hear "just
                      opened". Not shown on a closed row, where a badge drawing
                      the eye to a dead listing would only sting. */}
                  {!closed && isRecentlyAdded(stage) ? (
                    <span className="rounded-full border border-[color:var(--primary)] px-2 py-0.5 text-[11px] uppercase tracking-wide text-[color:var(--primary)]">
                      {copy.recentBadge}
                    </span>
                  ) : null}
                </div>

                <p className="provenance mt-2">
                  {kindLabel(stage.kind, locale)} · {place}
                  {stage.remote ? ` · ${remoteLabel(stage.remote, locale)}` : ""}
                  {durationText ? ` · ${durationText}` : ""}
                  {levelText ? ` · ${levelText}` : ""}
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
                    <a
                      href={stage.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={copy.applyLabel(stage.role, stage.company, place)}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
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
        <Link href={`/${locale}/blog`} className="do-link py-1.5">
          {locale === "fr" ? "Lire les articles" : "Read the articles"}
        </Link>
      </p>
    </section>
  );
}
