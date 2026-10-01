import type { Locale } from "@/i18n/config";

/**
 * Durations and study levels, rendered in the reader's language.
 *
 * These two fields are free text copied from each employer's posting, and the
 * postings are in whatever language the employer writes in. The board started
 * French, so the data was French; thirty-three listings added from the US,
 * Canada, Germany, the Netherlands and the UK brought English in. The result
 * was 52 of 109 rows on the ENGLISH page reading "3 MOIS MINIMUM" and
 * "12 SEMAINES", beside a fully translated "INTERNSHIP · HYBRID · UNITED
 * KINGDOM" -- and two French rows reading "3-6 MONTHS". It reads as a data
 * leak because it is one.
 *
 * Both fields are formulaic enough to parse rather than hand-translate, which
 * also means a listing added next week is formatted without anyone remembering
 * to. Anything that does not parse is passed through unchanged: showing the
 * employer's own words is a better failure than dropping the field.
 */

const UNITS: Record<string, { en: [string, string]; fr: [string, string] }> = {
  month: { en: ["month", "months"], fr: ["mois", "mois"] },
  week: { en: ["week", "weeks"], fr: ["semaine", "semaines"] },
  year: { en: ["year", "years"], fr: ["an", "ans"] }
};

const UNIT_WORDS: Record<string, keyof typeof UNITS> = {
  mois: "month",
  month: "month",
  months: "month",
  semaine: "week",
  semaines: "week",
  week: "week",
  weeks: "week",
  an: "year",
  ans: "year",
  year: "year",
  years: "year"
};

const QUALIFIERS: Record<string, Record<Locale, string>> = {
  minimum: { en: "minimum", fr: "minimum" },
  "ou plus": { en: "or longer", fr: "ou plus" },
  "or longer": { en: "or longer", fr: "ou plus" }
};

export function formatDuration(raw: string | undefined, locale: Locale): string {
  const value = (raw || "").trim();
  if (!value) return "";

  // "12 mois, 15h/semaine" and anything else with its own structure: translate
  // the leading duration and keep the remainder as the employer wrote it.
  const [head, ...restParts] = value.split(",");
  // "12 mois, 15h/semaine": the trailing half is the employer's own detail, and
  // passing it through verbatim is what left "15h/semaine" on the English page.
  // Hours-per-week is the only shape that occurs, and it is mechanical.
  const rest = restParts
    .join(",")
    .trim()
    .replace(/(\d+)\s*h\s*\/\s*(semaine|week)/i, (_m, hours) =>
      locale === "fr" ? `${hours}h/semaine` : `${hours}h/week`
    );

  const match = head
    .trim()
    .match(/^(\d+)\s*(?:-|–|\s+to\s+|\s+a\s+)?\s*(\d+)?\s*([A-Za-zÀ-ÿ]+)\s*(.*)$/u);
  if (!match) return value;

  const [, first, second, unitWord, tail] = match;
  const unit = UNIT_WORDS[unitWord.toLowerCase()];
  if (!unit) return value;

  const count = Number(second || first);
  const noun = UNITS[unit][locale][count === 1 ? 0 : 1];
  const span = second ? `${first}-${second}` : first;

  const qualifierKey = tail.trim().toLowerCase();
  const qualifier = QUALIFIERS[qualifierKey]?.[locale] ?? (qualifierKey ? tail.trim() : "");

  return [`${span} ${noun}`, qualifier, rest].filter(Boolean).join(qualifier && rest ? ", " : " ").trim();
}

/**
 * Study level.
 *
 * "Bac+5" is precise and instantly readable to a French student and means
 * nothing to a British or Canadian one, and it was rendering on UK, US,
 * Canadian, German, Dutch and Portuguese rows. The French side keeps the scale
 * it uses; the English side gets the nearest honest equivalent rather than a
 * literal translation of a scale that does not exist there.
 */
const LEVELS: Record<string, Record<Locale, string>> = {
  "bac+2": { en: "2 years of study", fr: "Bac+2" },
  "bac+3": { en: "Bachelor's", fr: "Bac+3" },
  "bac+4": { en: "4 years of study", fr: "Bac+4" },
  "bac+5": { en: "Master's", fr: "Bac+5" },
  "bac+4/5": { en: "4th or 5th year of study", fr: "Bac+4/5" },
  "bac+3/4": { en: "3rd or 4th year of study", fr: "Bac+3/4" },
  "bac+3/bac+5": { en: "Bachelor's or Master's", fr: "Bac+3/Bac+5" },
  "bac+3 a bac+5": { en: "Bachelor's to Master's", fr: "Bac+3 à Bac+5" },
  "bac+2 a bac+5": { en: "2nd to 5th year of study", fr: "Bac+2 à Bac+5" },
  "bac+3 a doctorat": { en: "Bachelor's to PhD", fr: "Bac+3 à doctorat" },
  "bac+5 ou doctorat": { en: "Master's or PhD", fr: "Bac+5 ou doctorat" },
  doctorat: { en: "PhD", fr: "Doctorat" },
  phd: { en: "PhD", fr: "Doctorat" },
  "bachelor or master": { en: "Bachelor's or Master's", fr: "Bac+3 ou Bac+5" },
  "final-year engineering student": {
    en: "Final-year engineering student",
    fr: "Étudiant ingénieur en dernière année"
  }
};

export function formatLevel(raw: string | undefined, locale: Locale): string {
  const value = (raw || "").trim();
  if (!value) return "";
  return LEVELS[value.toLowerCase()]?.[locale] ?? value;
}
