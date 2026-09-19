import type { MetadataRoute } from "next";
import { comparisons, getAllCategories, getAllTags, posts, slugify } from "@/content/posts";
import { newsBriefs } from "@/content/news";
import { locales } from "@/i18n/config";
import { absoluteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const rootEntry: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1
    }
  ];

  const localizedStaticPages = locales.flatMap((locale) =>
    [
      { route: "", priority: 0.95, changeFrequency: "daily" as const },
      { route: "/news", priority: 0.95, changeFrequency: "hourly" as const },
      { route: "/news/live", priority: 0.82, changeFrequency: "hourly" as const },
      { route: "/blog", priority: 0.92, changeFrequency: "daily" as const },
      { route: "/about", priority: 0.68, changeFrequency: "monthly" as const },
      { route: "/resources", priority: 0.9, changeFrequency: "weekly" as const },
      { route: "/compare", priority: 0.9, changeFrequency: "weekly" as const },
      { route: "/donate", priority: 0.52, changeFrequency: "monthly" as const },
      { route: "/product/ai-career-guide", priority: 0.86, changeFrequency: "weekly" as const }
    ].map((item) => ({
      url: absoluteUrl(`/${locale}${item.route}`),
      lastModified: now,
      changeFrequency: item.changeFrequency,
      priority: item.priority
    }))
  );

  const blogPages = locales.flatMap((locale) =>
    posts.map((post) => ({
      url: absoluteUrl(`/${locale}/blog/${post.slug}`),
      lastModified: new Date(post.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.84
    }))
  );
  const newsPages = locales.flatMap((locale) =>
    newsBriefs.map((brief) => ({
      url: absoluteUrl(`/${locale}/news/${brief.slug}`),
      lastModified: new Date(brief.publishedAt),
      changeFrequency: "daily" as const,
      priority: 0.87
    }))
  );
  // The auto briefs are deliberately absent. They carry robots noindex, and
  // listing a page in the sitemap is a request to index it — asking for the
  // opposite of what the page itself says wastes crawl budget on 480 URLs and
  // sends a contradictory signal.
  //
  // Worth knowing before changing this back: almost nothing links to those
  // detail pages. /news renders the live feed when it has one and links each
  // item straight to its original source; the "Read auto brief" link only
  // appears in the fallback branch, when the live fetch comes back empty. So
  // the sitemap was effectively their only route in, for crawlers and readers
  // alike. Whether 480 near-orphaned pages should exist at all is a separate
  // question from whether they belong in the index.

  const localizedComparisonPages = locales.flatMap((locale) =>
    comparisons.map((comparison) => ({
      url: absoluteUrl(`/${locale}/compare/${comparison.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.86
    }))
  );

  const categoryPages = locales.flatMap((locale) =>
    getAllCategories().map((category) => ({
      url: absoluteUrl(`/${locale}/blog/category/${slugify(category)}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  );

  const tagPages = locales.flatMap((locale) =>
    getAllTags().map((tag) => ({
      url: absoluteUrl(`/${locale}/blog/tag/${slugify(tag)}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65
    }))
  );

  return [
    ...rootEntry,
    ...localizedStaticPages,
    ...blogPages,
    ...newsPages,
    ...localizedComparisonPages,
    ...categoryPages,
    ...tagPages
  ];
}
