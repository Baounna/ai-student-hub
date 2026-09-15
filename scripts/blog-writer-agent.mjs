// Blog Writer Agent (LLM-powered)
//
// Turns the operator's ranked opportunities into full, review-ready bilingual
// (EN/FR) article drafts using the Claude API. This closes the loop the
// template-based operator agent leaves open: instead of an outline with
// placeholders, it writes real prose a human can edit and publish.
//
// Safety:
// - Never auto-publishes. Output goes to docs/agent/drafts/llm/ marked
//   "review-required". Adding a post to the live site is still a manual edit
//   to src/content/posts.ts.
// - Gracefully skips (exit 0) when ANTHROPIC_API_KEY is absent, mirroring the
//   convertkit "configured?" pattern, so the pipeline never fails just because
//   the key is not set.
// - Citations are seeded from the opportunity's real source URL; the model is
//   instructed not to invent links. Drafts are review-gated precisely because
//   an LLM can still get facts wrong.
//
// Env knobs:
//   ANTHROPIC_API_KEY              required to do anything (else skip)
//   ANTHROPIC_MODEL               default "claude-opus-5"
//   AGENT_WRITER_DRAFTS_PER_RUN   default 2 (range 0-10)
//   AGENT_WRITER_MAX_TOKENS       default 16000

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { loadScriptEnv } from "./lib/load-env.mjs";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const DRAFTS_DIR = path.join(ROOT, "docs/agent/drafts/llm");
const OPERATOR_QUEUE = path.join(ROOT, "docs/agent/next-actions.json");
const AUTO_NEWS = path.join(ROOT, "src/content/auto-news.json");
const REPORT_FILE = path.join(ROOT, "docs/agent/writer-report.md");

// Opus 5 supersedes Opus 4.8 at the same price ($5/$25 per MTok), and runs
// adaptive thinking by default. Override with ANTHROPIC_MODEL.
const DEFAULT_MODEL = "claude-opus-5";

function toInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

// Pull ranked opportunities from the operator queue; fall back to raw auto-news
// items so the writer still works if the operator hasn't run yet.
async function collectOpportunities() {
  const queue = await readJson(OPERATOR_QUEUE);
  if (queue && Array.isArray(queue.opportunities) && queue.opportunities.length) {
    return queue.opportunities;
  }

  const autoNews = await readJson(AUTO_NEWS);
  const items = Array.isArray(autoNews?.items) ? autoNews.items : [];
  return items.slice(0, 6).map((item) => ({
    slug: String(item.slug || "").trim(),
    source: item.source || item.sourceFeed || "Official source",
    topic: item.topic || "AI Systems",
    publishedAt: item.publishedAt || "",
    href: item.href || "",
    sourceTitle: item.locales?.en?.title || item.title || item.slug || "",
    title: `${item.locales?.en?.title || item.title || item.slug || ""}: What It Means for AI/CS Students`,
    keyword: "",
    monetizationAngle: "student-focused practical summary",
    cta: "Resources + compare pages"
  }));
}

const DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    titleEn: { type: "string", description: "SEO title in English, <= 70 chars, no clickbait." },
    titleFr: { type: "string", description: "French translation of the title." },
    excerptEn: { type: "string", description: "1-2 sentence English meta description / excerpt." },
    excerptFr: { type: "string", description: "French translation of the excerpt." },
    bodyEn: {
      type: "string",
      description:
        "Full English article in GitHub-flavored Markdown, 700-1100 words. Use ## headings, short paragraphs, and at least one bulleted list. Practical, project-first, for AI/CS students. Cite the provided source by name; do not invent URLs."
    },
    bodyFr: { type: "string", description: "Faithful French translation of bodyEn, same structure." },
    keyword: { type: "string", description: "Primary SEO keyword phrase." },
    suggestedCategory: { type: "string", description: "One editorial category, e.g. 'ML Engineering' or 'CS Fundamentals'." },
    tags: { type: "array", items: { type: "string" }, description: "3-6 lowercase topical tags." }
  },
  required: [
    "titleEn",
    "titleFr",
    "excerptEn",
    "excerptFr",
    "bodyEn",
    "bodyFr",
    "keyword",
    "suggestedCategory",
    "tags"
  ]
};

function buildPrompt(opportunity) {
  return [
    "You are the staff writer for \"AI and Cybersecurity News\", a bilingual (EN/FR) publication that helps engineering students turn AI and computer-science topics into portfolio projects, internships, and early income.",
    "",
    "Write a complete, publishable draft article based on this source signal:",
    `- Source: ${opportunity.source}`,
    `- Source title: ${opportunity.sourceTitle || opportunity.title}`,
    `- Source URL: ${opportunity.href || "(none provided)"}`,
    `- Topic track: ${opportunity.topic}`,
    `- Monetization angle (editorial intent, do not mention money explicitly): ${opportunity.monetizationAngle || "practical execution"}`,
    opportunity.keyword ? `- Target keyword: ${opportunity.keyword}` : "",
    "",
    "Rules:",
    "- Be accurate. Only reference the source above by name; do NOT invent statistics, quotes, or URLs.",
    "- Project-first and practical: tell the student what to build and how to apply this, not just what happened.",
    "- Keep both AI and CS framings first-class. Neutral, credible, non-hyped tone.",
    "- The French version must be a faithful translation with identical structure.",
    "- Output ONLY the structured fields requested."
  ]
    .filter(Boolean)
    .join("\n");
}

function frontMatter(opportunity, draft, generatedAt, model) {
  return [
    `# ${draft.titleEn}`,
    "",
    "> Internal draft generated by Blog Writer Agent (LLM).  ",
    "> Status: review-required (not auto-published). Verify all facts before publishing.",
    "",
    "## Draft metadata",
    `- Generated at: ${generatedAt}`,
    `- Model: ${model}`,
    `- Opportunity slug: ${opportunity.slug}`,
    `- Source: ${opportunity.source}`,
    `- Source URL: ${opportunity.href || "(none)"}`,
    `- Topic: ${opportunity.topic}`,
    `- Suggested category: ${draft.suggestedCategory}`,
    `- Primary keyword: ${draft.keyword}`,
    `- Tags: ${(draft.tags || []).join(", ")}`,
    "",
    "## English",
    `**Excerpt:** ${draft.excerptEn}`,
    "",
    draft.bodyEn.trim(),
    "",
    "## Français",
    `**Titre :** ${draft.titleFr}`,
    "",
    `**Extrait :** ${draft.excerptFr}`,
    "",
    draft.bodyFr.trim(),
    ""
  ].join("\n");
}

function extractJson(message) {
  const textBlock = (message.content || []).find((block) => block.type === "text");
  if (!textBlock || typeof textBlock.text !== "string") {
    throw new Error("model returned no text block");
  }
  return JSON.parse(textBlock.text);
}

async function generateDraft(client, model, maxTokens, opportunity) {
  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    output_config: { format: { type: "json_schema", schema: DRAFT_SCHEMA } },
    messages: [{ role: "user", content: buildPrompt(opportunity) }]
  });

  if (message.stop_reason === "refusal") {
    throw new Error("model refused to generate this draft");
  }
  return extractJson(message);
}

async function writeReport({ generatedAt, model, skipped, reason, written, errors }) {
  const lines = [
    "# Blog Writer Agent Report",
    "",
    `- Generated at: ${generatedAt}`,
    `- Model: ${model}`,
    `- Status: ${skipped ? `skipped (${reason})` : "ran"}`,
    `- Drafts written: ${written.length}`,
    `- Errors: ${errors.length}`,
    ""
  ];
  if (written.length) {
    lines.push("## Drafts");
    for (const item of written) lines.push(`- ${item.slug} -> ${item.file}`);
    lines.push("");
  }
  if (errors.length) {
    lines.push("## Errors");
    for (const item of errors) lines.push(`- ${item.slug}: ${item.message}`);
    lines.push("");
  }
  await fs.mkdir(path.dirname(REPORT_FILE), { recursive: true });
  await fs.writeFile(REPORT_FILE, lines.join("\n"), "utf8");
}

async function run() {
  loadScriptEnv(ROOT);
  // new Date() is fine in a one-shot script (unlike workflow scripts).
  const generatedAt = new Date().toISOString();
  const model = (process.env.ANTHROPIC_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();

  if (!apiKey) {
    console.log("[writer] skipped: ANTHROPIC_API_KEY not set (graceful skip).");
    await writeReport({ generatedAt, model, skipped: true, reason: "no api key", written: [], errors: [] });
    return;
  }

  const perRun = Math.max(0, Math.min(10, toInteger(process.env.AGENT_WRITER_DRAFTS_PER_RUN, 2)));
  const maxTokens = Math.max(2048, toInteger(process.env.AGENT_WRITER_MAX_TOKENS, 16000));
  if (perRun === 0) {
    console.log("[writer] skipped: AGENT_WRITER_DRAFTS_PER_RUN=0.");
    await writeReport({ generatedAt, model, skipped: true, reason: "drafts per run = 0", written: [], errors: [] });
    return;
  }

  await fs.mkdir(DRAFTS_DIR, { recursive: true });
  const existing = new Set(await fs.readdir(DRAFTS_DIR).catch(() => []));

  const opportunities = (await collectOpportunities())
    .filter((item) => item && item.slug)
    .filter((item) => !existing.has(`${item.slug}.md`))
    .slice(0, perRun);

  if (!opportunities.length) {
    console.log("[writer] nothing to do: no fresh opportunities.");
    await writeReport({ generatedAt, model, skipped: false, reason: "", written: [], errors: [] });
    return;
  }

  const client = new Anthropic({ apiKey });
  const written = [];
  const errors = [];

  for (const opportunity of opportunities) {
    try {
      const draft = await generateDraft(client, model, maxTokens, opportunity);
      const fileName = `${opportunity.slug.replace(/[^a-z0-9-]/gi, "").toLowerCase()}.md`;
      const filePath = path.join(DRAFTS_DIR, fileName);
      await fs.writeFile(filePath, frontMatter(opportunity, draft, generatedAt, model), "utf8");
      written.push({ slug: opportunity.slug, file: path.relative(ROOT, filePath) });
      console.log(`[writer] wrote draft: ${path.relative(ROOT, filePath)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ slug: opportunity.slug, message });
      console.error(`[writer] failed for ${opportunity.slug}: ${message}`);
    }
  }

  await writeReport({ generatedAt, model, skipped: false, reason: "", written, errors });
  console.log(`[writer] done. drafts=${written.length} errors=${errors.length}`);
}

run().catch((error) => {
  // Never fail the pipeline on writer errors — log and exit 0.
  console.error("[writer] fatal:", error instanceof Error ? error.message : error);
});
