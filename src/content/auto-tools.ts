import type { Locale } from "@/i18n/config";
import { usableSummary, usableTitle } from "@/lib/auto-summary";
import autoToolsData from "@/content/auto-tools.json";
import { isBlockedSource } from "@/lib/blocked-source";

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

/*
 * The empty-summary guard that used to live here only caught an empty string,
 * and the agent that writes this file produces much worse than empty: see
 * src/lib/auto-summary.ts for what is actually in the JSON, counted. The gate
 * moved there so the news and tools loaders cannot drift apart, and so a test
 * can run it over the real files.
 */

export function getAutoToolsUpdatedAt() {
  return payload.updatedAt;
}

export function getAutoTools(locale: Locale, limit = 10) {
  const sorted = [...curatedItems].sort(byNewest);
  const picked = diversifyBySource(sorted, limit);
  return picked.map((item) => ({
    ...item,
    title: usableTitle(item.locales[locale].title),
    summary: usableSummary(
      item.locales[locale].summary,
      usableTitle(item.locales[locale].title),
      item.source,
      locale
    )
  })) satisfies LocalizedAutoToolItem[];
}

export function getAutoToolsCount() {
  return curatedItems.length;
}
