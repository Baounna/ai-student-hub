import { cache } from "react";
import { parseHttpUrl } from "@/lib/url";

export type LiveNewsItem = {
  title: string;
  href: string;
  source: string;
  publishedAt: string;
  topic: string;
};

type FeedSource = {
  name: string;
  href: string;
};

const FEED_SOURCES: FeedSource[] = [
  { name: "arXiv cs.AI", href: "https://arxiv.org/rss/cs.AI" },
  { name: "arXiv cs.LG", href: "https://arxiv.org/rss/cs.LG" },
  { name: "Hugging Face Blog", href: "https://huggingface.co/blog/feed.xml" },
  { name: "Google AI Blog", href: "https://blog.google/technology/ai/rss/" },
  { name: "NVIDIA Developer Blog", href: "https://developer.nvidia.com/blog/feed/" },
  { name: "OpenAI News", href: "https://openai.com/news/rss.xml" },
  { name: "GitHub Blog", href: "https://github.blog/feed/" },
  { name: "Cloudflare Blog", href: "https://blog.cloudflare.com/rss/" }
];

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#39;": "'"
};

function decodeHtmlEntities(value: string) {
  return value.replace(/&(amp|lt|gt|quot|#39);/g, (match) => ENTITY_MAP[match] || match);
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, "").trim();
}

function extractTag(block: string, tagName: string) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"));
  if (!match) return "";
  return stripTags(decodeHtmlEntities(match[1] || ""));
}

function extractAtomLink(block: string) {
  const alternateMatch =
    block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"[^>]*>/i) ||
    block.match(/<link[^>]*href="([^"]+)"[^>]*rel="alternate"[^>]*>/i);
  if (alternateMatch?.[1]) return alternateMatch[1].trim();

  const fallbackMatch = block.match(/<link[^>]*href="([^"]+)"[^>]*>/i);
  return fallbackMatch?.[1]?.trim() || "";
}

function normalizeDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function getTopicFromTitle(title: string) {
  const text = title.toLowerCase();
  if (/(benchmark|performance|aime|gpqa|swe-bench|mmmu|score)/.test(text)) return "AI Performance";
  if (/(chip|gpu|hardware|edge|nvidia|accelerator)/.test(text)) return "Computer Systems";
  if (/(agent|llm|model|multimodal|rag|inference|genai)/.test(text)) return "AI Systems";
  if (/(compiler|kernel|database|network|security)/.test(text)) return "Computer Science";
  return "AI/CS Updates";
}

function isUsableUrl(value: string) {
  const parsed = parseHttpUrl(value);
  return Boolean(parsed);
}

function parseRssItems(xml: string, sourceName: string) {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi))
    .map((match) => match[1])
    .filter(Boolean);

  return items
    .map((block) => {
      const title = extractTag(block, "title");
      const link = extractTag(block, "link");
      const pubDate = extractTag(block, "pubDate") || extractTag(block, "dc:date");
      if (!title || !isUsableUrl(link)) return null;

      return {
        title,
        href: link,
        source: sourceName,
        publishedAt: normalizeDate(pubDate),
        topic: getTopicFromTitle(title)
      } as LiveNewsItem;
    })
    .filter((item): item is LiveNewsItem => Boolean(item));
}

function parseAtomEntries(xml: string, sourceName: string) {
  const entries = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi))
    .map((match) => match[1])
    .filter(Boolean);

  return entries
    .map((block) => {
      const title = extractTag(block, "title");
      const href = extractAtomLink(block);
      const published = extractTag(block, "updated") || extractTag(block, "published");
      if (!title || !isUsableUrl(href)) return null;

      return {
        title,
        href,
        source: sourceName,
        publishedAt: normalizeDate(published),
        topic: getTopicFromTitle(title)
      } as LiveNewsItem;
    })
    .filter((item): item is LiveNewsItem => Boolean(item));
}

async function fetchFeed(source: FeedSource) {
  try {
    const response = await fetch(source.href, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 60 * 30 }
    });
    if (!response.ok) return [];

    const xml = await response.text();
    const rssItems = parseRssItems(xml, source.name);
    if (rssItems.length) return rssItems;
    return parseAtomEntries(xml, source.name);
  } catch {
    return [];
  }
}

const MAX_NEWS_AGE_DAYS = 30;

export const getLiveAiCsUpdates = cache(async (limit = 24) => {
  const feedResults = await Promise.all(FEED_SOURCES.map((source) => fetchFeed(source)));
  const combined = feedResults.flat();

  const deduped = new Map<string, LiveNewsItem>();
  for (const item of combined) {
    const key = `${item.href}|${item.title}`.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  }

  const sorted = Array.from(deduped.values())
    .sort((a, b) => {
      if (!a.publishedAt && !b.publishedAt) return 0;
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return a.publishedAt < b.publishedAt ? 1 : -1;
    });

  const minDateMs = Date.now() - MAX_NEWS_AGE_DAYS * 24 * 60 * 60 * 1000;
  const recent = sorted.filter((item) => !item.publishedAt || new Date(item.publishedAt).getTime() >= minDateMs);

  return (recent.length ? recent : sorted).slice(0, limit);
});

export function getLiveNewsSources() {
  return FEED_SOURCES;
}
