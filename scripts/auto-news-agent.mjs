#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_FILE = path.join(process.cwd(), "src/content/auto-news.json");
const TIMEOUT_MS = 12_000;
const MAX_ITEMS = Number.parseInt(process.env.AUTO_NEWS_MAX_ITEMS || "240", 10);
const MAX_AGE_DAYS = Number.parseInt(process.env.AUTO_NEWS_MAX_AGE_DAYS || "45", 10);

const FEED_SOURCES = [
  { name: "OpenAI News", href: "https://openai.com/news/rss.xml", topicHint: "AI Systems" },
  { name: "Google AI Blog", href: "https://blog.google/technology/ai/rss/", topicHint: "AI Systems" },
  { name: "Anthropic News", href: "https://www.anthropic.com/news/rss.xml", topicHint: "AI Systems" },
  { name: "DeepMind Blog", href: "https://deepmind.google/discover/blog/rss.xml", topicHint: "AI Research" },
  { name: "Hugging Face Blog", href: "https://huggingface.co/blog/feed.xml", topicHint: "AI Research" },
  { name: "NVIDIA Developer Blog", href: "https://developer.nvidia.com/blog/feed/", topicHint: "Computer Systems" },
  { name: "Cloudflare Blog", href: "https://blog.cloudflare.com/rss/", topicHint: "Computer Systems" },
  { name: "GitHub Blog", href: "https://github.blog/feed/", topicHint: "Computer Science" },
  { name: "arXiv cs.AI", href: "https://arxiv.org/rss/cs.AI", topicHint: "AI Research" },
  { name: "arXiv cs.LG", href: "https://arxiv.org/rss/cs.LG", topicHint: "AI Research" },
  { name: "arXiv cs.CL", href: "https://arxiv.org/rss/cs.CL", topicHint: "AI Research" }
];

const ENTITY_MAP = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#39;": "'",
  "&nbsp;": " "
};

function decodeEntities(value) {
  return value.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (match) => ENTITY_MAP[match] || match);
}

function stripTags(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanupText(value) {
  return stripTags(decodeEntities(value || ""));
}

function extractTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"));
  if (!match) return "";
  return cleanupText(match[1] || "");
}

function extractCdataTag(block, tagName) {
  const cdataMatch = block.match(new RegExp(`<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>`, "i"));
  if (cdataMatch) return cleanupText(cdataMatch[1] || "");
  return extractTag(block, tagName);
}

function extractAtomLink(block) {
  const alternateMatch =
    block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"[^>]*>/i) ||
    block.match(/<link[^>]*href="([^"]+)"[^>]*rel="alternate"[^>]*>/i);
  if (alternateMatch?.[1]) return alternateMatch[1].trim();

  const hrefMatch = block.match(/<link[^>]*href="([^"]+)"[^>]*>/i);
  return hrefMatch?.[1]?.trim() || "";
}

function normalizeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function shorten(text, max = 240) {
  const value = (text || "").trim();
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function classifyTopic(title, fallback) {
  const text = (title || "").toLowerCase();
  if (/(benchmark|performance|gpqa|aime|swe-bench|mmmu|score)/.test(text)) return "AI Performance";
  if (/(agent|llm|rag|multimodal|inference|prompt|genai|model)/.test(text)) return "AI Systems";
  if (/(chip|gpu|kernel|hardware|accelerator|latency|edge)/.test(text)) return "Computer Systems";
  if (/(compiler|database|network|security|distributed|runtime|protocol)/.test(text)) return "Computer Science";
  return fallback || "AI/CS Updates";
}

function hashKey(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 8);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

function isHttpUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseRssItems(xml, source) {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi))
    .map((match) => match[1])
    .filter(Boolean);

  return items
    .map((block) => {
      const title = extractCdataTag(block, "title");
      const href = extractCdataTag(block, "link");
      const publishedAt = normalizeDate(extractTag(block, "pubDate") || extractTag(block, "dc:date"));
      const summary =
        extractCdataTag(block, "description") ||
        extractCdataTag(block, "content:encoded") ||
        extractCdataTag(block, "summary");
      if (!title || !isHttpUrl(href)) return null;

      return {
        title,
        href,
        summary,
        publishedAt,
        source: source.name,
        sourceFeed: source.href,
        topic: classifyTopic(title, source.topicHint)
      };
    })
    .filter(Boolean);
}

function parseAtomItems(xml, source) {
  const entries = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi))
    .map((match) => match[1])
    .filter(Boolean);

  return entries
    .map((block) => {
      const title = extractTag(block, "title");
      const href = extractAtomLink(block);
      const publishedAt = normalizeDate(extractTag(block, "updated") || extractTag(block, "published"));
      const summary = extractTag(block, "summary") || extractTag(block, "content");
      if (!title || !isHttpUrl(href)) return null;

      return {
        title,
        href,
        summary,
        publishedAt,
        source: source.name,
        sourceFeed: source.href,
        topic: classifyTopic(title, source.topicHint)
      };
    })
    .filter(Boolean);
}

async function fetchFeed(source) {
  try {
    const response = await fetch(source.href, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": "AIStudentHubBot/1.0 (+https://aistudenthub.ai)"
      }
    });
    if (!response.ok) {
      console.log(`- ${source.name}: skipped (HTTP ${response.status})`);
      return [];
    }
    const xml = await response.text();
    const rss = parseRssItems(xml, source);
    const parsed = rss.length ? rss : parseAtomItems(xml, source);
    console.log(`- ${source.name}: ${parsed.length} items`);
    return parsed;
  } catch (error) {
    console.log(`- ${source.name}: failed (${error instanceof Error ? error.message : "unknown error"})`);
    return [];
  }
}

async function loadExisting() {
  try {
    const content = await fs.readFile(OUTPUT_FILE, "utf8");
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.items)) {
      return { version: 1, updatedAt: "", items: [] };
    }
    return parsed;
  } catch {
    return { version: 1, updatedAt: "", items: [] };
  }
}

function buildNewItem(raw, nowIso) {
  const baseTime = raw.publishedAt || nowIso;
  const day = baseTime.slice(0, 10).replace(/-/g, "");
  const slugBase = slugify(raw.title) || "update";
  const slug = `${day}-${slugBase}-${hashKey(raw.href)}`;

  const enSummary = shorten(raw.summary || raw.title, 230);
  const frSummary = shorten(raw.summary || raw.title, 230);

  return {
    slug,
    topic: raw.topic,
    source: raw.source,
    sourceFeed: raw.sourceFeed,
    href: raw.href,
    publishedAt: raw.publishedAt || nowIso,
    discoveredAt: nowIso,
    locales: {
      en: {
        title: raw.title,
        summary: enSummary
      },
      fr: {
        title: raw.title,
        summary: frSummary
      }
    }
  };
}

function sortByDateDesc(a, b) {
  if (a.publishedAt < b.publishedAt) return 1;
  if (a.publishedAt > b.publishedAt) return -1;
  if (a.discoveredAt < b.discoveredAt) return 1;
  if (a.discoveredAt > b.discoveredAt) return -1;
  return 0;
}

function trimByAge(items) {
  const minMs = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    const ms = new Date(item.publishedAt).getTime();
    if (Number.isNaN(ms)) return true;
    return ms >= minMs;
  });
}

async function run() {
  console.log("AI Student Hub Auto News Agent");
  console.log("--------------------------------");
  const existing = await loadExisting();
  const nowIso = new Date().toISOString();

  const feedResults = await Promise.all(FEED_SOURCES.map((source) => fetchFeed(source)));
  const freshItems = feedResults.flat();

  const currentItems = Array.isArray(existing.items) ? existing.items : [];
  const dedupe = new Map();

  for (const item of currentItems) {
    const key = `${(item.href || "").toLowerCase()}|${(item.locales?.en?.title || "").toLowerCase()}`;
    if (!dedupe.has(key)) dedupe.set(key, item);
  }

  let added = 0;
  for (const raw of freshItems) {
    const key = `${raw.href.toLowerCase()}|${raw.title.toLowerCase()}`;
    if (!dedupe.has(key)) {
      dedupe.set(key, buildNewItem(raw, nowIso));
      added += 1;
    }
  }

  const merged = trimByAge(Array.from(dedupe.values()))
    .sort(sortByDateDesc)
    .slice(0, MAX_ITEMS);

  const output = {
    version: 1,
    updatedAt: nowIso,
    items: merged
  };

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log("--------------------------------");
  console.log(`Existing items: ${currentItems.length}`);
  console.log(`Fetched items: ${freshItems.length}`);
  console.log(`Added items: ${added}`);
  console.log(`Saved items: ${merged.length}`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
