#!/usr/bin/env node
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { loadScriptEnv } from "./lib/load-env.mjs";

loadScriptEnv(process.cwd());
const OUTPUT_FILE = path.join(process.cwd(), "src/content/auto-news.json");
const TIMEOUT_MS = 12_000;
const execFileAsync = promisify(execFile);
const MAX_ITEMS = Number.parseInt(process.env.AUTO_NEWS_MAX_ITEMS || "240", 10);
const MAX_AGE_DAYS = Number.parseInt(process.env.AUTO_NEWS_MAX_AGE_DAYS || "45", 10);
const MAX_PER_SOURCE = Math.max(1, Math.min(Number.parseInt(process.env.AUTO_NEWS_MAX_PER_SOURCE || "24", 10), 240));
const STRICT_SOURCE_CAP = !["0", "false", "no"].includes(
  String(process.env.AUTO_NEWS_STRICT_SOURCE_CAP || "1").trim().toLowerCase()
);

const FEED_SOURCES = [
  {
    name: "Anthropic News",
    href: "https://www.anthropic.com/news",
    kind: "page",
    topicHint: "AI Systems",
    allowedRoots: ["anthropic.com", "claude.ai"],
    pathAllow: [/^\/news\/[a-z0-9-]/i],
    maxItems: 16
  },
  {
    name: "Anthropic Engineering",
    href: "https://www.anthropic.com/engineering",
    kind: "page",
    topicHint: "Computer Systems",
    allowedRoots: ["anthropic.com"],
    pathAllow: [/^\/engineering\/[a-z0-9-]/i],
    maxItems: 12
  },
  {
    name: "OpenAI News",
    // The /news/ HTML page is bot-protected (403), so use the official RSS feed.
    href: "https://openai.com/news/rss.xml",
    topicHint: "AI Systems",
    allowedRoots: ["openai.com"],
    pathAllow: [/^\/index\/[a-z0-9-]/i, /^\/news\/[a-z0-9-]/i],
    maxItems: 16
  },
  { name: "Google AI Blog", href: "https://blog.google/technology/ai/rss/", topicHint: "AI Systems" },
  { name: "DeepMind Blog", href: "https://deepmind.google/blog/rss.xml", topicHint: "AI Research" },
  { name: "Hugging Face Blog", href: "https://huggingface.co/blog/feed.xml", topicHint: "AI Systems" },
  { name: "AWS ML Blog", href: "https://aws.amazon.com/blogs/machine-learning/feed/", topicHint: "AI Systems" },
  {
    name: "Azure AI Blog",
    href: "https://azure.microsoft.com/en-us/blog/feed/",
    topicHint: "AI Systems"
  },
  { name: "NVIDIA Developer Blog", href: "https://developer.nvidia.com/blog/feed/", topicHint: "Computer Systems" },
  { name: "Cloudflare Blog", href: "https://blog.cloudflare.com/rss/", topicHint: "Computer Systems" },
  { name: "GitHub Blog", href: "https://github.blog/feed/", topicHint: "Computer Science" },
  { name: "Docker Blog", href: "https://www.docker.com/blog/feed/", topicHint: "Computer Science" },
  { name: "Kubernetes Blog", href: "https://kubernetes.io/feed.xml", topicHint: "Cloud/DevOps" },
  { name: "Node.js Blog", href: "https://nodejs.org/en/feed/blog.xml", topicHint: "Systems & Backend" },
  { name: "Go Blog", href: "https://go.dev/blog/feed.atom", topicHint: "Systems & Backend" },
  { name: "Rust Blog", href: "https://blog.rust-lang.org/feed.xml", topicHint: "Systems & Backend" },
  {
    name: "Python Insider",
    href: "https://pythoninsider.blogspot.com/feeds/posts/default?alt=rss",
    topicHint: "CS Fundamentals"
  },
  { name: "PostgreSQL News", href: "https://www.postgresql.org/news.rss", topicHint: "Systems & Backend" },
  { name: "V8 Blog", href: "https://v8.dev/blog.atom", topicHint: "CS Fundamentals" },
  { name: "NIST News", href: "https://www.nist.gov/news-events/news/rss.xml", topicHint: "Security & Standards" },
  { name: "W3C Blog", href: "https://www.w3.org/blog/feed/", topicHint: "Computer Science" }
];

const TRUSTED_ROOTS = new Set([
  "openai.com",
  "anthropic.com",
  "claude.ai",
  "blog.google",
  "deepmind.google",
  "github.blog",
  "nvidia.com",
  "amazon.com",
  "microsoft.com",
  "huggingface.co",
  "cloudflare.com",
  "kubernetes.io",
  "nodejs.org",
  "go.dev",
  "rust-lang.org",
  "postgresql.org",
  "v8.dev",
  "nist.gov",
  "w3.org",
  "blogspot.com",
  "docker.com"
]);

const BLOCKED_URL_PATTERNS = [
  /arxiv\.org/i,
  /news\.ycombinator\.com/i,
  /reddit\.com/i,
  /x\.com/i,
  /twitter\.com/i,
  /facebook\.com/i,
  /linkedin\.com/i,
  /t\.co\//i
];

const SOURCE_LOOKUP = new Map();
for (const source of FEED_SOURCES) {
  SOURCE_LOOKUP.set(String(source.name || "").toLowerCase(), source);
  SOURCE_LOOKUP.set(String(source.href || "").toLowerCase(), source);
}

const BOOTSTRAP_NEWS = [
  {
    title: "OpenAI official news hub",
    source: "OpenAI News",
    sourceFeed: "https://openai.com/news/",
    href: "https://openai.com/news/",
    topic: "AI Systems",
    summaryEn: "Official OpenAI newsroom endpoint monitored while live source sync is unavailable.",
    summaryFr: "Point officiel OpenAI News surveille quand la sync live des sources est indisponible."
  },
  {
    title: "Anthropic official news hub",
    source: "Anthropic News",
    sourceFeed: "https://www.anthropic.com/news",
    href: "https://www.anthropic.com/news",
    topic: "AI Systems",
    summaryEn: "Official Anthropic newsroom endpoint retained as a trusted baseline.",
    summaryFr: "Point officiel Anthropic News conserve comme base de confiance."
  },
  {
    title: "Google AI Blog official feed",
    source: "Google AI Blog",
    sourceFeed: "https://blog.google/technology/ai/rss/",
    href: "https://blog.google/technology/ai/",
    topic: "AI Systems",
    summaryEn: "Official Google AI publication channel used for source-safe baseline coverage.",
    summaryFr: "Canal officiel Google AI utilise comme couverture de base fiable."
  },
  {
    title: "GitHub Blog official feed",
    source: "GitHub Blog",
    sourceFeed: "https://github.blog/feed/",
    href: "https://github.blog/",
    topic: "Computer Science",
    summaryEn: "Official GitHub engineering and product updates channel kept in baseline set.",
    summaryFr: "Canal officiel GitHub des updates engineering et produit garde dans la base."
  },
  {
    title: "Cloudflare official blog feed",
    source: "Cloudflare Blog",
    sourceFeed: "https://blog.cloudflare.com/rss/",
    href: "https://blog.cloudflare.com/",
    topic: "Computer Systems",
    summaryEn: "Official Cloudflare blog used for networking/security/platform baseline updates.",
    summaryFr: "Blog officiel Cloudflare utilise pour la base des updates reseau/securite/plateforme."
  },
  {
    title: "NVIDIA Developer Blog official feed",
    source: "NVIDIA Developer Blog",
    sourceFeed: "https://developer.nvidia.com/blog/feed/",
    href: "https://developer.nvidia.com/blog/",
    topic: "Computer Systems",
    summaryEn: "Official NVIDIA developer updates endpoint used as trusted system-level baseline.",
    summaryFr: "Point officiel NVIDIA Developer utilise comme base de confiance cote systemes."
  },
  {
    title: "NIST official news feed",
    source: "NIST News",
    sourceFeed: "https://www.nist.gov/news-events/news/rss.xml",
    href: "https://www.nist.gov/news-events/news",
    topic: "Security & Standards",
    summaryEn: "Official standards and security publication stream retained for governance context.",
    summaryFr: "Flux officiel standards/securite conserve pour le contexte gouvernance."
  },
  {
    title: "W3C official blog feed",
    source: "W3C Blog",
    sourceFeed: "https://www.w3.org/blog/feed/",
    href: "https://www.w3.org/blog/",
    topic: "Computer Science",
    summaryEn: "Official web standards publication stream used for CS baseline continuity.",
    summaryFr: "Flux officiel W3C utilise pour la continuite de base cote informatique."
  }
];

const MIN_BOOTSTRAP_NEWS_ITEMS = Math.max(
  4,
  Math.min(Number.parseInt(process.env.AUTO_NEWS_MIN_BOOTSTRAP_ITEMS || "6", 10), 20)
);

const ENTITY_MAP = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#39;": "'",
  "&nbsp;": " "
};

function decodeCodePoint(value) {
  if (!Number.isFinite(value) || value <= 0 || value > 0x10ffff) return "";
  try {
    return String.fromCodePoint(value);
  } catch {
    return "";
  }
}

function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => decodeCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => decodeCodePoint(Number.parseInt(dec, 10)))
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (match) => ENTITY_MAP[match] || match);
}

function stripTags(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanupText(value) {
  return stripTags(decodeEntities(value || ""));
}

function extractTag(block, tagName) {
  const match = block.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, "i"));
  if (!match) return "";
  return cleanupText(match[1] || "");
}

function extractCdataTag(block, tagName) {
  const cdataMatch = block.match(
    new RegExp(`<${tagName}(?:\\s[^>]*)?><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>`, "i")
  );
  if (cdataMatch) return cleanupText(cdataMatch[1] || "");
  return extractTag(block, tagName);
}

function extractMetaContent(html, matcher) {
  const metaRegex = /<meta\s+[^>]*>/gi;
  for (const match of html.matchAll(metaRegex)) {
    const raw = match[0] || "";
    const name = (raw.match(/name=["']([^"']+)["']/i)?.[1] || raw.match(/property=["']([^"']+)["']/i)?.[1] || "").toLowerCase();
    if (!name || !matcher(name)) continue;
    const content = raw.match(/content=["']([\s\S]*?)["']/i)?.[1] || "";
    if (content) return cleanupText(content);
  }
  return "";
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
  if (/(security|vulnerability|cve|trust\s*&?\s*safety|safety|privacy|abuse|jailbreak|prompt injection|incident)/.test(text)) {
    return "Security & Standards";
  }
  if (/(benchmark|performance|gpqa|aime|swe-bench|mmmu|score)/.test(text)) return "AI Performance";
  if (/(agent|llm|rag|multimodal|inference|prompt|genai|model)/.test(text)) return "AI Systems";
  if (/(chip|gpu|kernel|hardware|accelerator|latency|edge)/.test(text)) return "Computer Systems";
  if (/(compiler|database|network|distributed|runtime|protocol|api|backend|devops|kubernetes|linux|postgres|redis|performance)/.test(text)) {
    return "Computer Science";
  }
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

function getHost(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function hostRoot(hostname) {
  const host = String(hostname || "").toLowerCase().trim();
  if (!host) return "";
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return host;
  return parts.slice(-2).join(".");
}

function resolveHref(base, href) {
  if (!href) return "";
  try {
    return new URL(href, base).toString();
  } catch {
    return "";
  }
}

function isBlockedSource(sourceName, href) {
  const source = String(sourceName || "").toLowerCase();
  const url = String(href || "").toLowerCase();
  if (source.includes("arxiv") || url.includes("arxiv.org")) return true;
  return BLOCKED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

function isTrustedRoot(root) {
  return TRUSTED_ROOTS.has(String(root || "").toLowerCase());
}

function getSourceRoots(source) {
  const configured = Array.isArray(source?.allowedRoots) ? source.allowedRoots : [];
  const sourceRoot = hostRoot(getHost(source?.href || ""));
  const roots = new Set(
    configured
      .map((item) => hostRoot(item))
      .filter((item) => Boolean(item) && isTrustedRoot(item))
  );
  if (sourceRoot && isTrustedRoot(sourceRoot)) roots.add(sourceRoot);
  return roots;
}

function sourceAllowsPath(source, href) {
  if (!Array.isArray(source?.pathAllow) || !source.pathAllow.length) return true;
  try {
    const pathname = new URL(href).pathname;
    return source.pathAllow.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
}

function isFirstPartySourceLink(source, itemHref) {
  const itemHost = getHost(itemHref);
  if (!itemHost) return false;
  const itemRoot = hostRoot(itemHost);
  const allowedRoots = getSourceRoots(source);
  if (!allowedRoots.size) return false;
  if (!allowedRoots.has(itemRoot)) return false;
  return sourceAllowsPath(source, itemHref);
}

function isSameHostRoot(sourceHref, itemHref) {
  const sourceHost = getHost(sourceHref);
  const itemHost = getHost(itemHref);
  if (!sourceHost || !itemHost) return false;
  return hostRoot(sourceHost) === hostRoot(itemHost);
}

function parseRssItems(xml, source) {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi))
    .map((match) => match[1])
    .filter(Boolean);

  return items
    .map((block) => {
      const title = extractCdataTag(block, "title");
      const rawHref = extractCdataTag(block, "link");
      const href = resolveHref(source.href, rawHref);
      const publishedAt = normalizeDate(extractTag(block, "pubDate") || extractTag(block, "dc:date"));
      const summary =
        extractCdataTag(block, "description") ||
        extractCdataTag(block, "content:encoded") ||
        extractCdataTag(block, "summary");
      if (!title || !isHttpUrl(href)) return null;
      if (isBlockedSource(source.name, href)) return null;
      if (!isFirstPartySourceLink(source, href)) return null;

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
      const title = extractCdataTag(block, "title");
      const rawHref = extractAtomLink(block);
      const href = resolveHref(source.href, rawHref);
      const publishedAt = normalizeDate(extractTag(block, "updated") || extractTag(block, "published"));
      const summary = extractCdataTag(block, "summary") || extractCdataTag(block, "content");
      if (!title || !isHttpUrl(href)) return null;
      if (isBlockedSource(source.name, href)) return null;
      if (!isFirstPartySourceLink(source, href)) return null;

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

function extractContextDate(context) {
  if (!context) return "";
  const isoMatch = context.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch?.[0]) {
    const iso = normalizeDate(isoMatch[0]);
    if (iso) return iso;
  }

  const monthMatch = context.match(
    /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b/i
  );
  if (monthMatch?.[0]) {
    const parsed = normalizeDate(monthMatch[0]);
    if (parsed) return parsed;
  }

  return "";
}

function cleanPageTitle(value) {
  return cleanupText(value)
    .replace(/\s*\|\s*anthropic.*$/i, "")
    .replace(/\s*\|\s*openai.*$/i, "")
    .trim();
}

function parsePageItems(html, source) {
  const anchors = Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi));
  const ignoreTitle = /^(learn more|read more|read|more|news|all news|menu|home|about|contact|privacy|terms|log in|sign in|get started)$/i;
  const seen = new Set();
  const items = [];

  for (const match of anchors) {
    const rawHref = cleanupText(match[1] || "");
    const href = resolveHref(source.href, rawHref);
    if (!isHttpUrl(href)) continue;
    if (!isFirstPartySourceLink(source, href)) continue;
    if (isBlockedSource(source.name, href)) continue;

    if (seen.has(href)) continue;

    const title = cleanPageTitle(match[2] || "");
    if (!title || title.length < 12 || ignoreTitle.test(title)) continue;

    const start = Math.max(0, (match.index || 0) - 180);
    const end = Math.min(html.length, (match.index || 0) + match[0].length + 260);
    const context = cleanupText(html.slice(start, end));

    const summary = context
      .replace(title, "")
      .replace(/\s+/g, " ")
      .trim();

    items.push({
      title,
      href,
      summary,
      publishedAt: extractContextDate(context),
      source: source.name,
      sourceFeed: source.href,
      topic: classifyTopic(`${title} ${summary}`, source.topicHint)
    });

    seen.add(href);
    const cap = Number.isFinite(source.maxItems) ? source.maxItems : 24;
    if (items.length >= cap) break;
  }

  if (!items.length) {
    const title =
      extractMetaContent(html, (name) => name === "og:title" || name === "twitter:title") ||
      cleanPageTitle(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "");
    const summary = extractMetaContent(html, (name) => name === "description" || name === "og:description");

    if (title) {
      items.push({
        title,
        href: source.href,
        summary,
        publishedAt: extractContextDate(html),
        source: source.name,
        sourceFeed: source.href,
        topic: classifyTopic(`${title} ${summary}`, source.topicHint)
      });
    }
  }

  return items;
}

function parseSourcePayload(payload, source) {
  if (source.kind === "page") {
    return parsePageItems(payload, source);
  }

  const rss = parseRssItems(payload, source);
  if (rss.length) return rss;

  const atom = parseAtomItems(payload, source);
  if (atom.length) return atom;

  return [];
}

async function fetchSource(source) {
  async function fetchTextWithCurl() {
    const { stdout } = await execFileAsync(
      "curl",
      ["-fL", "--silent", "--show-error", "--max-time", String(Math.ceil(TIMEOUT_MS / 1000)), source.href],
      { maxBuffer: 8 * 1024 * 1024 }
    );
    return String(stdout || "");
  }

  try {
    const response = await fetch(source.href, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": "AICybersecurityNewsBot/1.0 (+https://ai-student-hub-navy.vercel.app)"
      }
    });

    if (response.ok) {
      const body = await response.text();
      const parsed = parseSourcePayload(body, source);
      console.log(`- ${source.name}: ${parsed.length} items`);
      return { items: parsed, ok: true };
    }

    const body = await fetchTextWithCurl();
    const parsed = parseSourcePayload(body, source);
    console.log(`- ${source.name}: ${parsed.length} items (curl fallback, HTTP ${response.status})`);
    return { items: parsed, ok: true };
  } catch (fetchError) {
    try {
      const body = await fetchTextWithCurl();
      const parsed = parseSourcePayload(body, source);
      console.log(`- ${source.name}: ${parsed.length} items (curl fallback)`);
      return { items: parsed, ok: true };
    } catch (curlError) {
      const fetchReason = fetchError instanceof Error ? fetchError.message : "fetch failed";
      const curlReason = curlError instanceof Error ? curlError.message : "curl failed";
      console.log(`- ${source.name}: failed (${fetchReason}; ${curlReason})`);
      return { items: [], ok: false };
    }
  }
}

function sourceFromItem(item) {
  const sourceFeed = String(item?.sourceFeed || "").toLowerCase();
  const sourceName = String(item?.source || "").toLowerCase();
  return SOURCE_LOOKUP.get(sourceFeed) || SOURCE_LOOKUP.get(sourceName) || null;
}

async function loadExisting() {
  try {
    const content = await fs.readFile(OUTPUT_FILE, "utf8");
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.items)) {
      return { version: 1, updatedAt: "", items: [] };
    }

    const sanitizedItems = parsed.items.filter((item) => {
      const href = String(item?.href || "");
      const source = String(item?.source || "");
      if (!isHttpUrl(href)) return false;
      if (isBlockedSource(source, href)) return false;

      const matchedSource = sourceFromItem(item);
      if (matchedSource) {
        return isFirstPartySourceLink(matchedSource, href);
      }

      const sourceFeed = String(item?.sourceFeed || "");
      if (isHttpUrl(sourceFeed) && !isSameHostRoot(sourceFeed, href)) return false;
      return true;
    });

    return { ...parsed, items: sanitizedItems };
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
    // Fall back to discoveredAt for undated (e.g. page-scraped) items so they can
    // still age out instead of accumulating forever.
    const ms = new Date(item.publishedAt || item.discoveredAt).getTime();
    if (Number.isNaN(ms)) return true;
    return ms >= minMs;
  });
}

function sourceKey(item) {
  return String(item.sourceFeed || item.source || "unknown").trim().toLowerCase() || "unknown";
}

function rebalanceBySource(items, maxItems, maxPerSource, options = {}) {
  const strict = options.strict !== false;
  const buckets = new Map();
  for (const item of items) {
    const key = sourceKey(item);
    const queue = buckets.get(key) || [];
    queue.push(item);
    buckets.set(key, queue);
  }

  const orderedKeys = Array.from(buckets.keys());
  const counts = new Map();
  const selected = [];

  let moved = true;
  while (selected.length < maxItems && moved) {
    moved = false;
    for (const key of orderedKeys) {
      if (selected.length >= maxItems) break;
      const queue = buckets.get(key) || [];
      if (!queue.length) continue;
      const count = counts.get(key) || 0;
      if (count >= maxPerSource) continue;
      selected.push(queue.shift());
      counts.set(key, count + 1);
      moved = true;
    }
  }

  if (!strict && selected.length < maxItems) {
    const leftovers = [];
    for (const queue of buckets.values()) leftovers.push(...queue);
    leftovers.sort(sortByDateDesc);
    for (const item of leftovers) {
      if (selected.length >= maxItems) break;
      selected.push(item);
    }
  }

  return selected;
}

function sourceDistribution(items, limit = 8) {
  const counts = new Map();
  for (const item of items) {
    const key = item.source || "Unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function buildBootstrapNews(nowIso) {
  return BOOTSTRAP_NEWS.filter((item) => isHttpUrl(item.href) && isHttpUrl(item.sourceFeed))
    .map((item) => {
      const day = nowIso.slice(0, 10).replace(/-/g, "");
      const slugBase = slugify(item.title) || "official-update";
      const slug = `${day}-${slugBase}-${hashKey(item.href)}`;

      return {
        slug,
        topic: item.topic,
        source: item.source,
        sourceFeed: item.sourceFeed,
        href: item.href,
        publishedAt: nowIso,
        discoveredAt: nowIso,
        locales: {
          en: {
            title: item.title,
            summary: shorten(item.summaryEn, 220)
          },
          fr: {
            title: item.title,
            summary: shorten(item.summaryFr, 220)
          }
        }
      };
    })
    .sort(sortByDateDesc);
}

async function run() {
  console.log("AI and Cybersecurity News Auto News Agent");
  console.log("--------------------------------");
  const existing = await loadExisting();
  const nowIso = new Date().toISOString();

  const sourceResults = await Promise.all(FEED_SOURCES.map((source) => fetchSource(source)));
  const healthySources = sourceResults.filter((result) => result.ok).length;
  const failedSources = sourceResults.length - healthySources;
  const freshItems = sourceResults.flatMap((result) => result.items);

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

  const mergedPool = trimByAge(Array.from(dedupe.values())).sort(sortByDateDesc);
  const merged = rebalanceBySource(mergedPool, MAX_ITEMS, MAX_PER_SOURCE, { strict: STRICT_SOURCE_CAP });

  if (healthySources === 0) {
    console.log("--------------------------------");
    if (currentItems.length >= MIN_BOOTSTRAP_NEWS_ITEMS) {
      console.log("No sources responded successfully. Keeping current auto-news file unchanged.");
      console.log(`Existing items kept: ${currentItems.length}`);
      return;
    }

    const bootstrapNews = buildBootstrapNews(nowIso);
    const fallbackDedupe = new Map();
    for (const item of currentItems) {
      const key = `${(item.href || "").toLowerCase()}|${(item.locales?.en?.title || "").toLowerCase()}`;
      if (!fallbackDedupe.has(key)) fallbackDedupe.set(key, item);
    }
    for (const item of bootstrapNews) {
      const key = `${item.href.toLowerCase()}|${item.locales.en.title.toLowerCase()}`;
      if (!fallbackDedupe.has(key)) fallbackDedupe.set(key, item);
    }

    const fallbackPool = trimByAge(Array.from(fallbackDedupe.values())).sort(sortByDateDesc);
    const fallbackMerged = rebalanceBySource(fallbackPool, Math.max(MAX_ITEMS, bootstrapNews.length), MAX_PER_SOURCE, {
      strict: STRICT_SOURCE_CAP
    });

    const output = {
      version: 1,
      updatedAt: nowIso,
      items: fallbackMerged
    };

    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
    await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    console.log("No sources responded successfully. Wrote official bootstrap news fallback.");
    console.log(`Saved items: ${fallbackMerged.length}`);
    return;
  }

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
  console.log(`Healthy sources: ${healthySources}/${sourceResults.length}`);
  console.log(`Failed sources: ${failedSources}`);
  console.log(`Per-source cap: ${MAX_PER_SOURCE}`);
  console.log(`Strict source cap: ${STRICT_SOURCE_CAP ? "enabled" : "disabled"}`);
  const dist = sourceDistribution(merged, 6);
  if (dist.length) {
    console.log("Top sources:");
    for (const [name, count] of dist) {
      console.log(`  - ${name}: ${count}`);
    }
  }
  console.log(`Output: ${OUTPUT_FILE}`);
}

// Only auto-run when invoked as a CLI, so tests can import the parsers.
const isDirectRun =
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { parseRssItems, parseAtomItems, parseSourcePayload, isBlockedSource, FEED_SOURCES };
