import { countryLabel, getOpenStages, type Stage } from "@/content/stages";
import type { Locale } from "@/i18n/config";

/**
 * One feed item per week the board grew, instead of one per listing.
 *
 * The board is the most valuable and most frequently updated thing on this
 * site, and it was absent from the only channel built for people who want
 * updates: src/lib/feed.ts carried posts and news briefs and nothing else.
 *
 * But it cannot go in a listing at a time. The comment above feedItems records
 * what happened when sixty auto-briefs went into the feed: because they were
 * the freshest thing, a subscriber's first three items were reprints and the
 * site's own writing started at item sixty-one. Fifteen job rows on a good
 * Thursday would do the same to twenty-seven original pieces. A digest says the
 * same thing in one item and keeps the deal worth taking.
 *
 * It also happens to be true to the work: verifying a posting is the editorial
 * act here, and "six new internships, each link fetched and answered" is one
 * piece of news, not six.
 */
/**
 * Three weeks, and the limit is editorial rather than technical.
 *
 * At sixty days this reached back to the week the board was seeded and
 * announced "51 new internships, verified" dated 20 September. Every word of
 * that is true and it is still the wrong thing to say: 51 rows arrived that
 * week because the list was being created, not because 51 openings appeared.
 * Shipping it would also have dropped four back-dated items into a
 * subscriber's reader at once, which is the same bad deal the feed's own
 * comment was written about.
 *
 * Three weeks covers the finder's Thursday cadence with room for a run that
 * slips, and rolls forward on its own.
 */
const DIGEST_WINDOW_DAYS = 21;
const NAMED_IN_SUMMARY = 3;

export type StageDigest = {
  weekKey: string;
  link: string;
  guid: string;
  title: string;
  description: string;
  publishedAt: string;
  count: number;
};

/**
 * ISO-8601 week, so a Thursday run and a Saturday hand-addition land in the
 * same digest rather than two. The finder runs Thursdays and a person adds
 * whenever they have time; the reader does not care which day.
 */
export function isoWeekKey(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function placeOf(stage: Stage, locale: Locale): string {
  const country = countryLabel(stage.country, locale);
  return stage.city ? `${stage.company} (${stage.city})` : `${stage.company} (${country})`;
}

export function stageDigests(locale: Locale, now = Date.now()): StageDigest[] {
  const cutoff = now - DIGEST_WINDOW_DAYS * 86_400_000;
  const byWeek = new Map<string, Stage[]>();

  for (const stage of getOpenStages(now)) {
    // The title says "verified". The two rows that say on their own row that we
    // could not verify them do not get counted behind a word they contradict.
    if (stage.unverifiable) continue;
    if (!stage.postedAt) continue;
    const added = Date.parse(`${stage.postedAt}T12:00:00Z`);
    if (Number.isNaN(added) || added < cutoff) continue;
    const key = isoWeekKey(stage.postedAt);
    if (!key) continue;
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(stage);
  }

  const digests: StageDigest[] = [];
  for (const [weekKey, rows] of byWeek) {
    const count = rows.length;
    const newest = rows.map((r) => r.postedAt!).sort().at(-1)!;
    /*
     * One mention per employer, and the count that follows counts EMPLOYERS.
     *
     * A good Thursday at one company produced "NVIDIA (Santa Clara), NVIDIA
     * (Santa Clara)", which reads like a bug because it is one. De-duplicating
     * then introduced a worse one: the summary said "15 ... and 3 more" when
     * three named employers covered twelve of the fifteen rows, so the two
     * numbers in one sentence were counting different things. The title counts
     * listings; this sentence counts who they are from, and says which.
     */
    const employers: string[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      if (seen.has(row.company)) continue;
      seen.add(row.company);
      employers.push(placeOf(row, locale));
    }
    const named = employers.slice(0, NAMED_IN_SUMMARY);
    const rest = employers.length - named.length;

    const title =
      locale === "fr"
        ? `${count} ${count === 1 ? "nouveau stage" : "nouveaux stages"} IA et cyber, ${count === 1 ? "vérifié" : "vérifiés"}`
        : `${count} new AI and cyber ${count === 1 ? "internship" : "internships"}, verified`;

    const list = named.join(", ");
    const description =
      locale === "fr"
        ? `De ${list}${rest > 0 ? ` et ${rest} autre${rest === 1 ? " employeur" : "s employeurs"}` : ""}. ` +
          "Chaque lien a été ouvert et a répondu avant d'être publié."
        : `From ${list}${rest > 0 ? ` and ${rest} other employer${rest === 1 ? "" : "s"}` : ""}. ` +
          "Each link was fetched and answered before it was listed.";

    digests.push({
      weekKey,
      link: `/${locale}/stages?added=recent`,
      // The link is the same every week, and the feed uses the link as the guid,
      // so two digests would collide and a reader would see one. An explicit
      // non-permalink guid is what RSS provides for exactly this.
      guid: `stages-digest-${locale}-${weekKey}`,
      title,
      description,
      publishedAt: newest,
      count
    });
  }

  return digests.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}
