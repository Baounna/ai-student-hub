import type { MetadataRoute } from "next";
import { getAutoNewsRaw } from "@/content/auto-news";
import { comparisons, getAllCategories, getAllTags, posts, slugify } from "@/content/posts";
import { newsBriefs } from "@/content/news";
import { locales } from "@/i18n/config";
import { absoluteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const localizedStaticPages = locales.flatMap((locale) =>
    ["", "/news", "/blog", "/about", "/resources", "/compare", "/donate", "/growth-sprint", "/product/ai-career-guide"].map((route) => ({
      url: absoluteUrl(`/${locale}${route}`),
      lastModified: new Date()
    }))
  );

  const blogPages = locales.flatMap((locale) =>
    posts.map((post) => ({
      url: absoluteUrl(`/${locale}/blog/${post.slug}`),
      lastModified: new Date(post.publishedAt)
    }))
  );
  const newsPages = locales.flatMap((locale) =>
    newsBriefs.map((brief) => ({
      url: absoluteUrl(`/${locale}/news/${brief.slug}`),
      lastModified: new Date(brief.publishedAt)
    }))
  );
  const autoNewsPages = locales.flatMap((locale) =>
    getAutoNewsRaw().map((item) => ({
      url: absoluteUrl(`/${locale}/news/auto/${item.slug}`),
      lastModified: new Date(item.publishedAt || item.discoveredAt || Date.now())
    }))
  );

  const localizedComparisonPages = locales.flatMap((locale) =>
    comparisons.map((comparison) => ({
      url: absoluteUrl(`/${locale}/compare/${comparison.slug}`),
      lastModified: new Date()
    }))
  );
  const monetizationPages = [
    { url: absoluteUrl("/product/ai-career-guide"), lastModified: new Date() }
  ];

  const categoryPages = locales.flatMap((locale) =>
    getAllCategories().map((category) => ({
      url: absoluteUrl(`/${locale}/blog/category/${slugify(category)}`),
      lastModified: new Date()
    }))
  );

  const tagPages = locales.flatMap((locale) =>
    getAllTags().map((tag) => ({
      url: absoluteUrl(`/${locale}/blog/tag/${slugify(tag)}`),
      lastModified: new Date()
    }))
  );

  return [
    ...localizedStaticPages,
    ...blogPages,
    ...newsPages,
    ...autoNewsPages,
    ...localizedComparisonPages,
    ...monetizationPages,
    ...categoryPages,
    ...tagPages
  ];
}
