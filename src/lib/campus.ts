import type { Locale } from "@/i18n/config";

/**
 * Recognising a Moroccan student by their university email address.
 *
 * The internship board is free to everyone and stays that way -- nothing here
 * is a paywall. What this adds is the one thing a general mailing list cannot
 * do: tell a student "this was built for your faculty" and then tag their
 * subscription so the weekly digest can be grouped by institution.
 *
 * Two deliberate design choices, both about honesty:
 *
 * 1. No confirmation code, and none is needed. The thing a student receives is
 *    delivered BY email, so controlling the mailbox is the verification. An
 *    address nobody owns receives nothing. Building a code flow would mean a
 *    transactional email provider, a store for the codes and an expiry policy
 *    -- real money and real complexity -- to prove something the delivery
 *    already proves.
 *
 * 2. A domain we do not recognise is never turned away. The named list below is
 *    hand-written and therefore incomplete, and a student whose faculty is
 *    missing from it has done nothing wrong. They are recognised as academic by
 *    the .ac.ma rule, or offered the general list, but they are never told
 *    their address is invalid. A gate that locks out real students to look
 *    exclusive would be the opposite of the point.
 */

export type Institution = {
  /** Lower-case, URL and tag safe. This is what reaches the email provider. */
  slug: string;
  name: string;
  city: string;
  /**
   * The French definite article the name takes, or null for a proper name that
   * takes none. "l'Université Ibn Tofaïl" and "l'École Mohammadia", but "Al
   * Akhawayn University" -- which is why this is a field and not a rule derived
   * from the first letter: all four of those names begin with a vowel, and only
   * three of them are common-noun phrases that take an article.
   */
  frArticle: "l'" | null;
  /**
   * Email domains, lower-case and without a leading dot. A match is the exact
   * domain or any subdomain of it, so `ensias.um5.ac.ma` matches `um5.ac.ma`
   * and a faculty that gives out `@flsh.uca.ma` needs no separate entry.
   */
  domains: string[];
};

/**
 * Why `.ac.ma` is treated as proof of an academic address on its own.
 *
 * `ac.ma` is the reserved academic second level of Morocco's ccTLD -- a
 * registration under it is made by an institution, not a person. That makes it
 * a far better signal than any list I can maintain by hand, and it means the
 * feature works for a faculty I have never heard of on the day it opens.
 *
 * The named list exists only so the page can say "Université Ibn Tofaïl"
 * instead of "votre établissement". It is a courtesy, not the gate.
 */
const ACADEMIC_SUFFIX = "ac.ma";

/**
 * Institutions whose students get their establishment named back to them.
 *
 * Only domains I could confirm are listed. The cost of a wrong entry is not
 * symmetric, which is why: a missing `.ac.ma` school still gets in through the
 * suffix rule above and merely goes unnamed, but a school on a plain `.ma`
 * domain -- um6p.ma, aui.ma -- has no suffix rule to fall back on, so for those
 * an error would mean a real student being told we do not recognise them. Hence
 * `recognize` ends in a path that admits everyone regardless.
 */
export const INSTITUTIONS: Institution[] = [
  { slug: "um5", name: "Université Mohammed V de Rabat", city: "Rabat", frArticle: "l'", domains: ["um5.ac.ma", "um5r.ac.ma", "um5s.net.ma"] },
  { slug: "univh2c", name: "Université Hassan II de Casablanca", city: "Casablanca", frArticle: "l'", domains: ["univh2c.ma", "univh2m.ac.ma"] },
  { slug: "uca", name: "Université Cadi Ayyad", city: "Marrakech", frArticle: "l'", domains: ["uca.ma", "uca.ac.ma", "edu.uca.ac.ma"] },
  { slug: "usmba", name: "Université Sidi Mohamed Ben Abdellah", city: "Fès", frArticle: "l'", domains: ["usmba.ac.ma"] },
  { slug: "uae", name: "Université Abdelmalek Essaâdi", city: "Tétouan", frArticle: "l'", domains: ["uae.ac.ma"] },
  { slug: "uit", name: "Université Ibn Tofaïl", city: "Kénitra", frArticle: "l'", domains: ["uit.ac.ma"] },
  { slug: "uiz", name: "Université Ibn Zohr", city: "Agadir", frArticle: "l'", domains: ["uiz.ac.ma"] },
  { slug: "ump", name: "Université Mohammed Premier", city: "Oujda", frArticle: "l'", domains: ["ump.ac.ma"] },
  { slug: "uhp", name: "Université Hassan Premier", city: "Settat", frArticle: "l'", domains: ["uhp.ac.ma"] },
  { slug: "ucd", name: "Université Chouaïb Doukkali", city: "El Jadida", frArticle: "l'", domains: ["ucd.ac.ma"] },
  { slug: "usms", name: "Université Sultan Moulay Slimane", city: "Béni Mellal", frArticle: "l'", domains: ["usms.ac.ma"] },
  { slug: "um6p", name: "Université Mohammed VI Polytechnique", city: "Ben Guerir", frArticle: "l'", domains: ["um6p.ma"] },
  { slug: "uemf", name: "Université Euromed de Fès", city: "Fès", frArticle: "l'", domains: ["uemf.ma"] },
  { slug: "aui", name: "Al Akhawayn University", city: "Ifrane", frArticle: null, domains: ["aui.ma"] },
  { slug: "emi", name: "École Mohammadia d'Ingénieurs", city: "Rabat", frArticle: "l'", domains: ["emi.ac.ma"] },
  { slug: "inpt", name: "Institut National des Postes et Télécommunications", city: "Rabat", frArticle: "l'", domains: ["inpt.ac.ma"] },
  { slug: "enim", name: "École Nationale Supérieure des Mines", city: "Rabat", frArticle: "l'", domains: ["enim.ac.ma"] },
  { slug: "iav", name: "Institut Agronomique et Vétérinaire Hassan II", city: "Rabat", frArticle: "l'", domains: ["iav.ac.ma"] }
];

/**
 * The institution a `/campus/<slug>` URL names, or null.
 *
 * Deliberately a lookup on `INSTITUTIONS` and not on anything derived from a
 * request: the slug in the URL decides which name is printed on the page, so an
 * unknown slug has to 404 rather than fall through to a generic page. A page
 * that carried an institution's name without that name being on the list would
 * be a page claiming to be made for a faculty we know nothing about.
 */
export function getInstitutionBySlug(slug: string): Institution | null {
  return INSTITUTIONS.find((institution) => institution.slug === slug) || null;
}

/**
 * The institution's name as it appears inside a French sentence.
 *
 * Combine it with `frenchDe` for the genitive: `frenchDe(institutionWithArticleFr(i))`
 * gives "de l'Université Ibn Tofaïl" and "d'Al Akhawayn University", both of
 * which a concatenation would get wrong in a different way.
 */
export function institutionWithArticleFr(institution: Institution): string {
  return institution.frArticle ? `${institution.frArticle}${institution.name}` : institution.name;
}

export type CampusMatch =
  /** A domain on the named list: we can greet them by their institution. */
  | { kind: "named"; slug: string; name: string; city: string; domain: string }
  /** Academic by the .ac.ma rule, but not one I can name. Full access. */
  | { kind: "academic"; slug: string; domain: string }
  /** Anything else -- a Gmail address, a company address, a typo. */
  | { kind: "other"; domain: string };

/**
 * The domain part of an address, or "" when there is nothing usable.
 *
 * Takes the part after the LAST `@`, because that is the one a mail server
 * routes on; splitting on the first would read `a@b@uit.ac.ma` as domain `b`
 * and reject a student whose address is unusual but valid. The trailing dot of
 * a fully qualified name is dropped so `uit.ac.ma.` matches.
 */
export function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 0) return "";
  return email
    .slice(at + 1)
    .trim()
    .toLowerCase()
    .replace(/\.+$/, "");
}

/** Exact domain, or any subdomain of it. Never a bare suffix match on text. */
function domainMatches(domain: string, candidate: string): boolean {
  return domain === candidate || domain.endsWith(`.${candidate}`);
}

export function recognizeCampus(email: string): CampusMatch {
  const domain = emailDomain(email);
  if (!domain) return { kind: "other", domain: "" };

  for (const institution of INSTITUTIONS) {
    if (institution.domains.some((candidate) => domainMatches(domain, candidate))) {
      return {
        kind: "named",
        slug: institution.slug,
        name: institution.name,
        city: institution.city,
        domain
      };
    }
  }

  if (domainMatches(domain, ACADEMIC_SUFFIX)) {
    /*
     * The slug is derived from the domain rather than left blank, so these
     * subscribers are still grouped by institution in the email provider even
     * though this file cannot name them. `fs.uit.ac.ma` and `ensa.uit.ac.ma`
     * become distinct tags, which is the right granularity: they are different
     * faculties with different students.
     */
    return { kind: "academic", slug: domain.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), domain };
  }

  return { kind: "other", domain };
}

/**
 * The tag that reaches the email provider, or null for an address we have no
 * institution claim about.
 *
 * Returning null rather than a `campus:other` tag is deliberate: a tag is a
 * claim, and "this person is at an institution we could not identify" is not a
 * claim worth storing. It would also be wrong for the majority of signups,
 * which come from the footer on a personal address.
 */
export function campusTag(match: CampusMatch): string | null {
  return match.kind === "other" ? null : `campus:${match.slug}`;
}

/** True when the address earns the institution-specific digest. */
export function isCampusAddress(email: string): boolean {
  return recognizeCampus(email).kind !== "other";
}

/**
 * What to call the reader's institution on screen.
 *
 * The `academic` case shows the domain rather than a made-up name. A student at
 * a faculty missing from the list above is better served by seeing
 * "ensa.uit.ac.ma" -- which is demonstrably their own address, so they can tell
 * it was read correctly -- than by a generic phrase that could mean anything.
 */
export function campusLabel(match: CampusMatch, locale: Locale): string {
  if (match.kind === "named") return match.name;
  if (match.kind === "academic") return match.domain;
  return locale === "fr" ? "Établissement non reconnu" : "Institution not recognised";
}
