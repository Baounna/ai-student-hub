import { cache } from "react";
import { getAutoNewsRaw } from "@/content/auto-news";
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
  kind?: "feed" | "page";
  allowedRoots?: string[];
  pathAllow?: RegExp[];
};

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

const LIVE_NEWS_MAX_PER_SOURCE = parsePositiveInt(process.env.LIVE_NEWS_MAX_PER_SOURCE, 8);

const FEED_SOURCES: FeedSource[] = [
  {
    name: "Anthropic News",
    href: "https://www.anthropic.com/news",
    kind: "page",
    allowedRoots: ["anthropic.com", "claude.ai"],
    pathAllow: [/^\/news\/[a-z0-9-]/i]
  },
  {
    name: "Anthropic Engineering",
    href: "https://www.anthropic.com/engineering",
    kind: "page",
    allowedRoots: ["anthropic.com"],
    pathAllow: [/^\/engineering\/[a-z0-9-]/i]
  },
  {
    name: "OpenAI News",
    href: "https://openai.com/news/",
    kind: "page",
    allowedRoots: ["openai.com"],
    pathAllow: [/^\/index\/[a-z0-9-]/i, /^\/news\/[a-z0-9-]/i]
  },
  { name: "DeepMind Blog", href: "https://deepmind.google/discover/blog/rss.xml" },
  { name: "Hugging Face Blog", href: "https://huggingface.co/blog/feed.xml" },
  { name: "Google AI Blog", href: "https://blog.google/technology/ai/rss/" },
  { name: "NVIDIA Developer Blog", href: "https://developer.nvidia.com/blog/feed/" },
  { name: "GitHub Blog", href: "https://github.blog/feed/" },
  { name: "Cloudflare Blog", href: "https://blog.cloudflare.com/rss/" },
  { name: "Kubernetes Blog", href: "https://kubernetes.io/feed.xml" },
  { name: "Docker Blog", href: "https://www.docker.com/blog/feed/" },
  { name: "Python Insider", href: "https://feeds.feedburner.com/PythonInsider" },
  { name: "Node.js Blog", href: "https://nodejs.org/en/feed/blog.xml" },
  { name: "Go Blog", href: "https://go.dev/blog/feed.atom" },
  { name: "Rust Blog", href: "https://blog.rust-lang.org/feed.xml" },
  { name: "PostgreSQL News", href: "https://www.postgresql.org/list/pgsql-announce.rss" },
  { name: "V8 Blog", href: "https://v8.dev/blog.atom" }
];

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#39;": "'"
};

function decodeCodePoint(value: number) {
  if (!Number.isFinite(value) || value <= 0 || value > 0x10ffff) return "";
  try {
    return String.fromCodePoint(value);
  } catch {
    return "";
  }
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => decodeCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => decodeCodePoint(Number.parseInt(dec, 10)))
    .replace(/&(amp|lt|gt|quot|#39);/g, (match) => ENTITY_MAP[match] || match);
}

function stripTags(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanupText(value: string) {
  return stripTags(decodeHtmlEntities(value));
}

function extractTag(block: string, tagName: string) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"));
  if (!match) return "";
  return cleanupText(match[1] || "");
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
  if (/(security|vulnerability|cve|trust\s*&?\s*safety|safety|privacy|abuse|jailbreak|prompt injection|incident)/.test(text)) {
    return "Security & Standards";
  }
  if (/(benchmark|performance|aime|gpqa|swe-bench|mmmu|score)/.test(text)) return "AI Performance";
  if (/(chip|gpu|hardware|edge|nvidia|accelerator)/.test(text)) return "Computer Systems";
  if (/(agent|llm|model|multimodal|rag|inference|genai)/.test(text)) return "AI Systems";
  if (/(compiler|kernel|database|network|distributed|api|backend|devops|kubernetes|linux|postgres|redis|performance)/.test(text)) {
    return "Computer Science";
  }
  return "AI/CS Updates";
}

function isUsableUrl(value: string) {
  return Boolean(parseHttpUrl(value));
}

function getHost(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function hostRoot(hostname: string) {
  const host = String(hostname || "").trim().toLowerCase();
  if (!host) return "";
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return host;
  return parts.slice(-2).join(".");
}

function resolveHref(base: string, href: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return "";
  }
}

function getAllowedRoots(source: FeedSource) {
  const roots = new Set<string>();
  const sourceRoot = hostRoot(getHost(source.href));
  if (sourceRoot) roots.add(sourceRoot);
  if (source.allowedRoots?.length) {
    source.allowedRoots
      .map((value) => hostRoot(value))
      .filter(Boolean)
      .forEach((value) => roots.add(value));
  }
  return roots;
}

function sourceAllowsPath(source: FeedSource, href: string) {
  if (!source.pathAllow?.length) return true;
  try {
    const pathname = new URL(href).pathname;
    return source.pathAllow.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
}

function isFirstPartySourceLink(source: FeedSource, itemHref: string) {
  const itemHost = getHost(itemHref);
  if (!itemHost) return false;
  const itemRoot = hostRoot(itemHost);
  const allowedRoots = getAllowedRoots(source);
  if (!allowedRoots.has(itemRoot)) return false;
  return sourceAllowsPath(source, itemHref);
}

function sourceKey(item: LiveNewsItem) {
  return String(item.source || "unknown").trim().toLowerCase() || "unknown";
}

function diversifyBySource(items: LiveNewsItem[], limit: number, maxPerSource = LIVE_NEWS_MAX_PER_SOURCE) {
  const selected: LiveNewsItem[] = [];
  const counts = new Map<string, number>();
  const buckets = new Map<string, LiveNewsItem[]>();

  for (const item of items) {
    const key = sourceKey(item);
    const queue = buckets.get(key) || [];
    queue.push(item);
    buckets.set(key, queue);
  }

  const sourceOrder = Array.from(buckets.keys());
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

  // If the per-source cap starved the result below the limit (few healthy
  // sources), top up from the remaining items ignoring the cap.
  if (selected.length < limit) {
    let toppedUp = true;
    while (selected.length < limit && toppedUp) {
      toppedUp = false;
      for (const key of sourceOrder) {
        if (selected.length >= limit) break;
        const queue = buckets.get(key);
        if (!queue?.length) continue;
        const next = queue.shift();
        if (!next) continue;
        selected.push(next);
        toppedUp = true;
      }
    }
  }

  return selected;
}

function parseRssItems(xml: string, source: FeedSource) {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi))
    .map((match) => match[1])
    .filter(Boolean);

  return items
    .map((block) => {
      const title = extractTag(block, "title");
      const rawLink = extractTag(block, "link");
      const link = resolveHref(source.href, rawLink);
      const pubDate = extractTag(block, "pubDate") || extractTag(block, "dc:date");
      if (!title || !isUsableUrl(link)) return null;
      if (!isFirstPartySourceLink(source, link)) return null;

      return {
        title,
        href: link,
        source: source.name,
        publishedAt: normalizeDate(pubDate),
        topic: getTopicFromTitle(title)
      } as LiveNewsItem;
    })
    .filter((item): item is LiveNewsItem => Boolean(item));
}

function parseAtomEntries(xml: string, source: FeedSource) {
  const entries = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi))
    .map((match) => match[1])
    .filter(Boolean);

  return entries
    .map((block) => {
      const title = extractTag(block, "title");
      const rawHref = extractAtomLink(block);
      const href = resolveHref(source.href, rawHref);
      const published = extractTag(block, "updated") || extractTag(block, "published");
      if (!title || !isUsableUrl(href)) return null;
      if (!isFirstPartySourceLink(source, href)) return null;

      return {
        title,
        href,
        source: source.name,
        publishedAt: normalizeDate(published),
        topic: getTopicFromTitle(title)
      } as LiveNewsItem;
    })
    .filter((item): item is LiveNewsItem => Boolean(item));
}

function parsePageItems(html: string, source: FeedSource) {
  const anchors = Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi));
  const ignoreTitle = /^(learn more|read more|read|more|news|all news|menu|home|about|contact|privacy|terms|log in|sign in|get started)$/i;
  const dedupe = new Set<string>();
  const items: LiveNewsItem[] = [];

  for (const match of anchors) {
    const href = resolveHref(source.href, cleanupText(match[1] || ""));
    if (!isUsableUrl(href)) continue;
    if (!isFirstPartySourceLink(source, href)) continue;
    if (dedupe.has(href)) continue;

    const title = cleanupText(match[2] || "").replace(/\s*\|\s*(anthropic|openai).*$/i, "").trim();
    if (!title || title.length < 12 || ignoreTitle.test(title)) continue;

    const start = Math.max(0, (match.index || 0) - 180);
    const end = Math.min(html.length, (match.index || 0) + match[0].length + 220);
    const context = cleanupText(html.slice(start, end));
    const publishedMatch =
      context.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ||
      context.match(
        /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b/i
      )?.[0] ||
      "";

    items.push({
      title,
      href,
      source: source.name,
      publishedAt: normalizeDate(publishedMatch),
      topic: getTopicFromTitle(`${title} ${context}`)
    });

    dedupe.add(href);
    if (items.length >= 16) break;
  }

  return items;
}

function parseSourcePayload(payload: string, source: FeedSource) {
  if (source.kind === "page") return parsePageItems(payload, source);

  const rssItems = parseRssItems(payload, source);
  if (rssItems.length) return rssItems;

  const atomItems = parseAtomEntries(payload, source);
  if (atomItems.length) return atomItems;

  return [];
}

async function fetchFeed(source: FeedSource) {
  try {
    const response = await fetch(source.href, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 60 * 30 }
    });
    if (!response.ok) return [];

    const payload = await response.text();
    return parseSourcePayload(payload, source);
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

  const sorted = Array.from(deduped.values()).sort((a, b) => {
    if (!a.publishedAt && !b.publishedAt) return 0;
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return a.publishedAt < b.publishedAt ? 1 : -1;
  });

  const minDateMs = Date.now() - MAX_NEWS_AGE_DAYS * 24 * 60 * 60 * 1000;
  const recent = sorted.filter((item) => !item.publishedAt || new Date(item.publishedAt).getTime() >= minDateMs);

  const candidatePool = recent.length ? recent : sorted;
  const diversified = diversifyBySource(candidatePool, limit);
  if (diversified.length) return diversified;
  if (candidatePool.length) return candidatePool.slice(0, limit);

  const fallback = getAutoNewsRaw()
    .map((item) => ({
      title: item.locales.en.title,
      href: item.href,
      source: item.source,
      publishedAt: item.publishedAt,
      topic: item.topic
    }))
    .slice(0, limit);

  return fallback;
});

export function getLiveNewsSources() {
  return FEED_SOURCES;
}
