import type { Locale } from "@/i18n/config";
import autoNewsData from "@/content/auto-news.json";

export type AutoNewsItem = {
  slug: string;
  topic: string;
  source: string;
  sourceFeed: string;
  href: string;
  publishedAt: string;
  discoveredAt: string;
  locales: {
    en: {
      title: string;
      summary: string;
    };
    fr: {
      title: string;
      summary: string;
    };
  };
};

export type LocalizedAutoNewsItem = AutoNewsItem & {
  title: string;
  summary: string;
};

type AutoNewsPayload = {
  version: number;
  updatedAt: string;
  items: AutoNewsItem[];
};

const payload = autoNewsData as AutoNewsPayload;

function byNewest(a: AutoNewsItem, b: AutoNewsItem) {
  if (a.publishedAt < b.publishedAt) return 1;
  if (a.publishedAt > b.publishedAt) return -1;
  if (a.discoveredAt < b.discoveredAt) return 1;
  if (a.discoveredAt > b.discoveredAt) return -1;
  return 0;
}

export function getAutoNewsUpdatedAt() {
  return payload.updatedAt;
}

export function getAutoNews(locale: Locale, limit = 24) {
  return [...payload.items]
    .sort(byNewest)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      title: item.locales[locale].title,
      summary: item.locales[locale].summary
    })) satisfies LocalizedAutoNewsItem[];
}

export function getAutoNewsBySlug(slug: string, locale: Locale): LocalizedAutoNewsItem | undefined {
  const item = payload.items.find((entry) => entry.slug === slug);
  if (!item) return undefined;

  return {
    ...item,
    title: item.locales[locale].title,
    summary: item.locales[locale].summary
  };
}

export function getAutoNewsRaw() {
  return payload.items;
}

export function getAutoNewsCount() {
  return payload.items.length;
}
