import type { Locale } from "@/i18n/config";
import raw from "@/content/stages.json";

export type StageKind = "stage" | "alternance" | "pfe";
export type StageRemote = "onsite" | "hybrid" | "remote";

export type Stage = {
  id: string;
  role: string;
  company: string;
  /**
   * Optional: not every employer publishes one. Cohere lists its two
   * internships as "Canada", remote, with no city. The field was required, so
   * those rows carried the placeholder "Remote" and the page rendered
   * "Remote, Canada - Remote". A missing city is absent, never a placeholder.
   */
  city?: string;
  /** ISO 3166-1 alpha-2. Ten countries today; the shape allows more. */
  country: string;
  kind: StageKind;
  duration?: string;
  level?: string;
  remote?: StageRemote;
  /**
   * YYYY-MM-DD, and genuinely optional: most postings are open until filled
   * and publish no closing date at all. Inventing a plausible one would put a
   * fabricated date in front of a student deciding when to apply, which is the
   * same untruth this site spent a fortnight removing. Absent means absent.
   */
  deadline?: string;
  /**
   * When this listing was added here, not when the employer published it --
   * add-stage.mjs stamps the day it runs. Every current entry reads 2026-09-20
   * because they were imported in one pass, which looks like a placeholder and
   * is not one.
   *
   * Nothing on the site renders it. scripts/draft-issue.mjs does: it selects
   * the listings added since the last newsletter and orders them newest first,
   * so removing this field silently empties the weekly issue.
   */
  postedAt?: string;
  /**
   * YYYY-MM-DD. When the link was last confirmed to be live. For an entry with
   * no closing date this is the only honest freshness signal available.
   */
  checkedAt?: string;
  href: string;
  source?: string;
};

type StagesFile = { version: number; updatedAt: string; items: Stage[] };

const payload = raw as StagesFile;

/**
 * A list of deadlines is only worth reading if it is current, so the page has
 * to be able to say when it is not.
 *
 * The real risk here was never the build — it is month four, when the list has
 * not been touched since November and sits there full of closed positions with
 * the publisher's name on it. That is the same kind of untruth this site spent
 * a fortnight removing, so the page states its own age and admits when it has
 * gone stale rather than looking maintained.
 */
export const STALE_AFTER_DAYS = 14;

export function getStagesUpdatedAt() {
  return payload.updatedAt;
}

/**
 * updatedAt moves whenever anything writes the file, including adding a single
 * entry, so the page was announcing "last checked: today" above ninety-six rows
 * that each said they were checked yesterday. The honest headline figure is the
 * oldest per-entry check: every link has been verified at least that recently.
 */
export function getStagesCheckedAgeDays(now = Date.now()) {
  const lastChecked = getStagesLastCheckedAt();
  // Per-entry checkedAt is a bare YYYY-MM-DD and gets anchored at noon, but the
  // fallback below it returns updatedAt, which is already a full ISO timestamp.
  // Appending a time to that produced "...499950ZT12:00:00Z", which parses to
  // NaN, so an entry set with no checkedAt at all reported an age of Infinity
  // instead of the file's real age.
  const checked = Date.parse(
    /^\d{4}-\d{2}-\d{2}$/.test(lastChecked) ? `${lastChecked}T12:00:00Z` : lastChecked
  );
  if (!Number.isFinite(checked)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now - checked) / 86_400_000));
}

export function getStagesLastCheckedAt() {
  const dates = payload.items.map((item) => item.checkedAt).filter(Boolean) as string[];
  if (!dates.length) return payload.updatedAt;
  return dates.reduce((oldest, value) => (value < oldest ? value : oldest));
}

export function getStagesAgeDays(now = Date.now()) {
  const updated = Date.parse(payload.updatedAt);
  if (!Number.isFinite(updated)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now - updated) / 86_400_000));
}

/**
 * Measured against the oldest per-entry check, not against the file's own
 * updatedAt.
 *
 * updatedAt moves whenever anything writes the file — `npm run add:stage` alone
 * re-stamps it — so keying the banner on it meant a maintainer who added one
 * entry a week kept the file permanently "fresh" while not a single link had
 * been re-verified for months. The page then printed "Last checked: 112 days
 * ago" (that headline already reads the per-entry dates) directly above no
 * warning at all, and the watchdog, which also measures checkedAt, raised an
 * issue nobody reading the page could see the reason for. One clock.
 */
export function isStagesListStale(now = Date.now()) {
  return getStagesCheckedAgeDays(now) > STALE_AFTER_DAYS;
}

/** A deadline that has passed. Kept visible: hiding it hides the maintenance. */
export function isClosed(stage: Stage, now = Date.now()) {
  // No stated closing date is not the same as closed. We do not know, and
  // saying "Closed" on a position still taking applications costs a student
  // the application they did not send.
  if (!stage.deadline) return false;
  const end = Date.parse(`${stage.deadline}T23:59:59Z`);
  return Number.isFinite(end) ? end < now : false;
}

/**
 * One employer at a time, so no single one owns the first screen.
 *
 * Only four of the eighty-two listings carry a deadline, so the other
 * seventy-eight fell through every other rule to the alphabetical tiebreak and
 * came out grouped by employer: four consecutive Armee de l'Air rows inside the
 * first six, Capgemini's ten together further down. A reader scanning for a
 * city or a kind of role saw one company repeated instead of the range the list
 * actually covers, and the Moroccan listings -- nine of eighty-two -- sat
 * wherever their employer's initial put them.
 *
 * Round-robin instead: one role per employer, then the next from each, in a
 * fixed order. It is deterministic, so the page does not reshuffle between
 * builds, and it needs no data the listings do not already have. postedAt would
 * have been the natural key, but it records when a listing was added here and
 * all eighty-two were imported on one day, so it separates nothing yet.
 */
function oneEmployerAtATime(items: Stage[]) {
  const byCompany = new Map<string, Stage[]>();
  for (const item of items) {
    const bucket = byCompany.get(item.company);
    if (bucket) bucket.push(item);
    else byCompany.set(item.company, [item]);
  }

  // Spread each employer evenly across the whole list, rather than dealing one
  // card per employer per round.
  //
  // Round-robin spreads the opening rows well and strands the tail: employers
  // with a single posting drop out after round one, so once only the biggest is
  // left its remainder lands consecutively. Capgemini has 10 of the 81 and the
  // next deepest has 6, so the last four rows were Capgemini four times -- the
  // clustering this exists to prevent, moved to the bottom rather than removed.
  // Ordering the queues by depth first does not help, because the arithmetic is
  // the same.
  //
  // Giving each posting a fractional position within its own employer's run and
  // sorting on that interleaves every employer across the full length at once.
  // An employer with ten postings lands one every eighth row; one with a single
  // posting lands in the middle of the list rather than at the front of it.
  const spread = [...byCompany.entries()].flatMap(([company, list]) =>
    list.map((stage, index) => ({ stage, company, at: (index + 0.5) / list.length }))
  );

  return spread
    .sort((a, b) => a.at - b.at || a.company.localeCompare(b.company))
    .map((entry) => entry.stage);
}

export function getStages(now = Date.now()) {
  const sorted = [...payload.items].sort((a, b) => {
    const aClosed = isClosed(a, now);
    const bClosed = isClosed(b, now);
    // Open first, then soonest deadline — the order someone applying needs.
    if (aClosed !== bClosed) return aClosed ? 1 : -1;
    // Among open entries, a stated cutoff is the urgent one, so dated entries
    // come first and rolling ones follow.
    const aDated = Boolean(a.deadline);
    const bDated = Boolean(b.deadline);
    if (aDated !== bDated) return aDated ? -1 : 1;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    return a.company.localeCompare(b.company) || a.role.localeCompare(b.role);
  });

  // Only the open, undated middle is rearranged. Dated entries are already in
  // deadline order, which is the one thing more urgent than variety, and closed
  // entries stay at the bottom where they belong.
  const dated = sorted.filter((s) => !isClosed(s, now) && s.deadline);
  const rolling = sorted.filter((s) => !isClosed(s, now) && !s.deadline);
  const closed = sorted.filter((s) => isClosed(s, now));

  return [...dated, ...oneEmployerAtATime(rolling), ...closed];
}

export function getOpenStages(now = Date.now()) {
  return getStages(now).filter((stage) => !isClosed(stage, now));
}


const KIND_LABELS: Record<StageKind, Record<Locale, string>> = {
  stage: { en: "Internship", fr: "Stage" },
  alternance: { en: "Apprenticeship", fr: "Alternance" },
  pfe: { en: "Final-year project", fr: "PFE" }
};

const REMOTE_LABELS: Record<StageRemote, Record<Locale, string>> = {
  onsite: { en: "On site", fr: "Sur site" },
  hybrid: { en: "Hybrid", fr: "Hybride" },
  remote: { en: "Remote", fr: "À distance" }
};

/**
 * ISO 3166-1 alpha-2, and only countries the list actually covers or is being
 * extended to. countryLabel falls back to the raw code, so an unlisted country
 * renders as "DE" rather than breaking -- but a reader seeing a bare code is a
 * sign a listing was added before its label.
 */
const COUNTRY_LABELS: Record<string, Record<Locale, string>> = {
  MA: { en: "Morocco", fr: "Maroc" },
  FR: { en: "France", fr: "France" },
  BE: { en: "Belgium", fr: "Belgique" },
  CH: { en: "Switzerland", fr: "Suisse" },
  DE: { en: "Germany", fr: "Allemagne" },
  ES: { en: "Spain", fr: "Espagne" },
  IE: { en: "Ireland", fr: "Irlande" },
  IT: { en: "Italy", fr: "Italie" },
  LU: { en: "Luxembourg", fr: "Luxembourg" },
  NL: { en: "Netherlands", fr: "Pays-Bas" },
  PL: { en: "Poland", fr: "Pologne" },
  PT: { en: "Portugal", fr: "Portugal" },
  SE: { en: "Sweden", fr: "Suède" },
  GB: { en: "United Kingdom", fr: "Royaume-Uni" },
  US: { en: "United States", fr: "États-Unis" },
  CA: { en: "Canada", fr: "Canada" }
};

export function kindLabel(kind: StageKind, locale: Locale) {
  return KIND_LABELS[kind]?.[locale] ?? kind;
}

export function remoteLabel(remote: StageRemote | undefined, locale: Locale) {
  return remote ? REMOTE_LABELS[remote]?.[locale] ?? remote : "";
}

/**
 * The countries the list actually covers, most-represented first.
 *
 * Six places told a reader "Morocco and France" as a fixed string, so the day a
 * seventh country was added the site would have been describing a list it no
 * longer had -- and the ordering was already wrong, leading with the nine
 * Moroccan listings ahead of seventy-two French ones. Deriving it means the
 * claim cannot drift from the data and nobody has to remember to update it.
 */
export function stageCountries(now = Date.now()) {
  const counts = new Map<string, number>();
  for (const stage of getOpenStages(now)) {
    counts.set(stage.country, (counts.get(stage.country) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([code]) => code);
}

/**
 * Those countries as a phrase. Names them while the list is short enough to
 * read, counts them once it is not -- "France, Morocco and 5 more" says more to
 * a reader than seven country names in a row, and stays true either way.
 */
export function stageCountrySummary(locale: Locale, now = Date.now()) {
  const codes = stageCountries(now);
  const names = codes.map((code) => countryLabel(code, locale));
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length <= 3) {
    const last = names[names.length - 1];
    const rest = names.slice(0, -1).join(", ");
    return locale === "fr" ? `${rest} et ${last}` : `${rest} and ${last}`;
  }
  const extra = names.length - 2;
  return locale === "fr"
    ? `${names[0]}, ${names[1]} et ${extra} autres pays`
    : `${names[0]}, ${names[1]} and ${extra} more`;
}

export function countryLabel(country: string, locale: Locale) {
  return COUNTRY_LABELS[country]?.[locale] ?? country;
}

/**
 * How long a listing counts as newly added.
 *
 * Seven days, matching the weekly check that adds them, so "recent" means "since
 * the last sweep" rather than an arbitrary window. It reads postedAt, which
 * records when the listing was added HERE and not when the employer published
 * it -- so anything rendered from this has to say "added", never "posted".
 * Calling our own import date a publication date would be a small lie in front
 * of a student deciding whether a role is still fresh.
 */
export const RECENTLY_ADDED_DAYS = 7;

export function isRecentlyAdded(stage: Stage, now: Date = new Date()): boolean {
  if (!stage.postedAt) return false;
  const added = Date.parse(`${stage.postedAt.slice(0, 10)}T12:00:00Z`);
  if (!Number.isFinite(added)) return false;
  const days = (now.getTime() - added) / 86_400_000;
  // A future date is a data error, not a new listing.
  return days >= 0 && days <= RECENTLY_ADDED_DAYS;
}
