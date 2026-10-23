import type { Metadata } from "next";
import Link from "next/link";
import { StageRow, stagesCopy } from "./shared";
import { countriesWithPages, countryPagePath, isSecurityRole } from "@/content/stage-countries";
import { headers } from "next/headers";
import { Newsletter } from "@/components/newsletter";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates, openGraphDefaults } from "@/i18n/helpers";
import { jsonLd } from "@/lib/json-ld";
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
  isStagesListStale,
  kindLabel
} from "@/content/stages";

const COPY = stagesCopy;

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};
  const copy = COPY[params.lang];

  return {
    title: copy.seoTitle,
    description: copy.subtitle,
    openGraph: {
      ...openGraphDefaults(params.lang),
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
   * One chip, drawn once.
   *
   * Seven copies of this class string sat inline, and the inactive branch of
   * every one of them drew its edge with --border: 1.29:1 against the page
   * ground in light, 1.44:1 in dark, over no fill at all. Fifteen of the
   * seventeen chips were in that state at any one moment, so the filter row --
   * the control this whole page is steered with -- was a set of words with
   * nothing around them. WCAG 1.4.11 asks 3:1 for the boundary of a control, and
   * --control-border is the token this site already keeps for that: 3.45:1 on
   * the page in light, 4.66:1 in dark. .blog-chip on the news and blog indexes
   * has been drawn with it all along, which is what made this the odd one out,
   * on the busier page.
   *
   * The active chip was never the problem -- a filled --primary pill at 9.24:1
   * -- and because it differs by fill and not only by hue it satisfies 1.4.1
   * as well. It keeps exactly the look it had.
   */
  const chipClass = (active: boolean) =>
    `tap-target rounded-full border px-3 py-1 text-xs transition ${
      active
        ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
        : "border-[color:var(--control-border)] text-[color:var(--muted)] hover:text-[color:var(--text)]"
    }`;
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
  /**
   * Four countries, then a disclosure for the other eight.
   *
   * The data has twelve countries, so the Country row rendered thirteen chips,
   * each forced to 44px of height by .tap-target. At 360px the content box is
   * 332px wide -- .page-shell drops to 0.875rem of padding under 480px -- and
   * those thirteen chips wrapped to five rows, about 250px, before Type, Added
   * and the search form added their own. Something like 550 to 600px of filter
   * chrome, under a hero that already spends roughly 700px on a three-line
   * title, a four-line subtitle and a five-line scope note, which put the
   * first actual internship about 1,300px down a page whose entire purpose is
   * internships.
   *
   * Four, because the top four countries are 82 of the 94 listings. Eight of
   * the twelve have four listings or fewer, and those are the ones worth a
   * click to reach rather than four rows of standing cost for every reader.
   *
   * <details> rather than a toggle: it needs no JavaScript, a keyboard opens
   * it with Enter or Space for free, and the chips inside stay real <Link>s
   * with real URLs. Its open state is read off the URL -- if the reader is
   * looking at one of the tail countries, the group that contains it is open
   * -- so the view is still fully described by the address bar, and a soft
   * navigation that remounts the page cannot lose it.
   */
  const COUNTRY_CHIPS_SHOWN = 4;
  const leadCountries = availableCountries.slice(0, COUNTRY_CHIPS_SHOWN);
  const tailCountries = availableCountries.slice(COUNTRY_CHIPS_SHOWN);
  const countryPages = countriesWithPages();
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
  //
  // The pattern lives in stage-countries.ts because the country pages decide
  // from the same count whether their title may say "cybersecurity" at all.
  // Two copies of it meant two answers to one question were a typo apart, and
  // the one that drifted would have been the one deciding whether a page
  // promises something it does not have.
  const securityCount = stages.filter((stage) => isSecurityRole(stage.role)).length;
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
      </header>

      {/* The page states its own age. A list of deadlines that quietly goes out
          of date is worse than one that admits it, and this is the failure this
          format is most likely to have. */}
      {stale ? (
        <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          {/* A heading, not a bolded paragraph. This is the one warning on the
              page, and somebody navigating by headings -- which is how a screen
              reader user skims a long page -- passed straight over it to the
              listings, because nothing in the markup said it was a section of
              its own. It looked like a heading to everyone who could see it,
              which is exactly the gap WCAG 1.3.1 is about. */}
          <h2 className="font-semibold text-[color:var(--text-strong)]">{copy.staleTitle}</h2>
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
              className={chipClass(!countryFilter)}
            >
              {/* Counted under whatever else is active, like every other chip
                  here. Printing the board's full total while a filter narrows
                  the page is the bug this convention exists to prevent: a
                  number on a chip has to be the number of rows the click
                  produces. */}
              {copy.filterAll} ({countAcrossCountries})
            </Link>
            {leadCountries.map((code) => (
              <Link
                key={code}
                href={filterHref({ country: code })}
                aria-current={countryFilter === code ? "true" : undefined}
                className={chipClass(countryFilter === code)}
              >
                {countryLabel(code, locale)} ({countInCountry(code)})
              </Link>
            ))}
            {/* The other eight. See COUNTRY_CHIPS_SHOWN for why they are behind
                a disclosure and why its open state comes from the URL. */}
            {tailCountries.length ? (
              <details open={tailCountries.includes(countryFilter)} className="w-full">
                {/* .chip-summary draws the caret back on: .tap-target makes
                    this inline-flex to reach 44px, and that takes the
                    browser's own disclosure triangle away, leaving a pill
                    indistinguishable from the filter chips beside it. */}
                <summary className="chip-summary tap-target inline-flex cursor-pointer rounded-full border border-[color:var(--control-border)] px-3 py-1 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--text)]">
                  {copy.filterMoreCountries(tailCountries.length)}
                </summary>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {tailCountries.map((code) => (
                    <Link
                      key={code}
                      href={filterHref({ country: code })}
                      aria-current={countryFilter === code ? "true" : undefined}
                      className={chipClass(countryFilter === code)}
                    >
                      {countryLabel(code, locale)} ({countInCountry(code)})
                    </Link>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
          {/* Type and Added on one line. Three chips and three chips, with the
              widest pair of labels in either language coming to well under the
              332px a 360px screen gives this page -- they were costing two
              rows of 44px each to say six short words. gap-x-5 keeps the two
              groups readable as two groups; they fall back to their own rows
              as soon as they stop fitting, which is what flex-wrap is for. */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="provenance mr-1">{copy.filterKind}</span>
              <Link
                href={filterHref({ kind: "" })}
                aria-current={kindFilter ? undefined : "true"}
                className={chipClass(!kindFilter)}
              >
                {copy.filterAll}
              </Link>
              {availableKinds.map((kind) => (
                <Link
                  key={kind}
                  href={filterHref({ kind })}
                  aria-current={kindFilter === kind ? "true" : undefined}
                  className={chipClass(kindFilter === kind)}
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
                  className={chipClass(!recentOnly)}
                >
                  {copy.filterAll}
                </Link>
                <Link
                  href={filterHref({ recent: true })}
                  aria-current={recentOnly ? "true" : undefined}
                  className={chipClass(recentOnly)}
                >
                  {copy.filterRecent(RECENTLY_ADDED_DAYS)} ({recentCount})
                </Link>
              </div>
            ) : null}
          </div>
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
              rather than scrollable. basis-48 lets it shrink on a phone.

              role="search": a <form> is a plain group to assistive technology
              unless it is told otherwise, so this one was not in the list of
              landmarks a screen reader offers, and the one way to narrow 94
              rows by keyword was not among the places it suggests jumping to.
              /compare's tool search has carried the role since it was built;
              this form, on the page the site is organised around, did not. */}
          <form action={`/${locale}/stages`} method="get" role="search" className="flex flex-wrap items-center gap-2">
            {countryFilter ? <input type="hidden" name="country" value={countryFilter} /> : null}
            {kindFilter ? <input type="hidden" name="kind" value={kindFilter} /> : null}
            {recentOnly ? <input type="hidden" name="added" value="recent" /> : null}
            <label htmlFor="stages-q" className="provenance mr-1">
              {copy.searchLabel}
            </label>
            {/* The visible label must be contained in the accessible name, or
                somebody using voice control cannot say the word they can see.
                aria-label used to REPLACE the visible "Keyword" with "Role,
                company or city", so "click Keyword" matched nothing.

                --control-border, not --border. This box is white on a #fbfaf7
                page -- 1.04:1 -- so the hairline around it was the only thing
                saying where to type, and at 1.35:1 it was not saying it: on a
                bright phone screen outdoors there is simply no box there. The
                comment on --control-border names "the keyword filter" as one
                of the three it was introduced for, but the token only ever
                reached .field-input, .search-input and .header-search-shell,
                and this input is hand-rolled from Tailwind arbitrary values,
                so it was missed. The blog's own search box, which is the same
                control, has been at 3.51:1 the whole time; this is now
                3.60:1. */}
            <input
              id="stages-q"
              type="search"
              name="q"
              defaultValue={rawQuery}
              maxLength={64}
              placeholder={copy.searchPlaceholder}
              aria-label={`${copy.searchLabel} — ${copy.searchHint}`}
              className="tap-target min-w-0 flex-1 basis-48 rounded-full border border-[color:var(--control-border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--text)] placeholder:text-[color:var(--muted)]"
            />
            <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
              {copy.searchAction}
            </button>
          </form>
          {/*
            * Clicking a filter was completely silent to a screen reader.
            *
            * Every chip here is a <Link>, so a click is a soft navigation, and
            * the only thing Next announces on one is a change of
            * document.title -- verified in the installed version, at
            * app-router-announcer.js, which compares the new title with the
            * previous one and announces nothing when they match.
            * generateMetadata on this route returns the same copy.seoTitle for
            * every filter state, by design, so there is nothing for it to say.
            * Focus also stays on the chip, which does not move.
            *
            * That left "Showing 8 of 94" as the only report of what happened,
            * and it was rendered only when isFiltered -- inserted into the DOM
            * at the same moment it had something to say. A live region added
            * at the moment of the change is not reliably announced: the screen
            * reader has to already be watching it. This is the identical
            * failure written up on the newsletter form, where each status box
            * carried its own aria-live and the result of a submit was dropped
            * on the floor.
            *
            * So: a blind reader clicked "Morocco (8)", 94 rows became 8, and
            * nothing was said at all. The paragraph now always exists and only
            * its text changes. The count is the live region; "Clear filters"
            * sits outside it, because a link's label is not news and would be
            * read out again on every single filter click.
            */}
          <p className="provenance">
            <span role="status" aria-live="polite">
              {isFiltered ? copy.filterShowing(filtered.length, stages.length) : ""}
            </span>
            {isFiltered ? (
              <>
                <span aria-hidden="true">·</span>
                <Link href={`/${locale}/stages`} className="do-link py-1.5">
                  {copy.filterClear}
                </Link>
              </>
            ) : null}
          </p>
        </nav>
      ) : null}

      {/* Real links to the country boards, not just sitemap entries.
          A page only in the sitemap is an orphan: nothing points at it, so it
          is crawled late and ranked as though nothing on the site considers it
          worth linking to. These are also the fastest route for a reader who
          only wants one country -- the filter chips above keep the query-string
          view, which stays canonicalised to this page. */}
      {countryPages.length ? (
        <nav className="mt-8" aria-label={copy.countryPagesLabel}>
          <p className="provenance">{copy.countryPagesLabel}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {countryPages.map((code) => (
              <Link
                key={code}
                href={countryPagePath(code, locale)}
                className={chipClass(false)}
              >
                {countryLabel(code, locale)} ({byCountry.get(code) ?? 0})
              </Link>
            ))}
          </div>
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
        <ul className="mt-6 divide-y divide-[color:var(--border)] border-t border-[color:var(--border)]">
          {filtered.map((stage) => (
              <StageRow key={stage.id} stage={stage} locale={locale} copy={copy} dateFmt={dateFmt} />
          ))}
        </ul>
      )}

      <div className="mt-10">
      {/* What the weekly check actually does. All of this was written down in
          code comments and commit messages, where a student deciding whether to
          trust the list cannot read it.

          Below the listings, not above them. It sat between the subtitle and
          the filters: five lines about HTTP 200 responses and human
          verification standing between a student arriving from a search and
          the jobs they came for. The claim is worth making and worth keeping
          in full -- it is the one thing this board has that a scraper does not
          -- but a reader earns the explanation after seeing what it describes.
          404 Media puts its mission statement below the first story for the
          same reason. */}
      {stages.length > 0 ? (
        <section className="mt-10 border-t border-[color:var(--border)] pt-6">
          <h2 className="text-sm font-semibold text-[color:var(--text-strong)]">{copy.methodTitle}</h2>
          <p className="mt-1 max-w-[70ch] text-sm text-[color:var(--muted)]">{copy.methodBody}</p>
          {/* The shape of the list, in its own numbers. The title said "Morocco
              and France" over 73 French listings and 9 Moroccan ones, and said
              nothing about three quarters of the roles being security work --
              so a reader arrived expecting one list and found another. Counted
              at render time rather than written down, so it stays true as the
              list changes and nobody has to remember to update it.

              Moved down here, beside the method note, for the same reason the
              method note was moved down: it is 198 characters of 12px
              uppercase monospace with 0.05em of tracking, which is five lines
              at 332px, and it sat third in the hero. A student arriving from a
              search for "stage IA Casablanca" read a title, a subtitle and
              then a five-line inventory of the whole board before reaching a
              single filter, let alone a job. It is the right paragraph to have
              and the wrong one to open with -- and it reads better here, where
              it is the numbers behind the claim the note has just made. */}
          <p className="provenance mt-3">{copy.scope(countryBreakdown, securityCount, stages.length)}</p>
        </section>
      ) : null}

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
