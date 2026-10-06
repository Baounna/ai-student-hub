import { stagesPageTitle } from "@/lib/page-titles";
import type { Locale } from "@/i18n/config";
import { formatDuration, formatLevel } from "@/lib/stage-format";
import { countryLabel, isClosed, isRecentlyAdded, kindLabel, remoteLabel, type Stage } from "@/content/stages";

/**
 * Shared by /stages and /stages/[country].
 *
 * Both render the same listing, and a row is the one place on this site where a
 * wrong word costs a student an application: a stale "link checked" date, a
 * duration left in the employer's language, an eligibility level that says
 * something the data does not. Two copies of this JSX would drift, and the two
 * faults fixed this week were both exactly that -- a freshness rule kept in two
 * places that disagreed, and a review signal the workflow and the script spelt
 * differently.
 */
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
    // Shown instead of a date, never beside one. "link checked 1 October" on a
    // row nobody could read is the kind of small untruth this page exists not
    // to tell, and the date would sit there unchanged for as long as the
    // listing stands.
    notVerified: "we could not verify this link",
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
    countryPagesLabel: "Internships by country",
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
    notVerified: "nous n'avons pas pu vérifier ce lien",
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
    countryPagesLabel: "Les stages par pays",
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

export type StageCopy = (typeof COPY)[Locale];
export const stagesCopy = COPY;

export function StageRow({
  stage,
  locale,
  copy,
  dateFmt
}: {
  stage: Stage;
  locale: Locale;
  copy: StageCopy;
  dateFmt: Intl.DateTimeFormat;
}) {
  const closed = isClosed(stage);
  // Not every employer publishes a city -- Cohere lists two roles as "Canada",
  // remote, and the city field held the placeholder "Remote", so the row read
  // "Remote, Canada - Remote". A missing city is absent, never a placeholder.
  const place = stage.city
    ? `${stage.city}, ${countryLabel(stage.country, locale)}`
    : countryLabel(stage.country, locale);
  // Listings arrive in whatever language the employer posted in, so half the
  // board showed "3 MOIS MINIMUM" beside a translated "UNITED KINGDOM".
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
        {stage.unverifiable ? (
          <span className="text-xs text-[color:var(--muted)]">{copy.notVerified}</span>
        ) : stage.checkedAt ? (
          <span className="text-xs text-[color:var(--muted)]">
            {copy.checked} {dateFmt.format(new Date(`${stage.checkedAt}T12:00:00Z`))}
          </span>
        ) : null}
      </div>
    </li>
  );
}
