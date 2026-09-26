import type { Locale } from "@/i18n/config";
import raw from "@/content/stages.json";

export type StageKind = "stage" | "alternance" | "pfe";
export type StageRemote = "onsite" | "hybrid" | "remote";

export type Stage = {
  id: string;
  role: string;
  company: string;
  city: string;
  /** ISO 3166-1 alpha-2. MA and FR today; the shape allows more. */
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
   * YYYY-MM-DD. When the link was last confirmed to be live. For an entry with
   * no closing date this is the only honest freshness signal available.
   */
  checkedAt?: string;
  postedAt?: string;
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

export function getStages(now = Date.now()) {
  return [...payload.items].sort((a, b) => {
    const aClosed = isClosed(a, now);
    const bClosed = isClosed(b, now);
    // Open first, then soonest deadline — the order someone applying needs.
    if (aClosed !== bClosed) return aClosed ? 1 : -1;
    // Among open entries, a stated cutoff is the urgent one, so dated entries
    // come first and rolling ones follow in a stable alphabetical order.
    const aDated = Boolean(a.deadline);
    const bDated = Boolean(b.deadline);
    if (aDated !== bDated) return aDated ? -1 : 1;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    return a.company.localeCompare(b.company) || a.role.localeCompare(b.role);
  });
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

const COUNTRY_LABELS: Record<string, Record<Locale, string>> = {
  MA: { en: "Morocco", fr: "Maroc" },
  FR: { en: "France", fr: "France" }
};

export function kindLabel(kind: StageKind, locale: Locale) {
  return KIND_LABELS[kind]?.[locale] ?? kind;
}

export function remoteLabel(remote: StageRemote | undefined, locale: Locale) {
  return remote ? REMOTE_LABELS[remote]?.[locale] ?? remote : "";
}

export function countryLabel(country: string, locale: Locale) {
  return COUNTRY_LABELS[country]?.[locale] ?? country;
}
