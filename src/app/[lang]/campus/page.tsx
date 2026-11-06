import type { Metadata } from "next";
import Link from "next/link";
import { CampusForm } from "@/components/campus-form";
import { INSTITUTIONS } from "@/lib/campus";
import { countryLabel, getOpenStages, getStagesLastCheckedAt } from "@/content/stages";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates, openGraphDefaults } from "@/i18n/helpers";
import { withColon } from "@/i18n/typography";
import { ogImageUrl } from "@/lib/seo";

const TITLE = {
  en: "For your faculty",
  fr: "Pour votre faculté"
};

const SUBTITLE = {
  en: "Every student with a university email address can receive the new internship listings for free, by email, with the source of each one.",
  fr: "Chaque étudiant disposant d'une adresse email universitaire peut recevoir gratuitement les nouvelles offres de stage par email, avec la source de chacune."
};

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};
  const locale: Locale = params.lang;

  return {
    title: TITLE[locale],
    description: SUBTITLE[locale],
    openGraph: {
      ...openGraphDefaults(locale),
      title: TITLE[locale],
      description: SUBTITLE[locale],
      url: `/${locale}/campus`,
      type: "website",
      images: [{ url: ogImageUrl(TITLE[locale]), width: 1200, height: 630, alt: TITLE[locale] }]
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE[locale],
      description: SUBTITLE[locale],
      images: [ogImageUrl(TITLE[locale])]
    },
    alternates: localizedAlternates("/campus", params.lang)
  };
}

/**
 * Why every number on this page is computed and none is written down.
 *
 * This is the page a student reaches from a poster or a WhatsApp message, and
 * the figures are the whole argument: "86 offres" persuades only while it is
 * true. The board changes every Monday and Thursday when the checker and the
 * finder run, so a hardcoded count would be wrong within the week, and wrong in
 * the direction that matters -- claiming more than exists.
 *
 * The same applies to the country split. It would be easier to say "des stages
 * au Maroc et en Europe" and stop there; the split is printed instead, because
 * a student who arrives expecting a Moroccan board and finds it is mostly
 * France should learn that here, in one line, rather than after ten minutes of
 * scrolling.
 */
export default async function CampusPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;
  const locale: Locale = params.lang;
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

  const steps = fr
    ? [
        {
          title: "Vous entrez votre adresse universitaire",
          body: "Le site reconnaît votre établissement à partir du domaine de l'adresse. Rien d'autre ne vous est demandé : ni nom, ni filière, ni CV."
        },
        {
          title: "Vous recevez les nouvelles offres par email",
          body: "Chaque offre arrive avec l'employeur, la ville, la date limite quand elle existe, et le lien vers l'annonce d'origine. Vous postulez chez l'employeur, jamais ici."
        },
        {
          title: "Les offres mortes disparaissent",
          body: "Un contrôle automatique suit chaque lien chaque semaine. Une annonce retirée est signalée, puis retirée du tableau. C'est la partie que personne ne fait à la main."
        }
      ]
    : [
        {
          title: "You enter your university address",
          body: "The site recognises your institution from the address domain. Nothing else is asked of you: no name, no programme, no CV."
        },
        {
          title: "New listings reach you by email",
          body: "Each one arrives with the employer, the city, the deadline where there is one, and the link to the original posting. You apply with the employer, never here."
        },
        {
          title: "Dead listings disappear",
          body: "An automated check follows every link each week. A posting that has been taken down is flagged, then removed from the board. That is the part nobody does by hand."
        }
      ];

  return (
    <section className="page-shell max-w-5xl py-10 md:py-14">
      <header className="do-hero rounded-3xl p-7 md:p-10">
        <p className="do-kicker">{fr ? "Accès établissement" : "Campus access"}</p>
        <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">{TITLE[locale]}</h1>
        <p className="mt-4 max-w-3xl text-sm text-[color:var(--text)]">{SUBTITLE[locale]}</p>
      </header>

      <section className="surface mt-6 max-w-2xl rounded-2xl p-6">
        <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
          {fr ? "Recevoir les offres de votre établissement" : "Get your institution's listings"}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          {fr
            ? "Utilisez l'adresse de votre faculté. Elle sert à reconnaître votre établissement et à vous envoyer les offres, rien d'autre."
            : "Use your faculty address. It is used to recognise your institution and to send you the listings, nothing else."}
        </p>
        <CampusForm locale={locale} />
        <p className="mt-4 text-xs text-[color:var(--muted)]">
          {fr
            ? "Aucune adresse n'est revendue ni partagée. Vous vous désinscrivez d'un clic depuis n'importe quel email."
            : "No address is sold or shared. You can unsubscribe in one click from any email."}{" "}
          <Link href={`/${locale}/privacy`} className="do-link">
            {fr ? "Politique de confidentialité" : "Privacy policy"}
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
          {fr ? "Ce qu'il y a derrière" : "What is behind it"}
        </h2>
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
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
          {fr ? "Comment ça marche" : "How it works"}
        </h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="surface rounded-xl p-4">
              <p className="text-xs font-semibold tabular-nums text-[color:var(--muted)]">{index + 1}</p>
              <p className="mt-1 font-medium text-[color:var(--text-strong)]">{step.title}</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
          {fr ? "Ce que ce n'est pas" : "What this is not"}
        </h2>
        {/*
          This section is the reason a student can trust the rest of the page. A
          service aimed at a faculty that lists only its strengths reads like a
          brochure; naming the limits is what separates it from one, and each
          limit here is one a student would otherwise discover for themselves
          and feel misled by.
        */}
        <ul className="mt-4 grid gap-3 text-sm text-[color:var(--muted)]">
          <li>
            {fr
              ? "Ce n'est pas un intermédiaire. Votre candidature part chez l'employeur, par son propre formulaire. Le site ne transmet aucun dossier et ne touche aucune commission sur un recrutement."
              : "This is not an intermediary. Your application goes to the employer, through their own form. The site forwards no applications and takes no commission on a hire."}
          </li>
          <li>
            {fr
              ? `Ce n'est pas exhaustif. ${open.length} offres sont suivies, pas tout le marché. Une offre absente n'a pas été écartée : elle n'a pas été trouvée.`
              : `This is not exhaustive. ${open.length} listings are tracked, not the whole market. A listing that is missing was not rejected; it was not found.`}
          </li>
          <li>
            {fr
              ? "Ce n'est pas un service de la faculté. Le site est un projet d'étudiant, indépendant, et il ne parle au nom d'aucun établissement."
              : "This is not a faculty service. The site is an independent student project and speaks for no institution."}
          </li>
        </ul>
      </section>

      <section className="glass mt-10 max-w-3xl rounded-2xl p-6">
        <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
          {fr ? "Votre établissement n'est pas reconnu ?" : "Institution not recognised?"}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          {fr
            ? `La liste nommée compte ${INSTITUTIONS.length} établissements, et toute adresse en .ac.ma est acceptée même si elle n'y figure pas. Si une adresse universitaire bien réelle n'est pas reconnue, écrivez-nous : c'est la liste qui est incomplète, pas votre adresse.`
            : `The named list holds ${INSTITUTIONS.length} institutions, and any .ac.ma address is accepted whether or not it is on that list. If a genuine university address is not recognised, tell us: the list is what is incomplete, not your address.`}
        </p>
        <Link href={`/${locale}/stages`} className="btn-primary mt-4 inline-flex h-11 items-center px-4 text-sm">
          {fr ? "Voir le tableau des offres" : "See the internship board"}
        </Link>
      </section>
    </section>
  );
}
