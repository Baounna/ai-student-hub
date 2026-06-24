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

function isBlockedSource(item: AutoNewsItem) {
  const values = [item.source, item.sourceFeed, item.href].join(" ").toLowerCase();
  return values.includes("arxiv.org") || /\barxiv\b/.test(values);
}

const curatedItems = payload.items.filter((item) => !isBlockedSource(item));

function byNewest(a: AutoNewsItem, b: AutoNewsItem) {
  if (a.publishedAt < b.publishedAt) return 1;
  if (a.publishedAt > b.publishedAt) return -1;
  if (a.discoveredAt < b.discoveredAt) return 1;
  if (a.discoveredAt > b.discoveredAt) return -1;
  return 0;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

const AUTO_NEWS_UI_MAX_PER_SOURCE = parsePositiveInt(process.env.AUTO_NEWS_UI_MAX_PER_SOURCE, 12);

function sourceKey(item: AutoNewsItem) {
  return String(item.sourceFeed || item.source || "unknown").trim().toLowerCase() || "unknown";
}

function diversifyBySource(items: AutoNewsItem[], limit: number, maxPerSource = AUTO_NEWS_UI_MAX_PER_SOURCE) {
  const selected: AutoNewsItem[] = [];
  const counts = new Map<string, number>();
  const buckets = new Map<string, AutoNewsItem[]>();

  for (const item of items) {
    const key = sourceKey(item);
    const queue = buckets.get(key) || [];
    queue.push(item);
    buckets.set(key, queue);
  }

  const sourceOrder = Array.from(buckets.entries())
    .sort((a, b) => byNewest(a[1][0], b[1][0]))
    .map(([key]) => key);

  let moved = true;
  while (selected.length < limit && moved) {
    moved = false;
    for (const key of sourceOrder) {
      if (selected.length >= limit) break;

      const queue = buckets.get(key);
      if (!queue?.length) continue;

      const count = counts.get(key) || 0;
      if (count >= maxPerSource) continue;

      const next = queue.shift();
      if (!next) continue;

      selected.push(next);
      counts.set(key, count + 1);
      moved = true;
    }
  }

  return selected;
}

export function getAutoNewsUpdatedAt() {
  return payload.updatedAt;
}

export function getAutoNews(locale: Locale, limit = 24) {
  const sorted = [...curatedItems].sort(byNewest);
  const picked = diversifyBySource(sorted, limit);
  return picked
    .map((item) => ({
      ...item,
      title: item.locales[locale].title,
      summary: item.locales[locale].summary
    })) satisfies LocalizedAutoNewsItem[];
}

export function getAutoNewsBySlug(slug: string, locale: Locale): LocalizedAutoNewsItem | undefined {
  const item = curatedItems.find((entry) => entry.slug === slug);
  if (!item) return undefined;

  return {
    ...item,
    title: item.locales[locale].title,
    summary: item.locales[locale].summary
  };
}

export function getAutoNewsRaw() {
  return curatedItems;
}

export function getAutoNewsCount() {
  return curatedItems.length;
}
