import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/config";

/**
 * The three lines under "What you will find here".
 *
 * The home page and the About page each carried their own copy of this list,
 * and both contained the sentence "Weekly AI + Cybersecurity updates" -- which
 * the EditorialTrust panel also printed, so the home page said it twice. It was
 * also not true: the newest hand-written piece is 24 September 2026 and there
 * are two publishing dates in the preceding seven months.
 *
 * One list, so a correction lands everywhere, and three claims that something
 * in the repository actually backs: the scheduled job that re-checks the
 * internship board every Monday and stamps each entry, and the fact that
 * nothing here is behind a signup.
 */
export function siteHighlights(locale: Locale): string[] {
  const configured = siteConfig.socialProofStats[locale];
  if (configured.length > 0) return configured;

  return locale === "fr"
    ? [
        "Base de connaissance IA/CS pour builders et apprenants",
        "Guides pratiques, outils, et un tableau de stages revérifié chaque semaine",
        "Lecture libre, sans inscription"
      ]
    : [
        "AI + Cybersecurity knowledge base for builders and learners",
        "Practical guides, tools, and an internship board re-checked weekly",
        "Free to read, no signup required"
      ];
}
