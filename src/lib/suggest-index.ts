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
export function buildSuggestIndex(locale: Locale): Suggestion[] {
  const out: Suggestion[] = [];

  for (const post of posts) {
    out.push({
      t: post.locales[locale]?.title || post.title,
      h: `/${locale}/blog/${post.slug}`,
      k: "guide",
      // The category is searchable too, so "career" finds the career guides
      // even when the word is not in the title.
      s: post.category
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
