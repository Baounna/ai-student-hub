/**
 * How old the newest hand-written thing in a list is.
 *
 * The internship board already refuses to go quietly out of date: past
 * STALE_AFTER_DAYS it prints "This list has not been checked recently" above
 * the rows (src/content/stages.ts:118, rendered in stages/page.tsx). The blog
 * and the news briefs had no equivalent, and they are the part of the site that
 * actually stops moving -- listings and web signals refresh themselves twice a
 * day, which disguises it. On 2026-11-08 the news page carried nine briefs
 * dated February 2026 under a heading reading "Actualités récentes", and said
 * nothing about the gap.
 *
 * This is the same promise as the board's, applied to writing: a page that has
 * not moved in months says so, rather than letting the word "latest" do work
 * the content no longer supports.
 */

/**
 * Sixty days, matching the watchdog's advisory threshold so the alarm the owner
 * gets and the notice a reader sees appear at the same moment. A page that
 * admits its age before anyone complains is the point; one that waits until the
 * content is half a year old has already misled everyone who read it.
 */
export const EDITORIAL_STALE_AFTER_DAYS = 60;

/** The most recent `publishedAt` in a list, or "" when none can be read. */
export function newestPublishedAt(items: readonly { publishedAt?: string }[]): string {
  let newest = "";
  for (const item of items) {
    const value = item.publishedAt || "";
    if (!Number.isFinite(Date.parse(value))) continue;
    if (!newest || Date.parse(value) > Date.parse(newest)) newest = value;
  }
  return newest;
}

/**
 * Whole days since `iso`, or Infinity when it cannot be read.
 *
 * Infinity rather than 0 on an unreadable date, so content whose date is
 * missing reads as "we do not know how old this is" and trips the notice,
 * instead of silently claiming to be published today. getStagesCheckedAgeDays
 * makes the same choice for the same reason.
 */
export function contentAgeDays(iso: string, now = Date.now()): number {
  const parsed = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now - parsed) / 86_400_000));
}

export function isEditorialStale(iso: string, now = Date.now()): boolean {
  return contentAgeDays(iso, now) >= EDITORIAL_STALE_AFTER_DAYS;
}
