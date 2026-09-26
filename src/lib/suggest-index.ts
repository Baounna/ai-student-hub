import { comparisons, posts, recommendedTools, studentStudyTools } from "@/content/posts";
import { getOpenStages } from "@/content/stages";
import type { Locale } from "@/i18n/config";
import type { Suggestion } from "@/lib/suggest";

/**
 * Everything on this site a reader could reasonably be searching for, in one
 * locale, as a flat list small enough to hand the browser once.
 *
 * Built on the server from the same content the pages render, so a suggestion
 * can never point at something that is not there -- which is the failure mode
 * of every hand-maintained suggestion list.
 */
/**
 * Categories are stored as one English string per post, and unlike tool
 * categories there is no localized form in the data. Left as-is, a French
 * reader saw "Career/Interviews" under a French title and could not find those
 * guides by typing "carriere".
 */
const CATEGORY_FR: Record<string, string> = {
  "AI Fundamentals": "Fondamentaux IA",
  "ML Engineering": "Ingenierie ML",
  "LLM Systems": "Systemes LLM",
  "Cloud/DevOps": "Cloud/DevOps",
  "Security & Performance": "Securite & Performance",
  "Career/Interviews": "Carriere/Entretiens",
  "CS Fundamentals": "Fondamentaux informatique",
  "Systems & Backend": "Systemes & Backend"
};

export function buildSuggestIndex(locale: Locale): Suggestion[] {
  const out: Suggestion[] = [];

  for (const post of posts) {
    const category = locale === "fr" ? CATEGORY_FR[post.category] || post.category : post.category;
    out.push({
      t: post.locales[locale]?.title || post.title,
      h: `/${locale}/blog/${post.slug}`,
      k: "guide",
      s: category,
      // Matched against but never shown. Tags and keywords cost about 2 KB
      // across all 24 guides and let "arxiv" or "three pass method" find the
      // paper-reading guide, which its title alone does not. The full article
      // bodies would be the real recall win and are 150 KB+, which is what the
      // "press Enter to search" row exists for instead.
      m: [...post.tags, ...post.keywords].join(" ")
    });
  }

  for (const comparison of comparisons) {
    out.push({
      t: comparison.locales[locale].title,
      h: `/${locale}/compare/${comparison.slug}`,
      k: "compare"
    });
  }

  for (const tool of [...recommendedTools, ...studentStudyTools]) {
    out.push({
      t: tool.name,
      h: `/${locale}/resources`,
      k: "tool",
      s: typeof tool.category === "string" ? tool.category : tool.category?.[locale]
    });
  }

  // Internships carry the employer and city as the sub-label, so typing a
  // company or a city finds the role -- the two things people actually search
  // for on a job list.
  for (const stage of getOpenStages()) {
    out.push({
      t: stage.role,
      h: `/${locale}/stages`,
      k: "internship",
      s: `${stage.company}, ${stage.city}`
    });
  }

  return out;
}
