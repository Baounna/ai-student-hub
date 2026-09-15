import type { Locale } from "@/i18n/config";
import autoToolsData from "@/content/auto-tools.json";

export type AutoToolItem = {
  slug: string;
  toolName: string;
  category: string;
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

export type LocalizedAutoToolItem = AutoToolItem & {
  title: string;
  summary: string;
};

type AutoToolsPayload = {
  version: number;
  updatedAt: string;
  items: AutoToolItem[];
};

const payload = autoToolsData as AutoToolsPayload;

function isBlockedSource(item: AutoToolItem) {
  const values = [item.source, item.sourceFeed, item.href].join(" ").toLowerCase();
  return values.includes("arxiv.org") || /\barxiv\b/.test(values);
}

const curatedItems = payload.items.filter((item) => !isBlockedSource(item));

function byNewest(a: AutoToolItem, b: AutoToolItem) {
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

const AUTO_TOOLS_UI_MAX_PER_SOURCE = parsePositiveInt(process.env.AUTO_TOOLS_UI_MAX_PER_SOURCE, 8);

function sourceKey(item: AutoToolItem) {
  return String(item.sourceFeed || item.source || "unknown").trim().toLowerCase() || "unknown";
}

function diversifyBySource(items: AutoToolItem[], limit: number, maxPerSource = AUTO_TOOLS_UI_MAX_PER_SOURCE) {
  const selected: AutoToolItem[] = [];
  const counts = new Map<string, number>();
  const buckets = new Map<string, AutoToolItem[]>();

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

/** Same reason as the news loader: a cleaned-empty summary must not become an
 * empty meta description. */
function summaryOrFallback(summary: string, title: string, source: string, locale: Locale) {
  const text = (summary || "").trim();
  if (text) return text;
  return locale === "fr" ? `${title} — via ${source}.` : `${title} — reported by ${source}.`;
}

export function getAutoToolsUpdatedAt() {
  return payload.updatedAt;
}

export function getAutoTools(locale: Locale, limit = 10) {
  const sorted = [...curatedItems].sort(byNewest);
  const picked = diversifyBySource(sorted, limit);
  return picked.map((item) => ({
    ...item,
    title: item.locales[locale].title,
    summary: summaryOrFallback(
      item.locales[locale].summary,
      item.locales[locale].title,
      item.source,
      locale
    )
  })) satisfies LocalizedAutoToolItem[];
}

export function getAutoToolsCount() {
  return curatedItems.length;
}
