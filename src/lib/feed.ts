import { newsBriefs } from "@/content/news";
import { posts } from "@/content/posts";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { feedPath } from "@/lib/feed-paths";
import { absoluteUrl } from "@/lib/site-url";

/**
 * One RSS feed per locale.
 *
 * There was a single /feed.xml, built entirely from the English strings, and
 * the footer on every French page linked to it. A French reader who subscribed
 * got an English feed -- the one part of the site that was not translated.
 *
 * Two smaller things the old feed got wrong. It declared `en-us`, which is not
 * what this site is: the audience is worldwide and the copy is international
 * English, so the tag is `en`. And it carried no `atom:link rel="self"`, the
 * element that tells a reader where the feed it is holding actually lives --
 * the one thing every feed validator asks for and the thing that lets a reader
 * re-find a feed it was handed a copy of.
 */
function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const CATEGORY: Record<Locale, { blog: string; news: string }> = {
  en: { blog: "Blog", news: "News" },
  fr: { blog: "Article", news: "Actualite" }
};

type FeedItem = {
  link: string;
  title: string;
  description: string;
  publishedAt: string;
  category: string;
};

/**
 * What belongs in the feed.
 *
 * The auto-generated briefs used to be here, sixty of them, and because they
 * are the freshest thing on the site they sat at the top: the first three items
 * a subscriber saw were reprints of Amazon's, GitHub's and OpenAI's own summary
 * paragraphs, and the site's own writing started at item sixty-one.
 *
 * Those same pages carry `robots: { index: false }`, for the reason spelled out
 * in src/app/[lang]/news/auto/[slug]/page.tsx: they are near-duplicate quoted
 * content, and putting the domain's weight behind them risks the long-form
 * posts. A feed is the same judgement with a human on the other end. Sending a
 * subscriber sixty reprints to reach twenty-seven original pieces is a worse
 * deal than sending them the twenty-seven, and the briefs stay one click away
 * on /news and /news/live where the curation is visible.
 */
function feedItems(locale: Locale): FeedItem[] {
  const category = CATEGORY[locale];

  const blogItems = posts.map((post) => ({
    link: absoluteUrl(`/${locale}/blog/${post.slug}`),
    title: post.locales[locale].title || post.title,
    description: post.locales[locale].excerpt || post.excerpt,
    publishedAt: post.publishedAt,
    category: category.blog
  }));

  const newsItems = newsBriefs.map((brief) => ({
    link: absoluteUrl(`/${locale}/news/${brief.slug}`),
    title: brief.locales[locale].title,
    description: brief.locales[locale].summary,
    publishedAt: brief.publishedAt,
    category: category.news
  }));

  return [...blogItems, ...newsItems].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

function rfc822(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

export function buildFeed(locale: Locale) {
  const dict = getDictionary(locale);
  const items = feedItems(locale);
  const self = absoluteUrl(feedPath[locale]);

  const body = items
    .map(
      (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${rfc822(item.publishedAt)}</pubDate>
      <category>${escapeXml(item.category)}</category>
    </item>`
    )
    .join("");

  // lastBuildDate is the newest item, not Date.now(). A feed that reports "just
  // built" on every request tells a reader it changed when nothing did.
  const lastBuild = items.length ? rfc822(items[0].publishedAt) : new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(dict.footer.title)}</title>
    <link>${escapeXml(absoluteUrl(`/${locale}`))}</link>
    <atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(dict.footer.description)}</description>
    <language>${locale}</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>${body}
  </channel>
</rss>`;
}

export function feedResponse(locale: Locale) {
  return new Response(buildFeed(locale), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
