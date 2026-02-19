import { getAutoNews } from "@/content/auto-news";
import { newsBriefs } from "@/content/news";
import { posts } from "@/content/posts";
import { absoluteUrl } from "@/lib/site-url";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const blogItems = posts.map((post) => ({
    type: "blog" as const,
    link: absoluteUrl(`/en/blog/${post.slug}`),
    title: post.locales.en.title || post.title,
    description: post.locales.en.excerpt || post.excerpt,
    publishedAt: post.publishedAt
  }));

  const newsItems = newsBriefs.map((brief) => ({
    type: "news" as const,
    link: absoluteUrl(`/en/news/${brief.slug}`),
    title: `[News] ${brief.locales.en.title}`,
    description: brief.locales.en.summary,
    publishedAt: brief.publishedAt
  }));

  const autoNewsItems = getAutoNews("en", 60).map((item) => ({
    type: "auto-news" as const,
    link: absoluteUrl(`/en/news/auto/${item.slug}`),
    title: `[Auto] ${item.title}`,
    description: item.summary,
    publishedAt: item.publishedAt
  }));

  const items = [...blogItems, ...newsItems, ...autoNewsItems]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .map((item) => {
      const title = escapeXml(item.title);
      const description = escapeXml(item.description);
      const pubDate = new Date(item.publishedAt).toUTCString();

      return `
        <item>
          <title>${title}</title>
          <link>${item.link}</link>
          <guid>${item.link}</guid>
          <description>${description}</description>
          <pubDate>${pubDate}</pubDate>
          <category>${item.type === "news" ? "AI/CS News" : item.type === "auto-news" ? "Auto AI/CS News" : "Blog"}</category>
        </item>
      `;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>AI Student Hub</title>
    <link>${absoluteUrl("/")}</link>
    <description>Project-first AI tutorials and career systems for engineering students.</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
