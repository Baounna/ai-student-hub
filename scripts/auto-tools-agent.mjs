#!/usr/bin/env node
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { loadScriptEnv } from "./lib/load-env.mjs";

loadScriptEnv(process.cwd());
const OUTPUT_FILE = path.join(process.cwd(), "src/content/auto-tools.json");
const TIMEOUT_MS = 12_000;
const execFileAsync = promisify(execFile);
const MAX_ITEMS = Number.parseInt(process.env.AUTO_TOOLS_MAX_ITEMS || "120", 10);
const MAX_AGE_DAYS = Number.parseInt(process.env.AUTO_TOOLS_MAX_AGE_DAYS || "120", 10);
const MAX_PER_SOURCE = Math.max(1, Math.min(Number.parseInt(process.env.AUTO_TOOLS_MAX_PER_SOURCE || "16", 10), 120));

const FEED_SOURCES = [
  {
    name: "OpenAI News",
    href: "https://openai.com/news/",
    kind: "page",
    allowedRoots: ["openai.com"],
    pathAllow: [/^\/index\/[a-z0-9-]/i, /^\/news\/[a-z0-9-]/i],
    maxItems: 16
  },
  {
    name: "Anthropic News",
    href: "https://www.anthropic.com/news",
    kind: "page",
    allowedRoots: ["anthropic.com", "claude.ai"],
    pathAllow: [/^\/news\/[a-z0-9-]/i],
    maxItems: 16
  },
  {
    name: "Gamma Blog",
    href: "https://gamma.app/blog",
    kind: "page",
    allowedRoots: ["gamma.app"],
    pathAllow: [/^\/blog\/[a-z0-9-]/i],
    maxItems: 14
  },
  {
    name: "Perplexity Blog",
    href: "https://www.perplexity.ai/hub/blog",
    kind: "page",
    allowedRoots: ["perplexity.ai"],
    pathAllow: [/^\/hub\/blog\/[a-z0-9-]/i],
    maxItems: 14
  },
  {
    name: "Notion Releases",
    href: "https://www.notion.so/releases",
    kind: "page",
    allowedRoots: ["notion.so"],
    pathAllow: [/^\/releases\/?[a-z0-9-]*/i],
    maxItems: 12
  },
  {
    name: "Cursor Changelog",
    href: "https://www.cursor.com/changelog",
    kind: "page",
    allowedRoots: ["cursor.com"],
    pathAllow: [/^\/changelog\/?[a-z0-9-]*/i],
    maxItems: 12
  },
  {
    name: "Vercel Changelog",
    href: "https://vercel.com/changelog",
    kind: "page",
    allowedRoots: ["vercel.com"],
    pathAllow: [/^\/changelog\/[a-z0-9-]/i],
    maxItems: 12
  },
  {
    name: "Supabase Changelog",
    href: "https://supabase.com/changelog",
    kind: "page",
    allowedRoots: ["supabase.com"],
    pathAllow: [/^\/changelog\/[a-z0-9-]/i],
    maxItems: 12
  },
  { name: "Google AI Blog", href: "https://blog.google/technology/ai/rss/" },
  { name: "Google Workspace Updates", href: "https://workspaceupdates.googleblog.com/feeds/posts/default?alt=rss" },
  { name: "GitHub Changelog", href: "https://github.blog/changelog/feed/" },
  { name: "Cloudflare Blog", href: "https://blog.cloudflare.com/rss/" },
  { name: "Docker Blog", href: "https://www.docker.com/blog/feed/" },
  { name: "Hugging Face Blog", href: "https://huggingface.co/blog/feed.xml" },
  { name: "NVIDIA Developer Blog", href: "https://developer.nvidia.com/blog/feed/" },
  { name: "Kubernetes Blog", href: "https://kubernetes.io/feed.xml" },
  { name: "Node.js Blog", href: "https://nodejs.org/en/feed/blog.xml" },
  { name: "Go Blog", href: "https://go.dev/blog/feed.atom" },
  { name: "Rust Blog", href: "https://blog.rust-lang.org/feed.xml" },
  { name: "PostgreSQL News", href: "https://www.postgresql.org/list/pgsql-announce.rss" },
  { name: "V8 Blog", href: "https://v8.dev/blog.atom" },
  { name: "NIST News", href: "https://www.nist.gov/news-events/news/rss.xml" },
  { name: "W3C Blog", href: "https://www.w3.org/blog/feed/" }
];

const TRUSTED_ROOTS = new Set([
  "openai.com",
  "anthropic.com",
  "claude.ai",
  "gamma.app",
  "perplexity.ai",
  "notion.so",
  "cursor.com",
  "vercel.com",
  "supabase.com",
  "blog.google",
  "googleblog.com",
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

const TOOL_HINTS = [
  { pattern: /\bgamma\b/i, name: "Gamma", category: "AI Presentation Builder" },
  { pattern: /\bnotebooklm\b/i, name: "NotebookLM", category: "AI Study Assistant" },
  { pattern: /\bperplexity\b/i, name: "Perplexity", category: "Research Assistant" },
  { pattern: /\bcursor\b/i, name: "Cursor", category: "Developer Assistant" },
  { pattern: /\bnotion\b/i, name: "Notion", category: "Productivity Workspace" },
  { pattern: /\bvercel\b/i, name: "Vercel", category: "Cloud Platform" },
  { pattern: /\bsupabase\b/i, name: "Supabase", category: "Backend Platform" },
  { pattern: /\bchatgpt\b/i, name: "ChatGPT", category: "AI Assistant" },
  { pattern: /\bclaude\b/i, name: "Claude", category: "AI Assistant" },
  { pattern: /\bgemini\b/i, name: "Gemini", category: "AI Assistant" },
  { pattern: /\bantigravity\b/i, name: "Antigravity", category: "Learning Workflow" },
  { pattern: /\bcopilot\b/i, name: "GitHub Copilot", category: "Developer Assistant" },
  { pattern: /\bdocker\b/i, name: "Docker", category: "Developer Platform" },
  { pattern: /\bgithub\b/i, name: "GitHub", category: "Developer Platform" },
  { pattern: /\bcloudflare\b/i, name: "Cloudflare", category: "Cloud Platform" },
  { pattern: /\bkubernetes\b/i, name: "Kubernetes", category: "Cloud/DevOps" },
  { pattern: /\bpostgres(?:ql)?\b/i, name: "PostgreSQL", category: "Systems & Backend" },
  { pattern: /\bnode\.js\b|\bnodejs\b/i, name: "Node.js", category: "Systems & Backend" }
];

const SOURCE_TOOL_FALLBACK = {
  "OpenAI News": { toolName: "OpenAI Platform", category: "AI Platform" },
  "Anthropic News": { toolName: "Anthropic Platform", category: "AI Platform" },
  "Gamma Blog": { toolName: "Gamma", category: "AI Presentation Builder" },
  "Perplexity Blog": { toolName: "Perplexity", category: "Research Assistant" },
  "Notion Releases": { toolName: "Notion", category: "Productivity Workspace" },
  "Cursor Changelog": { toolName: "Cursor", category: "Developer Assistant" },
  "Vercel Changelog": { toolName: "Vercel", category: "Cloud Platform" },
  "Supabase Changelog": { toolName: "Supabase", category: "Backend Platform" },
  "Google AI Blog": { toolName: "Google AI", category: "AI Platform" },
  "Google Workspace Updates": { toolName: "Google Workspace AI", category: "Productivity AI" },
  "GitHub Changelog": { toolName: "GitHub", category: "Developer Platform" },
  "Cloudflare Blog": { toolName: "Cloudflare", category: "Cloud Platform" },
  "Docker Blog": { toolName: "Docker", category: "Developer Platform" },
  "Hugging Face Blog": { toolName: "Hugging Face", category: "AI Platform" },
  "NVIDIA Developer Blog": { toolName: "NVIDIA", category: "Computer Systems" },
  "Kubernetes Blog": { toolName: "Kubernetes", category: "Cloud/DevOps" },
  "Node.js Blog": { toolName: "Node.js", category: "Systems & Backend" },
  "Go Blog": { toolName: "Go", category: "Systems & Backend" },
  "Rust Blog": { toolName: "Rust", category: "Systems & Backend" },
  "PostgreSQL News": { toolName: "PostgreSQL", category: "Systems & Backend" },
  "V8 Blog": { toolName: "V8", category: "CS Fundamentals" },
  "NIST News": { toolName: "NIST", category: "Security & Standards" },
  "W3C Blog": { toolName: "W3C", category: "Computer Science" }
};

const BOOTSTRAP_TOOLS = [
  {
    toolName: "ChatGPT",
    category: "AI Assistant",
    source: "OpenAI Official",
    sourceFeed: "https://openai.com/",
    href: "https://openai.com/chatgpt/overview/",
    title: "ChatGPT official product page",
    summaryEn: "Baseline official reference while the live feed is refreshing.",
    summaryFr: "Reference officielle de base en attendant le prochain refresh live."
  },
  {
    toolName: "Claude",
    category: "AI Assistant",
    source: "Anthropic Official",
    sourceFeed: "https://www.anthropic.com/",
    href: "https://www.anthropic.com/claude",
    title: "Claude official product page",
    summaryEn: "Baseline official reference while the live feed is refreshing.",
    summaryFr: "Reference officielle de base en attendant le prochain refresh live."
  },
  {
    toolName: "NotebookLM",
    category: "AI Study Assistant",
    source: "Google Official",
    sourceFeed: "https://blog.google/",
    href: "https://blog.google/technology/ai/",
    title: "NotebookLM updates via Google AI Blog",
    summaryEn: "Trusted Google AI Blog endpoint for NotebookLM and related study-tool updates.",
    summaryFr: "Point officiel Google AI Blog pour NotebookLM et les updates des outils d'etude associes."
  },
  {
    toolName: "Perplexity",
    category: "Research Assistant",
    source: "Perplexity Official",
    sourceFeed: "https://www.perplexity.ai/",
    href: "https://www.perplexity.ai/",
    title: "Perplexity official product page",
    summaryEn: "Official research assistant page monitored for future updates.",
    summaryFr: "Page officielle de l'assistant recherche surveillee pour les prochaines mises a jour."
  },
  {
    toolName: "Gamma",
    category: "AI Presentation Builder",
    source: "Gamma Official",
    sourceFeed: "https://gamma.app/",
    href: "https://gamma.app/",
    title: "Gamma official product page",
    summaryEn: "Official presentation tool page monitored for trusted changes.",
    summaryFr: "Page officielle de l'outil de presentation surveillee pour des evolutions fiables."
  },
  {
    toolName: "GitHub Copilot",
    category: "Developer Assistant",
    source: "GitHub Official",
    sourceFeed: "https://github.blog/",
    href: "https://github.blog/changelog/",
    title: "GitHub Copilot updates via GitHub Changelog",
    summaryEn: "Trusted GitHub Changelog endpoint for Copilot and coding workflow updates.",
    summaryFr: "Point officiel GitHub Changelog pour Copilot et les updates de workflow code."
  },
  {
    toolName: "Cursor",
    category: "Developer Assistant",
    source: "Cursor Official",
    sourceFeed: "https://www.cursor.com/",
    href: "https://www.cursor.com/",
    title: "Cursor official product page",
    summaryEn: "Official IDE assistant page included as a trusted baseline.",
    summaryFr: "Page officielle de l'assistant IDE incluse comme base de confiance."
  },
  {
    toolName: "Notion",
    category: "Productivity Workspace",
    source: "Notion Official",
    sourceFeed: "https://www.notion.so/",
    href: "https://www.notion.so/",
    title: "Notion official product page",
    summaryEn: "Official productivity workspace page monitored for new releases.",
    summaryFr: "Page officielle de l'espace de travail productivite surveillee pour les nouveaux releases."
  },
  {
    toolName: "Vercel",
    category: "Cloud Platform",
    source: "Vercel Official",
    sourceFeed: "https://vercel.com/",
    href: "https://vercel.com/",
    title: "Vercel official platform page",
    summaryEn: "Official cloud platform page kept as baseline infrastructure coverage.",
    summaryFr: "Page officielle de la plateforme cloud gardee comme couverture infra de base."
  },
  {
    toolName: "Supabase",
    category: "Backend Platform",
    source: "Supabase Official",
    sourceFeed: "https://supabase.com/",
    href: "https://supabase.com/",
    title: "Supabase official platform page",
    summaryEn: "Official backend platform page monitored for trusted updates.",
    summaryFr: "Page officielle de la plateforme backend surveillee pour des updates fiables."
  },
  {
    toolName: "Cloudflare",
    category: "Cloud Platform",
    source: "Cloudflare Official",
    sourceFeed: "https://www.cloudflare.com/",
    href: "https://www.cloudflare.com/",
    title: "Cloudflare official platform page",
    summaryEn: "Official edge/cloud platform page included as fallback coverage.",
    summaryFr: "Page officielle de la plateforme edge/cloud incluse comme couverture de secours."
  },
  {
    toolName: "Hugging Face",
    category: "AI Platform",
    source: "Hugging Face Official",
    sourceFeed: "https://huggingface.co/",
    href: "https://huggingface.co/",
    title: "Hugging Face official platform page",
    summaryEn: "Official open AI platform page tracked until live updates are ingested.",
    summaryFr: "Page officielle de la plateforme IA ouverte suivie en attendant les updates live."
  }
];

const RELEASE_KEYWORDS =
  /\b(launch|launched|release|released|rollout|rolling out|introducing|introduced|now available|general availability|ga|beta|preview|new feature|new model|changelog|update|updated|security|policy|safety)\b/i;
const MIN_BOOTSTRAP_ITEMS = Math.max(4, Math.min(Number.parseInt(process.env.AUTO_TOOLS_MIN_BOOTSTRAP_ITEMS || "8", 10), 20));

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

function shorten(text, max = 220) {
  const value = (text || "").trim();
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
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

function isTrustedItemFromSource(source, itemHref) {
  const itemHost = getHost(itemHref);
  if (!itemHost) return false;
  const itemRoot = hostRoot(itemHost);
  const allowedRoots = getSourceRoots(source);
  if (!allowedRoots.size) return false;
  if (!allowedRoots.has(itemRoot)) return false;
  return sourceAllowsPath(source, itemHref);
}

function sourceFromItem(item) {
  const sourceFeed = String(item?.sourceFeed || "").toLowerCase();
  const sourceName = String(item?.source || "").toLowerCase();
  return SOURCE_LOOKUP.get(sourceFeed) || SOURCE_LOOKUP.get(sourceName) || null;
}

function detectTool(title, summary, sourceName) {
  const combined = `${title} ${summary}`;
  for (const hint of TOOL_HINTS) {
    if (hint.pattern.test(combined)) {
      return { toolName: hint.name, category: hint.category };
    }
  }
  return SOURCE_TOOL_FALLBACK[sourceName] || { toolName: sourceName, category: "AI + Computer Science Tools" };
}

function isToolUpdate(title, summary, sourceName) {
  const combined = `${title} ${summary}`;
  const hasHint = TOOL_HINTS.some((hint) => hint.pattern.test(combined));
  if (hasHint) return true;
  if (RELEASE_KEYWORDS.test(combined)) return true;
  return Boolean(SOURCE_TOOL_FALLBACK[sourceName]);
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
      if (!isTrustedItemFromSource(source, href)) return null;
      if (!isToolUpdate(title, summary, source.name)) return null;

      const tool = detectTool(title, summary, source.name);

      return {
        ...tool,
        title,
        href,
        summary,
        publishedAt,
        source: source.name,
        sourceFeed: source.href
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
      const rawHref = extractAtomLink(block);
      const href = resolveHref(source.href, rawHref);
      const publishedAt = normalizeDate(extractTag(block, "updated") || extractTag(block, "published"));
      const summary = extractTag(block, "summary") || extractTag(block, "content");

      if (!title || !isHttpUrl(href)) return null;
      if (isBlockedSource(source.name, href)) return null;
      if (!isTrustedItemFromSource(source, href)) return null;
      if (!isToolUpdate(title, summary, source.name)) return null;

      const tool = detectTool(title, summary, source.name);

      return {
        ...tool,
        title,
        href,
        summary,
        publishedAt,
        source: source.name,
        sourceFeed: source.href
      };
    })
    .filter(Boolean);
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
    if (!isTrustedItemFromSource(source, href)) continue;
    if (isBlockedSource(source.name, href)) continue;
    if (seen.has(href)) continue;

    const title = cleanupText(match[2] || "").replace(/\s*\|\s*(anthropic|openai).*$/i, "").trim();
    if (!title || title.length < 12 || ignoreTitle.test(title)) continue;

    const start = Math.max(0, (match.index || 0) - 160);
    const end = Math.min(html.length, (match.index || 0) + match[0].length + 220);
    const context = cleanupText(html.slice(start, end));
    const summary = context.replace(title, "").replace(/\s+/g, " ").trim();

    if (!isToolUpdate(title, summary, source.name)) continue;

    const tool = detectTool(title, summary, source.name);
    const publishedRaw =
      context.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ||
      context.match(
        /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b/i
      )?.[0] ||
      "";

    items.push({
      ...tool,
      title,
      href,
      summary,
      publishedAt: normalizeDate(publishedRaw),
      source: source.name,
      sourceFeed: source.href
    });

    seen.add(href);
    const cap = Number.isFinite(source.maxItems) ? source.maxItems : 20;
    if (items.length >= cap) break;
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
      headers: { "user-agent": "AICybersecurityNewsBot/1.0 (+https://aistudenthub.ai)" }
    });

    if (response.ok) {
      const body = await response.text();
      const parsed = parseSourcePayload(body, source);
      console.log(`- ${source.name}: ${parsed.length} tool updates`);
      return { items: parsed, ok: true };
    }

    const body = await fetchTextWithCurl();
    const parsed = parseSourcePayload(body, source);
    console.log(`- ${source.name}: ${parsed.length} tool updates (curl fallback, HTTP ${response.status})`);
    return { items: parsed, ok: true };
  } catch (fetchError) {
    try {
      const body = await fetchTextWithCurl();
      const parsed = parseSourcePayload(body, source);
      console.log(`- ${source.name}: ${parsed.length} tool updates (curl fallback)`);
      return { items: parsed, ok: true };
    } catch (curlError) {
      const fetchReason = fetchError instanceof Error ? fetchError.message : "fetch failed";
      const curlReason = curlError instanceof Error ? curlError.message : "curl failed";
      console.log(`- ${source.name}: failed (${fetchReason}; ${curlReason})`);
      return { items: [], ok: false };
    }
  }
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
        return isTrustedItemFromSource(matchedSource, href);
      }

      const sourceFeed = String(item?.sourceFeed || "");
      if (!isHttpUrl(sourceFeed)) return false;
      const sourceRoot = hostRoot(getHost(sourceFeed));
      const itemRoot = hostRoot(getHost(href));
      if (!isTrustedRoot(sourceRoot) || !isTrustedRoot(itemRoot)) return false;
      return sourceRoot === itemRoot;
    });

    return { ...parsed, items: sanitizedItems };
  } catch {
    return { version: 1, updatedAt: "", items: [] };
  }
}

function buildNewItem(raw, nowIso) {
  const baseTime = raw.publishedAt || nowIso;
  const day = baseTime.slice(0, 10).replace(/-/g, "");
  const slugBase = slugify(`${raw.toolName} ${raw.title}`) || "tool-update";
  const slug = `${day}-${slugBase}-${hashKey(raw.href)}`;
  const enSummary = shorten(raw.summary || raw.title, 220);
  const frSummary = shorten(raw.summary || raw.title, 220);

  return {
    slug,
    toolName: raw.toolName,
    category: raw.category,
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

function buildBootstrapItem(raw, nowIso, index) {
  const slugBase = slugify(`${raw.toolName} ${raw.title}`) || "official-tool";
  const slug = `bootstrap-${slugBase}-${hashKey(`${raw.href}|${index}`)}`;
  const summaryEn = shorten(raw.summaryEn || raw.title, 220);
  const summaryFr = shorten(raw.summaryFr || raw.summaryEn || raw.title, 220);

  return {
    slug,
    toolName: raw.toolName,
    category: raw.category,
    source: raw.source,
    sourceFeed: raw.sourceFeed,
    href: raw.href,
    publishedAt: nowIso,
    discoveredAt: nowIso,
    locales: {
      en: {
        title: raw.title,
        summary: summaryEn
      },
      fr: {
        title: raw.title,
        summary: summaryFr
      }
    }
  };
}

function buildBootstrapTools(nowIso) {
  return BOOTSTRAP_TOOLS.filter((item) => {
    if (!isHttpUrl(item.href) || !isHttpUrl(item.sourceFeed)) return false;
    if (isBlockedSource(item.source, item.href)) return false;
    const sourceRoot = hostRoot(getHost(item.sourceFeed));
    const itemRoot = hostRoot(getHost(item.href));
    return sourceRoot && itemRoot && isTrustedRoot(sourceRoot) && isTrustedRoot(itemRoot);
  }).map((item, index) => buildBootstrapItem(item, nowIso, index));
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

function rebalanceBySource(items, maxItems, maxPerSource) {
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

  return selected;
}

async function run() {
  console.log("AI and Cybersecurity News Auto Tools Agent");
  console.log("--------------------------------");
  const existing = await loadExisting();
  const nowIso = new Date().toISOString();

  const sourceResults = await Promise.all(FEED_SOURCES.map((source) => fetchSource(source)));
  const healthySources = sourceResults.filter((result) => result.ok).length;
  const failedSources = sourceResults.length - healthySources;
  const freshItems = sourceResults.flatMap((result) => result.items);
  const bootstrapTools = buildBootstrapTools(nowIso);

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
  let merged = rebalanceBySource(mergedPool, MAX_ITEMS, MAX_PER_SOURCE);

  if (!merged.length && currentItems.length) {
    const existingPool = trimByAge(currentItems).sort(sortByDateDesc);
    merged = rebalanceBySource(existingPool, MAX_ITEMS, MAX_PER_SOURCE);
  }

  if (!merged.length && bootstrapTools.length) {
    merged = bootstrapTools.slice(0, Math.min(MAX_ITEMS, bootstrapTools.length));
    console.log(`Applied official bootstrap tools fallback: ${merged.length} item(s).`);
  }

  if (healthySources === 0) {
    if (currentItems.length >= MIN_BOOTSTRAP_ITEMS) {
      console.log("--------------------------------");
      console.log("No sources responded successfully. Keeping current auto-tools file unchanged.");
      console.log(`Existing items kept: ${currentItems.length}`);
      return;
    }
    console.log("--------------------------------");
    console.log("No sources responded successfully. Writing official bootstrap tools fallback.");
    if (bootstrapTools.length > merged.length) {
      merged = bootstrapTools.slice(0, Math.min(MAX_ITEMS, bootstrapTools.length));
      console.log(`Forced bootstrap replacement: ${merged.length} item(s).`);
    }
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
  console.log(`Fetched tool updates: ${freshItems.length}`);
  console.log(`Added items: ${added}`);
  console.log(`Saved items: ${merged.length}`);
  console.log(`Per-source cap: ${MAX_PER_SOURCE}`);
  console.log(`Healthy sources: ${healthySources}/${sourceResults.length}`);
  console.log(`Failed sources: ${failedSources}`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
