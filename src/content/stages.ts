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
  /** YYYY-MM-DD. The date applications close. */
  deadline: string;
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

export function getStagesAgeDays(now = Date.now()) {
  const updated = Date.parse(payload.updatedAt);
  if (!Number.isFinite(updated)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now - updated) / 86_400_000));
}

export function isStagesListStale(now = Date.now()) {
  return getStagesAgeDays(now) > STALE_AFTER_DAYS;
}

/** A deadline that has passed. Kept visible: hiding it hides the maintenance. */
export function isClosed(stage: Stage, now = Date.now()) {
  const end = Date.parse(`${stage.deadline}T23:59:59Z`);
  return Number.isFinite(end) ? end < now : false;
}

export function getStages(now = Date.now()) {
  return [...payload.items].sort((a, b) => {
    const aClosed = isClosed(a, now);
    const bClosed = isClosed(b, now);
    // Open first, then soonest deadline — the order someone applying needs.
    if (aClosed !== bClosed) return aClosed ? 1 : -1;
    return a.deadline.localeCompare(b.deadline);
  });
}

export function getOpenStages(now = Date.now()) {
  return getStages(now).filter((stage) => !isClosed(stage, now));
}

export function getStagesCount() {
  return payload.items.length;
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
