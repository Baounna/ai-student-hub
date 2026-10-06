import type { Locale } from "@/i18n/config";

/**
 * The language a listing's own title is written in, when it can be told.
 *
 * Job titles arrive in whatever language the employer posted in, and the board
 * shows all of them on both locales. So /en/stages serves `<html lang="en">`
 * over 59 French headings, and a screen reader voices "Stage - Administrateur
 * sécurité systèmes d'information" with an English synthesiser: phoneme soup,
 * on more than half the rows of the page this site is built around. Braille
 * users get the wrong contraction table. WCAG 3.1.2 asks for the language of
 * each passage to be marked, and the fix is one attribute per heading.
 *
 * Conservative on purpose. Marking an English title as French is WORSE than
 * leaving it unmarked -- the reader then gets a French voice reading English --
 * so anything mixed or unclear returns undefined and renders exactly as it does
 * today. "Internship - Cybersecurity & Cyber Défense Analyst" is genuinely both
 * and gets nothing; "Stage PFE - GenAI, LLM et RAG" is clearly French and gets
 * marked.
 */

/** Words that only appear in a French posting, and are not French-looking English. */
const FRENCH_MARKERS =
  /(^|\s|-)(stage|stagiaire|alternance|alternant\.?e?|apprenti\.?e?|ingénieur\.?e?|développeur|développeuse|chargé\.?e?|analyste|consultant\.?e?|responsable|technicien\.?e?)\b/i;

/** French grammar, which an English title does not contain. */
const FRENCH_GRAMMAR = /(\s(de|des|du|en|et|pour|sur|dans|aux?)\s|\sd'|\sl'|^d'|^l')/i;

/** Words that only appear in an English posting. */
const ENGLISH_MARKERS =
  /(^|\s|-)(intern|internship|engineer|engineering|scientist|developer|working\s+student|thesis|co-?op|graduate|placement|apprenticeship|manager|specialist|researcher)\b/i;

export function titleLanguage(title: string, pageLocale: Locale): Locale | undefined {
  const looksFrench = FRENCH_MARKERS.test(title) || FRENCH_GRAMMAR.test(title);
  const looksEnglish = ENGLISH_MARKERS.test(title);

  // Both, or neither: say nothing rather than say the wrong thing.
  if (looksFrench === looksEnglish) return undefined;

  const language: Locale = looksFrench ? "fr" : "en";
  // Already the page's language — the attribute would be noise.
  return language === pageLocale ? undefined : language;
}
