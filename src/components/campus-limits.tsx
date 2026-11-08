import { getOpenStages } from "@/content/stages";
import type { Locale } from "@/i18n/config";
import { frenchDe } from "@/i18n/typography";
import { institutionWithArticleFr, type Institution } from "@/lib/campus";

/**
 * The limits, named by the site rather than discovered by the reader.
 *
 * This is the section that makes the rest of the page credible. A page offered
 * to a faculty that lists only its strengths reads like a brochure; each limit
 * here is one a student would otherwise find out for themselves and feel misled
 * by.
 *
 * `institution` matters more than it looks. When the page carries an
 * establishment's name in its title and its URL, a reader can reasonably assume
 * the establishment publishes it -- so that page has to deny the affiliation in
 * the establishment's own name, not with a generic "not a faculty service".
 * That sentence is also what a communication office needs to read before it
 * will relay a link.
 */
export function CampusLimits({ locale, institution }: { locale: Locale; institution?: Institution }) {
  const fr = locale === "fr";
  const openCount = getOpenStages().length;

  return (
    <ul className="mt-4 grid gap-3 text-sm text-[color:var(--muted)]">
      <li>
        {fr
          ? "Ce n'est pas un intermédiaire. Votre candidature part chez l'employeur, par son propre formulaire. Le site ne transmet aucun dossier et ne touche aucune commission sur un recrutement."
          : "This is not an intermediary. Your application goes to the employer, through their own form. The site forwards no applications and takes no commission on a hire."}
      </li>
      <li>
        {fr
          ? `Ce n'est pas exhaustif. ${openCount} offres sont suivies, pas tout le marché. Une offre absente n'a pas été écartée : elle n'a pas été trouvée.`
          : `This is not exhaustive. ${openCount} listings are tracked, not the whole market. A listing that is missing was not rejected; it was not found.`}
      </li>
      <li>
        {institution
          ? fr
            ? `Ce n'est pas un service ${frenchDe(institutionWithArticleFr(institution))}. Le site est un projet d'étudiant indépendant : il n'est ni édité, ni financé, ni validé par l'établissement, et il ne parle pas en son nom. Le nom de l'établissement figure ici pour vous dire à qui la page s'adresse, rien de plus.`
            : `This is not a service of ${institution.name}. The site is an independent student project: it is not published, funded or approved by the institution, and it does not speak for it. The institution is named here to say who the page is for, nothing more.`
          : fr
            ? "Ce n'est pas un service de la faculté. Le site est un projet d'étudiant, indépendant, et il ne parle au nom d'aucun établissement."
            : "This is not a faculty service. The site is an independent student project and speaks for no institution."}
      </li>
    </ul>
  );
}
