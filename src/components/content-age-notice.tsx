import { contentAgeDays, isEditorialStale } from "@/lib/content-age";
import type { Locale } from "@/i18n/config";

/**
 * The page admitting its own age, in the same shape the internship board uses.
 *
 * A heading rather than a bolded paragraph, because somebody navigating by
 * headings -- which is how a screen reader user skims a long page -- passed
 * straight over the board's warning to the rows below when it was only styled
 * to look like one. The comment in stages/page.tsx records that being fixed;
 * this copies the fix rather than the bug.
 */
export function ContentAgeNotice({
  locale,
  newest,
  kind,
  now
}: {
  locale: Locale;
  newest: string;
  kind: "articles" | "briefs";
  now?: number;
}) {
  if (!isEditorialStale(newest, now)) return null;

  const fr = locale === "fr";
  const days = contentAgeDays(newest, now);
  const known = Number.isFinite(days);

  const title = fr
    ? kind === "briefs"
      ? "Ces briefs n'ont pas été mis à jour récemment"
      : "Ces guides n'ont pas été mis à jour récemment"
    : kind === "briefs"
      ? "These briefs have not been updated recently"
      : "These guides have not been updated recently";

  const age = fr
    ? known
      ? `Le plus récent date d'il y a ${days} jours.`
      : "Le plus récent ne porte pas de date lisible."
    : known
      ? `The most recent one is ${days} days old.`
      : "The most recent one carries no readable date.";

  const elsewhere = fr
    ? "Les offres de stage et les signaux issus de sources officielles, eux, continuent d'être vérifiés chaque semaine."
    : "The internship listings and the official-source signals are still checked every week.";

  return (
    <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <h2 className="font-semibold text-[color:var(--text-strong)]">{title}</h2>
      <p className="mt-1 text-sm text-[color:var(--muted)]">
        {age} {elsewhere}
      </p>
    </div>
  );
}
