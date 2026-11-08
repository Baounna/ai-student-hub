import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CampusFacts } from "@/components/campus-facts";
import { CampusForm } from "@/components/campus-form";
import { CampusLimits } from "@/components/campus-limits";
import { getInstitutionBySlug, institutionWithArticleFr, INSTITUTIONS, type Institution } from "@/lib/campus";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { localizedAlternates, openGraphDefaults } from "@/i18n/helpers";
import { frenchDe } from "@/i18n/typography";
import { ogImageUrl } from "@/lib/seo";

/**
 * One page per establishment, so a faculty has something to link to.
 *
 * /campus is addressed to every student in Morocco at once, which is exactly
 * what a communication office will not relay: a webmaster publishes a link to
 * "Stages et PFE — Université X", not to a generic page on a stranger's site.
 * This route gives each of the named institutions a stable URL that carries its
 * own name and city, and nothing else about it differs -- same board, same
 * form, same figures, same limits. The name is a label for the reader, not a
 * claim of partnership, which is why CampusLimits is given the institution name
 * and denies the affiliation in that name.
 *
 * Unknown slugs 404 rather than rendering a generic page. A page that printed
 * an institution we hold no domain for would be claiming to be built for a
 * faculty the site has never heard of.
 */
export function generateStaticParams() {
  return locales.flatMap((lang) => INSTITUTIONS.map((institution) => ({ lang, etablissement: institution.slug })));
}

function pageTitle(name: string, locale: Locale): string {
  return locale === "fr" ? `Stages et PFE — ${name}` : `Internships and final-year projects — ${name}`;
}

function pageDescription(institution: Institution, locale: Locale): string {
  return locale === "fr"
    ? `Offres de stage et de PFE vérifiées une par une, pour les étudiants ${frenchDe(institutionWithArticleFr(institution))}. Avec votre adresse universitaire, vous recevez les nouvelles offres par email, gratuitement.`
    : `Internship and final-year project listings verified one by one, for students of ${institution.name}. With your university address you receive new listings by email, free of charge.`;
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string; etablissement: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};
  const locale: Locale = params.lang;

  const institution = getInstitutionBySlug(params.etablissement);
  if (!institution) return {};

  const title = pageTitle(institution.name, locale);
  const description = pageDescription(institution, locale);

  return {
    title,
    description,
    openGraph: {
      ...openGraphDefaults(locale),
      title,
      description,
      url: `/${locale}/campus/${institution.slug}`,
      type: "website",
      images: [{ url: ogImageUrl(institution.name), width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl(institution.name)]
    },
    alternates: localizedAlternates(`/campus/${institution.slug}`, params.lang)
  };
}

export default async function CampusInstitutionPage(props: {
  params: Promise<{ lang: string; etablissement: string }>;
}) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;
  const locale: Locale = params.lang;
  const fr = locale === "fr";

  const institution = getInstitutionBySlug(params.etablissement);
  if (!institution) notFound();

  return (
    <section className="page-shell max-w-5xl py-10 md:py-14">
      <header className="do-hero rounded-3xl p-7 md:p-10">
        <p className="do-kicker">
          {fr ? `Pour les étudiants ${frenchDe(institution.city)}` : `For students in ${institution.city}`}
        </p>
        <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
          {fr ? `Stages et PFE pour ${institutionWithArticleFr(institution)}` : `Internships and final-year projects for ${institution.name}`}
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-[color:var(--text)]">
          {fr
            ? "Un tableau d'offres de stage et de PFE en informatique, data et IA, dont chaque lien est testé à la main avant publication. Avec votre adresse universitaire, les nouvelles offres vous arrivent par email, gratuitement et sans condition."
            : "A board of internship and final-year project listings in computing, data and AI, where every link is tested by hand before it is published. With your university address, new listings reach you by email, free and with no conditions."}
        </p>
        {/*
          Said in the hero and not only in the small print at the bottom. The
          page carries the establishment's name in its title and its URL, so the
          first thing a reader deserves to know is who is actually behind it.
        */}
        <p className="mt-3 max-w-3xl text-xs text-[color:var(--muted)]">
          {fr
            ? `Projet d'étudiant indépendant. Cette page n'est ni éditée ni validée par ${institutionWithArticleFr(institution)}.`
            : `Independent student project. This page is neither published nor approved by ${institution.name}.`}
        </p>
      </header>

      <section className="surface mt-6 max-w-2xl rounded-2xl p-6">
        <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
          {fr ? "Recevoir les nouvelles offres" : "Get the new listings"}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          {fr
            ? `Utilisez l'adresse de votre établissement, par exemple en @${institution.domains[0]}. Elle sert à reconnaître votre établissement et à vous envoyer les offres, rien d'autre.`
            : `Use your institution's address, for example at @${institution.domains[0]}. It is used to recognise your institution and to send you the listings, nothing else.`}
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
        <CampusFacts locale={locale} />
      </section>

      <section className="mt-10 max-w-3xl">
        <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
          {fr ? "Ce que ce n'est pas" : "What this is not"}
        </h2>
        <CampusLimits locale={locale} institution={institution} />
      </section>

      <section className="glass mt-10 max-w-3xl rounded-2xl p-6">
        <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
          {fr ? "Vous n'êtes pas de cet établissement ?" : "Not at this institution?"}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          {fr
            ? "Le service est le même pour tous. Toute adresse universitaire en .ac.ma est acceptée, que votre établissement soit nommé sur le site ou non."
            : "The service is the same for everyone. Any university address ending in .ac.ma is accepted, whether or not your institution is named on the site."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/${locale}/stages`} className="btn-primary inline-flex h-11 items-center px-4 text-sm">
            {fr ? "Voir le tableau des offres" : "See the internship board"}
          </Link>
          <Link href={`/${locale}/campus`} className="btn-secondary inline-flex h-11 items-center px-4 text-sm">
            {fr ? "La page pour tous les établissements" : "The page for every institution"}
          </Link>
        </div>
      </section>
    </section>
  );
}
