import { INSTITUTIONS } from "@/lib/campus";
import { countryLabel, getOpenStages, getStagesLastCheckedAt } from "@/content/stages";
import type { Locale } from "@/i18n/config";
import { withColon } from "@/i18n/typography";

/**
 * The figure band shared by /campus and /campus/<establishment>.
 *
 * It lives in one place because the two pages make the same promise to the same
 * reader, and two copies of a figure band drift: the one a faculty was sent
 * would keep saying "86 offres" for a month after the other had moved on. Every
 * number here is read at request time for the same reason the pages carry no
 * hardcoded count -- the board changes twice a week, and a stale figure is
 * always wrong in the flattering direction.
 */
export function CampusFacts({ locale }: { locale: Locale }) {
  const fr = locale === "fr";

  const open = getOpenStages();
  const byCountry = new Map<string, number>();
  for (const stage of open) byCountry.set(stage.country, (byCountry.get(stage.country) || 0) + 1);
  const topCountries = [...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const pfeCount = open.filter((stage) => stage.kind === "pfe").length;
  const lastChecked = getStagesLastCheckedAt();

  const facts = [
    {
      label: fr ? "Offres ouvertes" : "Open listings",
      value: String(open.length),
      note: fr ? "vérifiées une par une, lien par lien" : "verified one by one, link by link"
    },
    {
      label: fr ? "Dont PFE" : "Final-year projects",
      value: String(pfeCount),
      note: fr ? `sur ${open.length} offres` : `of ${open.length} listings`
    },
    {
      label: fr ? "Établissements nommés" : "Institutions named",
      value: String(INSTITUTIONS.length),
      note: fr ? "et toute adresse .ac.ma est acceptée" : "and any .ac.ma address is accepted"
    },
    {
      label: fr ? "Coût pour la faculté" : "Cost to the faculty",
      value: "0 MAD",
      note: fr ? "aucun compte, aucune licence, aucun contrat" : "no account, no licence, no contract"
    }
  ];

  return (
    <>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="surface rounded-xl p-4">
            <dt className="text-xs uppercase tracking-wide text-[color:var(--muted)]">{fact.label}</dt>
            <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-[color:var(--text-strong)]">{fact.value}</dd>
            <dd className="mt-1 text-xs text-[color:var(--muted)]">{fact.note}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-[color:var(--muted)]">
        {withColon(fr ? "Répartition par pays" : "Where the listings are", locale)}{" "}
        {topCountries.map(([code, count], index) => (
          <span key={code}>
            {index > 0 ? " • " : ""}
            {withColon(countryLabel(code, locale), locale)} {count}
          </span>
        ))}
        {". "}
        {fr
          ? "La majorité des offres sont en Europe. C'est la réalité du marché du stage pour un étudiant marocain en informatique, et le tableau le montre plutôt que de le masquer."
          : "Most listings are in Europe. That is the reality of the internship market for a Moroccan computing student, and the board shows it rather than hiding it."}
      </p>
      {lastChecked ? (
        <p className="mt-2 text-xs text-[color:var(--muted)]">
          {withColon(fr ? "Dernière vérification des liens" : "Links last verified", locale)}{" "}
          <time dateTime={lastChecked}>{new Date(lastChecked).toLocaleDateString(fr ? "fr-FR" : "en-GB")}</time>
        </p>
      ) : null}
    </>
  );
}
