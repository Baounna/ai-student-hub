import { stagesPageTitle } from "@/lib/page-titles";
import type { Locale } from "@/i18n/config";
import { formatDuration, formatLevel } from "@/lib/stage-format";
import { titleLanguage } from "@/lib/title-lang";
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
    // There was a "rolling" line here -- "Open until filled - no closing date
    // given", 40 characters -- and 92 of the 94 rows printed it, because only
    // two listings in the data carry a deadline at all. So the single longest
    // piece of text in the metadata block was the same sentence repeated 92
    // times, saying nothing that distinguished one row from the next, and on a
    // 332px screen it cost a line of its own on nearly every row. The fact is
    // worth stating once: the method note already closes with "Deadlines are
    // shown only where the employer published one", in both languages, and
    // that note now renders on the country pages too. The slot stays for the
    // two rows that have something to put in it.
    checked: "link checked",
    // Shown instead of a date, never beside one. "link checked 1 October" on a
    // row nobody could read is the kind of small untruth this page exists not
    // to tell, and the date would sit there unchanged for as long as the
    // listing stands.
    notVerified: "we could not verify this link",
    // Said on the row, because the method note is at the bottom of the page and
    // a reader deciding on one listing should not have to go looking for which
    // kind it is.
    fromFeed: "from the employer's job feed",
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
    // The count is in the label, so the disclosure is a decision rather than a
    // guess: a reader can tell at a glance whether there are eight more
    // countries behind it or one. See COUNTRY_CHIPS_SHOWN on the board page.
    filterMoreCountries: (n: number) => `More countries (${n})`,
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
    /*
     * The check this describes, not the strongest version of it.
     *
     * Two sentences here promised a reader evidence the weekly run does not
     * collect. One said the check "re-confirms them against that same API":
     * only the Workday rows are asked of an employer API every run -- three of
     * the twenty-three feed listings. Greenhouse is consulted only when the
     * site refuses us, and no SmartRecruiters API is called at all, so the
     * eleven Wavestone and Bosch rows are judged on the words on their page
     * like everything else. The other said the link is fetched "either way ...
     * every week": the run answers from the employer's board and returns
     * before fetching the page for twelve rows, eight Workday and four Ashby,
     * whose public pages are a JavaScript shell with nothing in them to read.
     *
     * So a student weighing one row against another was told both carried the
     * stronger kind of proof, when only a dozen of them do. Saying which is
     * which is the better claim anyway: asking the employer's own board beats
     * reading a page, and the rows where that is possible can say so.
     */
    methodBody:
      "Listings arrive two ways, and each row says which. Most were opened and read by a person before being typed in. The rest come straight from the employer's own job API \u2014 Greenhouse, Ashby, SmartRecruiters or Workday \u2014 so the title, company and location are the employer's own fields rather than anyone's transcription. Those are published only after their link has been fetched and answered, never on the API's word alone. Every row is then re-checked weekly, and what that check can ask depends on where the posting lives: a Workday or Ashby posting is asked of the employer's own board, because its public page is a JavaScript shell with no words in it and the board's own answer is better evidence than a page nobody can read. Every other link is fetched and its page read, not just pinged for a status code: postings regularly answer HTTP 200 while saying, in the body, that they have closed, and a listing proved gone is removed by that check rather than waiting for someone to be free. A refusal to serve us is treated as a fact about us, not about the job \u2014 and where the posting sits on Greenhouse, we ask Greenhouse before concluding anything. Deadlines are shown only where the employer published one."
  },
  fr: {
    title: stagesPageTitle("fr"),
    seoTitle: "Stages IA et cyber : Europe, USA, Maroc",
    subtitle:
      "Stages, alternances et PFE ouverts aux étudiants en informatique. Vérifiés et mis à jour chaque semaine.",
    empty: "Aucune offre pour le moment. Les premières arrivent cette semaine.",
    closed: "Clôturée",
    deadline: "Candidater avant le",
    // Retirée pour la même raison qu'en anglais : 92 lignes sur 94 affichaient
    // la même phrase. La note de méthode la dit une fois, en bas de page.
    checked: "lien vérifié le",
    notVerified: "nous n'avons pas pu vérifier ce lien",
    fromFeed: "via le flux de recrutement de l'employeur",
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
    filterMoreCountries: (n: number) => `Autres pays (${n})`,
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
    /*
     * Les deux mêmes exagérations, en français, et pas dans les mêmes mots :
     * « les reconfirme auprès de cette même API » et « dans les deux cas le
     * lien est ouvert ». Un lecteur francophone se faisait donc promettre
     * exactement ce qu'on promettait à tort en anglais, sur une page dont la
     * traduction n'avait jamais été relue à côté du script. Corrigé d'après
     * check-stages.mjs, pas traduit de la version anglaise.
     */
    methodBody:
      "Les offres arrivent de deux façons, et chaque ligne indique laquelle. La plupart ont été ouvertes et lues par une personne avant d'être saisies. Les autres viennent directement de l'API de recrutement de l'employeur \u2014 Greenhouse, Ashby, SmartRecruiters ou Workday \u2014 : l'intitulé, l'entreprise et le lieu sont donc les champs de l'employeur et non une retranscription. Celles-là ne sont publiées qu'une fois leur lien ouvert et une réponse obtenue, jamais sur la seule parole de l'API. Chaque ligne est ensuite revérifiée chaque semaine, et ce que la vérification peut demander dépend de l'endroit où l'offre est hébergée : une offre Workday ou Ashby est demandée au portail de recrutement de l'employeur lui-même, parce que sa page publique n'est qu'une coquille JavaScript sans aucun texte et que la réponse du portail vaut mieux qu'une page que personne ne peut lire. Tous les autres liens sont ouverts et leur page lue, pas seulement testés par code HTTP : des offres répondent régulièrement 200 tout en indiquant, dans le corps de la page, qu'elles sont closes, et une offre dont la fermeture est établie est retirée par cette vérification, sans attendre que quelqu'un soit disponible. Un refus de nous répondre est traité comme un fait nous concernant, pas comme une fermeture \u2014 et lorsque l'offre est hébergée chez Greenhouse, nous interrogeons Greenhouse avant de conclure quoi que ce soit. Les dates limites ne sont affichées que lorsque l'employeur en publie une."
  }
} as const;

export type StageCopy = (typeof COPY)[Locale];
export const stagesCopy = COPY;

/**
 * Where a listing is, written the way a reader can read it.
 *
 * Not every employer publishes a city -- Cohere lists its two internships as
 * "Canada", remote, with no city -- and the field was once filled with the
 * placeholder "Remote", which made a row read "Remote, Canada - Remote". The
 * board has handled that since; the home page had not, and interpolated the
 * city raw into both its visible line and its link label, so a city-less row
 * there would read "- Cohere  , Canada" and be announced as ", undefined".
 * One function now, used by both, so the next page to list a stage cannot
 * reintroduce it.
 */
export function placeLabel(stage: Stage, locale: Locale): string {
  return stage.city ? `${stage.city}, ${countryLabel(stage.country, locale)}` : countryLabel(stage.country, locale);
}

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
  // A missing city is absent, never a placeholder. See placeLabel.
  const place = placeLabel(stage, locale);
  // Listings arrive in whatever language the employer posted in, so half the
  // board showed "3 MOIS MINIMUM" beside a translated "UNITED KINGDOM".
  const durationText = formatDuration(stage.duration, locale);
  const levelText = formatLevel(stage.level, locale);
  const roleLang = titleLanguage(stage.role, locale);
  /*
   * The row's secondary facts, in the order a reader asks for them.
   *
   * Kind and place answer "is this for me and is it near me"; remote, duration
   * and level are the follow-up. Splitting them lets the first pair carry the
   * row's own weight while the rest stays quiet, which is the thing this row
   * did not have: at 332px it printed five consecutive lines in the same weak
   * grey, so there was nothing to read first.
   */
  const detail = [
    stage.remote ? remoteLabel(stage.remote, locale) : "",
    durationText,
    levelText
  ]
    .filter(Boolean)
    .join(" · ");
  /*
   * Where the row came from and when it was last looked at, on one line.
   *
   * These were three or four separate spans in a flex-wrap row -- "via
   * Capgemini careers", "from the employer's job feed", "link checked 21
   * October 2026" and, when the listing was new, "Recently added" -- and at
   * 332px each one wrapped onto a line of its own. Every row on the board
   * carries a source and a check verdict, so that is three to four lines of
   * 12px grey text per listing, 94 times over, none of them ranked above the
   * others. They answer one question between them, which is how much this row
   * can be trusted, so they are one sentence now.
   *
   * The comment further down already argued that the recency signal belongs on
   * the line a reader is reading for dates rather than in a badge beside it,
   * and then the implementation added a separate span anyway. This is that
   * argument carried out: same line, same sentence, recoloured and bolded.
   */
  const recent = !closed && isRecentlyAdded(stage);
  const origin = [stage.source ? `${copy.source} ${stage.source}` : "", stage.addedBy === "feed" ? copy.fromFeed : ""]
    .filter(Boolean)
    .join(" · ");
  const hasVerdict = Boolean(stage.unverifiable || stage.checkedAt);
  /*
   * A row, not a card.
   *
   * This was rounded-xl + border + bg-surface + p-4 on every one of 102
   * listings. A card is padding on four sides plus a border plus a radius --
   * roughly 48px of vertical cost per row, about 4,900px of scroll across
   * the board, buying nothing a rule does not. Every text-only board
   * measured for this does it with a hairline or a tint instead: LinkedIn
   * uses `border-bottom: 1px solid #e6e9ec` and no card at all, Platformer a
   * 1px rule at 8% black, hnhiring plain zebra stripes, and freeCodeCamp
   * ships zero shadows and zero rounded corners across its whole page. The
   * home page here already listed internships this way with divide-y; the
   * board, which has forty times as many, did not.
   */
  return (
    /*
     * A closed row is de-emphasised by its own tokens, not by multiplying good
     * ones by 0.6.
     *
     * opacity-60 was applied to the whole row, which took --muted from 6.19:1
     * down to 2.97:1 against the page and put --text exactly on the 4.50
     * boundary -- so a closed listing's badge, kind, place, provenance and
     * check date all fell at or below readable. WCAG 1.4.3 exempts disabled
     * CONTROLS, not de-emphasised content, and the comment higher up this file
     * says the row is shown precisely so a reader can judge it for themselves.
     *
     * It was latent until 28 October, when the first deadline on the board
     * lapsed and a closed row appeared for real.
     *
     * The de-emphasis survives: the "Closed" badge says so in words, and the
     * title drops from --text-strong to --muted, which is a computable 6.19:1
     * rather than whatever 0.6 happens to produce.
     */
    <li key={stage.id} className="py-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {/*
          * The title's own language, when it can be told.
          *
          * /en/stages serves <html lang="en"> over 62 French headings, so a
          * screen reader voices "Stage - Administrateur sécurité systèmes
          * d'information" through an English synthesiser -- phoneme soup, on
          * more than half the rows of the page this site is built around --
          * and a braille display picks the wrong contraction table. One
          * attribute fixes it.
          *
          * titleLanguage() says nothing when a title is mixed or unclear,
          * because a French voice reading English is worse than no marking at
          * all. The aria-label on the apply link below still splices the
          * foreign title into an English frame and cannot carry lang; it is
          * left as it is because each one is unique, which is what makes a
          * list of 102 links navigable. The heading is the one a reader
          * actually browses by.
          */}
        {/* Clamped on phones only. Three roles on the board run past 100
            characters and one runs to 199 -- "Comment optimiser les processus
            operationnels en tirant profit de la GenAI..." -- which is five
            lines of 16px semibold at 332px, a paragraph where a title should
            be, pushing everything that tells a reader whether to care about
            the row off the screen. A screen reader loses nothing: the apply
            link's accessible name carries the role in full, which is why it
            was given one. Above 640px there is room for the whole thing, so
            the clamp lifts. */}
        <h2
          className={`line-clamp-3 text-base font-semibold sm:line-clamp-none ${
            closed ? "text-[color:var(--muted)]" : "text-[color:var(--text-strong)]"
          }`}
          lang={roleLang}
        >
          {stage.role}
        </h2>
        <span className="text-sm text-[color:var(--muted)]">— {stage.company}</span>
        {closed ? (
          <span className="rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[11px] uppercase tracking-wide text-[color:var(--muted)]">
            {copy.closed}
          </span>
        ) : null}
      </div>

      {/* Kind and place in --text, the rest left in --muted. .provenance paints
          its whole line --muted, so this row handed a reader five consecutive
          lines of the same grey and no way to tell which one to read first.
          These two are the facts that decide whether to keep reading -- what
          kind of contract it is and where it is -- so they get the row's own
          ink at 9.67:1, and remote, duration and level stay at 5.72:1 behind
          them. The flex gap on .provenance supplies the space before the
          second span, so the separator is written without one. */}
      <p className="provenance mt-2 text-[color:var(--text)]">
        {kindLabel(stage.kind, locale)} · {place}
        {detail ? <span className="text-[color:var(--muted)]">{`· ${detail}`}</span> : null}
      </p>

      {/* Guarded, because a closed row with no deadline has nothing to put in
          here and the wrapper's own top margin would be 12px of blank page on
          every one of them. */}
      {stage.deadline || !closed ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* Only the two rows that actually have a closing date. This slot used
              to render "Open until filled - no closing date given" on the other
              92, which is explained where copy.deadline is declared. Showing a
              date we made up would still be worse than showing none. */}
          {stage.deadline ? (
            <span className="text-sm text-[color:var(--text)]">
              {copy.deadline} {dateFmt.format(new Date(`${stage.deadline}T12:00:00Z`))}
            </span>
          ) : null}
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
        </div>
      ) : null}

      {/*
        * The freshness signal is the line that was already here, weighted --
        * not a pill beside the title.
        *
        * "Recently added" used to be a bordered accent pill up by the role.
        * LinkedIn marks a fresh posting by recolouring and bolding the
        * timestamp it already renders -- same element, same slot, same text --
        * which is why its rows stay exactly the same height whether a job is
        * new or not. A pill adds a box, competes with the title, and spends the
        * accent on a third thing. This says the same fact in the place a reader
        * already looks for dates.
        *
        * Still "added", never "posted": postedAt is the day this board imported
        * the listing, and the employer's own publication date is not in the
        * data.
        *
        * Added AND checked, not one or the other. The recency signal once
        * replaced the verification date instead of sitting beside it, so the 31
        * newest rows showed no check date at all -- and the site promises on
        * four pages that "every entry says when". The freshest third of the
        * board was the part that did not, which is also where a dead Bosch
        * listing sat reading "Recently added" with no date to question. Both
        * are still here. They are one line now rather than four spans, built
        * from the `recent` and `origin` constants above, and the claim those
        * four pages make is unchanged: a check date, or the admission that we
        * could not get one, never silence.
        *
        * The feed origin is still said on the row rather than only in the
        * method note, because a reader deciding on one listing should not have
        * to go looking for how it was verified. It has simply moved into the
        * same sentence as the source it qualifies.
        */}
      <p className="mt-2 text-xs text-[color:var(--muted)]">
        {recent ? <span className="font-semibold text-[color:var(--primary)]">{copy.recentBadge}</span> : null}
        {recent && (origin || hasVerdict) ? " · " : ""}
        {origin}
        {origin && hasVerdict ? " · " : ""}
        {stage.unverifiable ? (
          copy.notVerified
        ) : stage.checkedAt ? (
          `${copy.checked} ${dateFmt.format(new Date(`${stage.checkedAt}T12:00:00Z`))}`
        ) : null}
      </p>
    </li>
  );
}
