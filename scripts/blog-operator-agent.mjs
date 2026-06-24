#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { loadScriptEnv } from "./lib/load-env.mjs";

const ROOT = process.cwd();
loadScriptEnv(ROOT);

const AUTO_NEWS_FILE = path.join(ROOT, "src/content/auto-news.json");
const POSTS_FILE = path.join(ROOT, "src/content/posts.ts");
const POSTS_CS_FILE = path.join(ROOT, "src/content/posts-cs.ts");
const NEWS_FILE = path.join(ROOT, "src/content/news.ts");
const REPORT_FILE = path.join(ROOT, "docs/agent/latest-report.md");
const QUEUE_FILE = path.join(ROOT, "docs/agent/next-actions.json");
const DRAFTS_DIR = path.join(ROOT, "docs/agent/drafts");
const BLOG_INDEX_FILE = path.join(ROOT, "src/app/[lang]/blog/page.tsx");
const NEWS_INDEX_FILE = path.join(ROOT, "src/app/[lang]/news/page.tsx");

const CTA_FILES = {
  home: path.join(ROOT, "src/app/[lang]/page.tsx"),
  resources: path.join(ROOT, "src/app/[lang]/resources/page.tsx"),
  blog: path.join(ROOT, "src/app/[lang]/blog/[slug]/page.tsx"),
  compare: path.join(ROOT, "src/app/[lang]/compare/[slug]/page.tsx")
};

const INTERNAL_TARGET_USD = 10;
const REQUIRED_CATEGORIES = [
  "AI Fundamentals",
  "ML Engineering",
  "LLM Systems",
  "CS Fundamentals",
  "Systems & Backend",
  "Cloud/DevOps",
  "Security & Performance",
  "Career/Interviews"
];

const CATEGORY_TRACKS = {
  "AI Fundamentals": "ai",
  "ML Engineering": "ai",
  "LLM Systems": "ai",
  "CS Fundamentals": "cs",
  "Systems & Backend": "cs",
  "Cloud/DevOps": "cs",
  "Security & Performance": "cs",
  "Career/Interviews": "career"
};

const PLACEHOLDER_FRAGMENTS = ["placeholder", "replace-me", "your-link", "your-domain", "changeme"];

function toNumber(value, fallback) {
  const parsed = Number.parseFloat(String(value || ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const lowered = raw.toLowerCase();
  if (PLACEHOLDER_FRAGMENTS.some((fragment) => lowered.includes(fragment))) return "";
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return raw;
  } catch {
    return "";
  }
}

async function safeReadText(file) {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return "";
  }
}

async function safeReadJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readAffiliateRows() {
  const rows = [];
  for (let index = 1; index <= 5; index += 1) {
    const name = (process.env[`AFFILIATE_${index}_NAME`] || "").trim();
    const url = sanitizeUrl(process.env[`AFFILIATE_${index}_URL`] || "");
    const placement = (process.env[`AFFILIATE_${index}_PLACEMENT`] || "").trim().toLowerCase();
    rows.push({ index, name, url, placement, valid: Boolean(name && url) });
  }
  return rows;
}

function hasPlacement(rows, target) {
  return rows.some((row) => {
    if (!row.valid) return false;
    if (target === "comparison") return row.placement.includes("comparison") || row.placement.includes("compare");
    return row.placement.includes(target);
  });
}

function extractArrayBlock(source, startPattern) {
  const start = source.search(startPattern);
  if (start < 0) return "";
  const equalsIndex = source.indexOf("=", start);
  if (equalsIndex < 0) return "";
  const openBracket = source.indexOf("[", equalsIndex);
  if (openBracket < 0) return "";

  let depth = 0;
  for (let index = openBracket; index < source.length; index += 1) {
    const char = source[index];
    if (char === "[") {
      depth += 1;
      continue;
    }
    if (char !== "]") continue;
    depth -= 1;
    if (depth === 0) return source.slice(openBracket, index + 1);
  }

  return "";
}

function countSlugEntriesInBlock(block) {
  const matches = block.match(/\bslug:\s*"/g);
  return matches ? matches.length : 0;
}

function countCategoryEntriesInBlock(block) {
  return Array.from(block.matchAll(/\bcategory:\s*"([^"]+)"/g))
    .map((match) => String(match[1] || "").trim())
    .filter(Boolean);
}

function countTrackEntriesInBlock(block) {
  return Array.from(block.matchAll(/\btrack:\s*"(ai|cs|career)"/gi))
    .map((match) => String(match[1] || "").trim().toLowerCase())
    .filter(Boolean);
}

function countSourceBlocksWithHref(block) {
  const items = block.match(/source:\s*\{[\s\S]*?href:\s*"https?:\/\/[^"]+"[\s\S]*?\}/g);
  return items ? items.length : 0;
}

function detectEditorialSplitCoverage(blogIndexSource, newsIndexSource) {
  const splitLabelPattern = /AI \+ CS split|Split IA \+ informatique/;
  const splitChipPattern = /key:\s*"ai"[\s\S]*key:\s*"cs"|trackFilterOptions|trackOptions/;

  return {
    blogSplit: splitLabelPattern.test(blogIndexSource) && splitChipPattern.test(blogIndexSource),
    newsSplit: splitLabelPattern.test(newsIndexSource) && splitChipPattern.test(newsIndexSource)
  };
}

function buildEditorialAudit({ basePostsBlock, csPostsBlock, newsBlock, blogIndexSource, newsIndexSource }) {
  const postsCount = countSlugEntriesInBlock(basePostsBlock) + countSlugEntriesInBlock(csPostsBlock);
  const newsCount = countSlugEntriesInBlock(newsBlock);

  const baseCategoryNames = countCategoryEntriesInBlock(basePostsBlock);
  const csCategoryNames = countCategoryEntriesInBlock(csPostsBlock);
  const categoryNames = [...baseCategoryNames, ...csCategoryNames];
  const categorySet = new Set(categoryNames);
  const missingCategories = REQUIRED_CATEGORIES.filter((category) => !categorySet.has(category));

  const trackCounts = { ai: 0, cs: 0, career: 0 };
  for (const category of baseCategoryNames) {
    const mapped = CATEGORY_TRACKS[category];
    if (!mapped) continue;
    trackCounts[mapped] += 1;
  }

  const explicitTracks = countTrackEntriesInBlock(csPostsBlock);
  for (const track of explicitTracks) {
    if (!Object.prototype.hasOwnProperty.call(trackCounts, track)) continue;
    trackCounts[track] += 1;
  }

  const totalTracked = Math.max(trackCounts.ai + trackCounts.cs + trackCounts.career, 1);
  const csShare = trackCounts.cs / totalTracked;
  const aiShare = trackCounts.ai / totalTracked;

  const minCsShare = Math.max(0.2, Math.min(toNumber(process.env.AGENT_MIN_CS_SHARE, 0.35), 0.8));
  const maxAiShare = Math.max(0.3, Math.min(toNumber(process.env.AGENT_MAX_AI_SHARE, 0.6), 0.9));
  const splitCoverage = detectEditorialSplitCoverage(blogIndexSource, newsIndexSource);

  const referencesInPosts =
    (basePostsBlock.match(/\breferences:\s*\[/g) || []).length + (csPostsBlock.match(/\breferences:\s*\[/g) || []).length;
  const uncitedPostsEstimate = Math.max(postsCount - referencesInPosts, 0);
  const sourcedNewsCount = countSourceBlocksWithHref(newsBlock);
  const uncitedNewsEstimate = Math.max(newsCount - sourcedNewsCount, 0);

  return {
    postsCount,
    newsCount,
    categories: {
      total: categorySet.size,
      missingRequired: missingCategories
    },
    tracks: {
      counts: trackCounts,
      total: totalTracked,
      aiShare,
      csShare,
      minCsShare,
      maxAiShare
    },
    citations: {
      postsWithReferences: referencesInPosts,
      uncitedPostsEstimate,
      sourcedNewsCount,
      uncitedNewsEstimate
    },
    splitCoverage
  };
}

function parseAutoNewsItems(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.items)) return [];
  return raw.items
    .filter((item) => item && item.slug && item.topic && item.source && item.locales?.en?.title)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

function topicToMoneyAngle(topic) {
  const normalized = String(topic || "").toLowerCase();
  if (normalized.includes("performance")) {
    return {
      angle: "benchmark + budget-friendly model/tool choice",
      cta: "Compare tools + student guide",
      keywordPrefix: "best ai model benchmark for students"
    };
  }
  if (normalized.includes("systems")) {
    return {
      angle: "how to build and ship this update as a student project",
      cta: "Resources stack + roadmap",
      keywordPrefix: "how to build"
    };
  }
  if (normalized.includes("computer systems")) {
    return {
      angle: "deployment and infra tradeoffs for student budgets",
      cta: "Cloud comparison + resources",
      keywordPrefix: "best cloud setup for students"
    };
  }
  if (normalized.includes("computer science") || normalized.includes("backend") || normalized.includes("devops")) {
    return {
      angle: "CS implementation and tooling decision for student budgets",
      cta: "Resources + compare pages",
      keywordPrefix: "computer science workflow for students"
    };
  }
  if (normalized.includes("security")) {
    return {
      angle: "security checklist and reliability upgrade path for student apps",
      cta: "Security guide + resources",
      keywordPrefix: "api security for student projects"
    };
  }
  return {
    angle: "student-focused practical summary",
    cta: "Roadmap + related blog guide",
    keywordPrefix: "ai cs update for students"
  };
}

function createOpportunity(item) {
  const title = item.locales?.en?.title || "AI/CS update";
  const angle = topicToMoneyAngle(item.topic);
  const simplifiedTitle = title.replace(/\s+/g, " ").trim();
  const keyword = `${angle.keywordPrefix} ${item.source}`.toLowerCase();
  const articleTitle = `${simplifiedTitle}: What It Means for AI/CS Students`;
  return {
    slug: item.slug,
    source: item.source,
    topic: item.topic,
    publishedAt: item.publishedAt,
    href: item.href,
    sourceTitle: simplifiedTitle,
    title: articleTitle,
    keyword,
    monetizationAngle: angle.angle,
    cta: angle.cta
  };
}

function topicToIntent(topic) {
  const normalized = String(topic || "").toLowerCase();
  if (normalized.includes("performance")) return "comparison-intent";
  if (normalized.includes("systems")) return "implementation-intent";
  if (normalized.includes("research")) return "explain-and-apply";
  return "practical-news-analysis";
}

function draftOutline(topic) {
  const normalized = String(topic || "").toLowerCase();
  if (normalized.includes("performance")) {
    return [
      "What changed in this benchmark update",
      "How to read the numbers without hype",
      "Student budget decision matrix",
      "Which model/tool to pick this week",
      "Portfolio project idea using this update"
    ];
  }
  if (normalized.includes("systems")) {
    return [
      "What shipped and why it matters",
      "Architecture breakdown for students",
      "Step-by-step implementation plan",
      "Tools and stack choices",
      "Portfolio and interview positioning"
    ];
  }
  return [
    "What changed",
    "Why this matters for AI/CS students",
    "How to apply this in a practical project",
    "Common mistakes to avoid",
    "Next actions this week"
  ];
}

function buildDraftMarkdown(opportunity, generatedAt) {
  const intent = topicToIntent(opportunity.topic);
  const outline = draftOutline(opportunity.topic);

  return `# ${opportunity.title}

> Internal draft generated by Blog Operator Agent.  
> Status: review-required (not auto-published).

## Draft metadata
- Generated at: ${generatedAt}
- Opportunity slug: ${opportunity.slug}
- Source: ${opportunity.source}
- Source URL: ${opportunity.href}
- Topic: ${opportunity.topic}
- Target keyword: ${opportunity.keyword}
- Search intent: ${intent}
- Monetization angle: ${opportunity.monetizationAngle}
- CTA focus: ${opportunity.cta}

## Suggested outline
1. ${outline[0]}
2. ${outline[1]}
3. ${outline[2]}
4. ${outline[3]}
5. ${outline[4]}

## Introduction draft
${opportunity.sourceTitle} is one of the most relevant recent updates for students building AI and computer science projects.  
Instead of treating it like generic news, this article translates the signal into concrete execution decisions: what to build, what to prioritize, and how to turn this topic into portfolio proof.

## What changed
Summarize the release/update in plain language.  
Use one short paragraph for technical context and one short paragraph for practical impact.

## Why this matters for students
Connect this update to:
- portfolio quality
- internship interview storytelling
- tool and budget decisions
- implementation speed

## Practical execution plan (7-day sprint)
Day 1:
- Reproduce a minimal version of the idea in a local notebook or app.

Day 2-3:
- Implement one measurable feature tied to this update.

Day 4:
- Add evaluation (latency, quality, or benchmark comparisons).

Day 5:
- Deploy a simple demo and capture screenshots.

Day 6:
- Write a short technical breakdown.

Day 7:
- Publish the project recap with sources and internal links.

## CTA placement plan (internal)
- Intro CTA: link to roadmap/entry resource.
- Mid CTA: link to comparison/resources based on tool decisions.
- End CTA: link to product guide or newsletter.

## Internal linking targets
- /en/resources
- /en/compare
- /en/blog
- /en/product/ai-career-guide

## Source references
1. ${opportunity.source}: ${opportunity.href}

## Editorial checklist before publishing
- [ ] Add at least 2 trusted sources.
- [ ] Add one concrete student project example.
- [ ] Add one comparison table or decision matrix.
- [ ] Add affiliate disclosure where relevant.
- [ ] Verify metadata keyword + slug + internal links.
`;
}

async function generateDrafts(opportunities, generatedAt) {
  const perRunRaw = toInteger(process.env.AGENT_DRAFTS_PER_RUN, 2);
  const perRun = Math.max(0, Math.min(perRunRaw, 10));
  await fs.mkdir(DRAFTS_DIR, { recursive: true });

  if (!perRun || !opportunities.length) {
    return { created: [], perRun, totalOpportunities: opportunities.length };
  }

  const existingFiles = await fs.readdir(DRAFTS_DIR);
  const existingSlugs = new Set(
    existingFiles
      .map((fileName) => {
        const match = fileName.match(/--([a-z0-9-]+)\.md$/i);
        return match?.[1] || "";
      })
      .filter(Boolean)
  );

  const dateStamp = generatedAt.slice(0, 10).replace(/-/g, "");
  const targets = opportunities.filter((item) => !existingSlugs.has(item.slug)).slice(0, perRun);
  const created = [];

  for (const opportunity of targets) {
    const cleanSlug = opportunity.slug.replace(/[^a-z0-9-]/gi, "").toLowerCase();
    const fileName = `${dateStamp}--${cleanSlug}.md`;
    const filePath = path.join(DRAFTS_DIR, fileName);
    const content = buildDraftMarkdown(opportunity, generatedAt);
    await fs.writeFile(filePath, content, "utf8");
    created.push(path.relative(ROOT, filePath));
  }

  return { created, perRun, totalOpportunities: opportunities.length };
}

function calculateRevenueModel({ hasAffiliates, hasCheckoutUrl, hasEmailAutomation }) {
  const monthlyVisits = toNumber(process.env.AGENT_MONTHLY_VISITS_TARGET, 300);
  const affiliateCtr = toNumber(process.env.AGENT_AFFILIATE_CTR_TARGET, 0.04);
  const affiliateCvr = toNumber(process.env.AGENT_AFFILIATE_CVR_TARGET, 0.08);
  const affiliateCommission = toNumber(process.env.AGENT_AFFILIATE_COMMISSION_USD, 10);
  const productCvr = toNumber(process.env.AGENT_PRODUCT_CVR_TARGET, 0.005);
  const productPrice = toNumber(process.env.AGENT_PRODUCT_PRICE_USD, 12);
  const emailOptin = toNumber(process.env.AGENT_EMAIL_OPTIN_TARGET, 0.03);
  const emailToProduct = toNumber(process.env.AGENT_EMAIL_TO_PRODUCT_CVR, 0.02);

  const effectiveAffiliateCtr = hasAffiliates ? affiliateCtr : 0;
  const effectiveAffiliateCvr = hasAffiliates ? affiliateCvr : 0;
  const effectiveProductCvr = hasCheckoutUrl ? productCvr : 0;
  const effectiveEmailOptin = hasEmailAutomation ? emailOptin : 0;
  const effectiveEmailToProduct = hasEmailAutomation && hasCheckoutUrl ? emailToProduct : 0;

  const affiliateRevenue = monthlyVisits * effectiveAffiliateCtr * effectiveAffiliateCvr * affiliateCommission;
  const productRevenue = monthlyVisits * effectiveProductCvr * productPrice;
  const emailRevenue = monthlyVisits * effectiveEmailOptin * effectiveEmailToProduct * productPrice;
  const total = affiliateRevenue + productRevenue + emailRevenue;

  return {
    assumptions: {
      monthlyVisits,
      affiliateCtr,
      affiliateCvr,
      affiliateCommission,
      productCvr,
      productPrice,
      emailOptin,
      emailToProduct,
      infraGates: {
        hasAffiliates,
        hasCheckoutUrl,
        hasEmailAutomation
      }
    },
    estimate: {
      affiliateRevenue: Number(affiliateRevenue.toFixed(2)),
      productRevenue: Number(productRevenue.toFixed(2)),
      emailRevenue: Number(emailRevenue.toFixed(2)),
      totalRevenue: Number(total.toFixed(2)),
      targetUsd: INTERNAL_TARGET_USD,
      gapUsd: Number(Math.max(INTERNAL_TARGET_USD - total, 0).toFixed(2))
    }
  };
}

function boolToMark(value) {
  return value ? "YES" : "NO";
}

async function detectCtaCoverage() {
  const coverage = {};
  for (const [surface, filePath] of Object.entries(CTA_FILES)) {
    const source = await safeReadText(filePath);
    coverage[surface] = {
      hasLeadMagnet: /lead_magnet_click/.test(source),
      hasAffiliate: /affiliate_click/.test(source),
      hasProductCheckout: /product_checkout_click/.test(source)
    };
  }
  return coverage;
}

function buildActionQueue({
  affiliateRows,
  placementCoverage,
  ctaCoverage,
  revenueModel,
  hasCheckoutUrl,
  emailProvider,
  hasLeadMagnet,
  editorialAudit
}) {
  const actions = [];
  const validAffiliates = affiliateRows.filter((row) => row.valid).length;
  const csShareTooLow = editorialAudit.tracks.csShare < editorialAudit.tracks.minCsShare;
  const aiShareTooHigh = editorialAudit.tracks.aiShare > editorialAudit.tracks.maxAiShare;

  if (csShareTooLow) {
    actions.push({
      priority: "P1",
      action: `Increase CS editorial share to at least ${(editorialAudit.tracks.minCsShare * 100).toFixed(0)}%.`,
      why: "Balanced AI + CS coverage improves relevance for engineering students and diversifies SEO intent."
    });
  }

  if (aiShareTooHigh) {
    actions.push({
      priority: "P2",
      action: `Reduce AI concentration below ${(editorialAudit.tracks.maxAiShare * 100).toFixed(0)}% by publishing CS-first articles.`,
      why: "Over-concentration on AI weakens core CS positioning and limits broader technical keyword coverage."
    });
  }

  if (editorialAudit.categories.missingRequired.length) {
    actions.push({
      priority: "P1",
      action: `Restore missing required categories: ${editorialAudit.categories.missingRequired.join(", ")}.`,
      why: "Category coverage keeps the publication architecture complete for AI + CS discovery."
    });
  }

  if (!editorialAudit.splitCoverage.blogSplit || !editorialAudit.splitCoverage.newsSplit) {
    actions.push({
      priority: "P1",
      action: "Keep visible AI/CS split filters on both blog and news index pages.",
      why: "Split navigation helps users quickly enter the right track and increases session depth."
    });
  }

  if (editorialAudit.citations.uncitedPostsEstimate > 0) {
    actions.push({
      priority: "P1",
      action: "Add explicit references blocks to all long-form posts missing citations.",
      why: "Source-backed articles improve trust, SEO quality, and editorial credibility."
    });
  }

  if (editorialAudit.citations.uncitedNewsEstimate > 0) {
    actions.push({
      priority: "P1",
      action: "Ensure every curated news brief has a valid source href.",
      why: "Uncited news weakens trust and violates source integrity standards."
    });
  }

  if (validAffiliates < 3) {
    actions.push({
      priority: "P1",
      action: "Add at least 3 valid affiliate links (name + final URL + placement).",
      why: "Without valid links, affiliate revenue path is blocked."
    });
  }

  for (const required of ["home", "resources", "blog", "comparison"]) {
    if (!placementCoverage[required]) {
      actions.push({
        priority: "P1",
        action: `Cover missing affiliate placement: ${required}.`,
        why: "Missing placement means lost monetization intent on that traffic surface."
      });
    }
  }

  if (!hasCheckoutUrl) {
    actions.push({
      priority: "P1",
      action: "Set NEXT_PUBLIC_PRODUCT_CHECKOUT_URL (Gumroad/LemonSqueezy) and test buy CTA.",
      why: "Product revenue cannot convert without a live checkout URL."
    });
  }

  if (emailProvider !== "convertkit") {
    actions.push({
      priority: "P1",
      action: "Enable ConvertKit and connect newsletter form ID/API key.",
      why: "Email capture without automation loses warm leads and repeat conversions."
    });
  }

  if (!hasLeadMagnet) {
    actions.push({
      priority: "P1",
      action: "Set lead magnet URLs for EN/FR and ensure CTA appears on home/resources/posts.",
      why: "Lead magnet is the lowest-friction conversion path for student traffic."
    });
  }

  for (const [surface, checks] of Object.entries(ctaCoverage)) {
    if (!checks.hasLeadMagnet) {
      actions.push({
        priority: "P2",
        action: `Add lead magnet CTA on ${surface}.`,
        why: "Increases opt-ins per 100 visitors."
      });
    }
    if (!checks.hasAffiliate) {
      actions.push({
        priority: "P2",
        action: `Add natural affiliate CTA on ${surface}.`,
        why: "Creates monetization opportunities from high-intent sessions."
      });
    }
  }

  if (revenueModel.estimate.totalRevenue < INTERNAL_TARGET_USD) {
    actions.push({
      priority: "P2",
      action: "Publish 1 comparison-intent post/week from auto-news opportunities.",
      why: "High-intent SEO posts improve both affiliate CTR and product click-through."
    });
  }

  actions.push({
    priority: "P3",
    action: "Review weekly: CS share, citation coverage, and CTA CTR. Update weakest section copy.",
    why: "Editorial quality and conversion copy iteration compound growth without extra acquisition cost."
  });

  return actions.slice(0, 14);
}

function toPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function buildMarkdown({
  generatedAt,
  postsCount,
  comparisonsCount,
  newsCount,
  autoNewsCount,
  editorialAudit,
  affiliateRows,
  placementCoverage,
  ctaCoverage,
  revenueModel,
  opportunities,
  actions,
  draftInfo
}) {
  const validAffiliates = affiliateRows.filter((row) => row.valid).length;
  const lines = [];

  lines.push("# AI and Cybersecurity News Blog Operator Report");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Internal target: $${INTERNAL_TARGET_USD.toFixed(2)}/month (private operator metric)`);
  lines.push("");
  lines.push("## Content Inventory");
  lines.push(`- Blog posts: ${postsCount}`);
  lines.push(`- Comparison pages: ${comparisonsCount}`);
  lines.push(`- Curated news briefs: ${newsCount}`);
  lines.push(`- Auto web signals: ${autoNewsCount}`);
  lines.push("");
  lines.push("## AI + CS Editorial Audit");
  lines.push(
    `- Track counts (AI/CS/Career): ${editorialAudit.tracks.counts.ai}/${editorialAudit.tracks.counts.cs}/${editorialAudit.tracks.counts.career}`
  );
  lines.push(
    `- Track shares (AI/CS): ${toPercent(editorialAudit.tracks.aiShare)} / ${toPercent(editorialAudit.tracks.csShare)}`
  );
  lines.push(
    `- CS share target >= ${toPercent(editorialAudit.tracks.minCsShare)}: ${boolToMark(
      editorialAudit.tracks.csShare >= editorialAudit.tracks.minCsShare
    )}`
  );
  lines.push(
    `- AI share ceiling <= ${toPercent(editorialAudit.tracks.maxAiShare)}: ${boolToMark(
      editorialAudit.tracks.aiShare <= editorialAudit.tracks.maxAiShare
    )}`
  );
  lines.push(
    `- Required category coverage: ${boolToMark(!editorialAudit.categories.missingRequired.length)}`
  );
  if (editorialAudit.categories.missingRequired.length) {
    lines.push(`- Missing categories: ${editorialAudit.categories.missingRequired.join(", ")}`);
  }
  lines.push(
    `- Split navigation (blog/news): ${boolToMark(editorialAudit.splitCoverage.blogSplit)}/${boolToMark(
      editorialAudit.splitCoverage.newsSplit
    )}`
  );
  lines.push("");
  lines.push("## Citation Coverage");
  lines.push(`- Posts with references blocks: ${editorialAudit.citations.postsWithReferences}/${postsCount}`);
  lines.push(`- Estimated uncited posts: ${editorialAudit.citations.uncitedPostsEstimate}`);
  lines.push(`- News entries with source href: ${editorialAudit.citations.sourcedNewsCount}/${newsCount}`);
  lines.push(`- Estimated uncited news briefs: ${editorialAudit.citations.uncitedNewsEstimate}`);
  lines.push("");
  lines.push("## Monetization Infrastructure");
  lines.push(`- Valid affiliate links: ${validAffiliates}/5`);
  lines.push(`- Placement coverage (home/resources/blog/comparison): ${boolToMark(placementCoverage.home)}/${boolToMark(placementCoverage.resources)}/${boolToMark(placementCoverage.blog)}/${boolToMark(placementCoverage.comparison)}`);
  lines.push(`- Lead magnet configured (EN+FR): ${boolToMark(Boolean(process.env.NEXT_PUBLIC_LEAD_MAGNET_URL_EN && process.env.NEXT_PUBLIC_LEAD_MAGNET_URL_FR))}`);
  lines.push(`- Product checkout configured: ${boolToMark(Boolean(sanitizeUrl(process.env.NEXT_PUBLIC_PRODUCT_CHECKOUT_URL || "")))}`);
  lines.push(`- Email automation provider: ${(process.env.EMAIL_PROVIDER || "none").trim().toLowerCase() || "none"}`);
  lines.push("");
  lines.push("## CTA Surface Audit");
  for (const [surface, checks] of Object.entries(ctaCoverage)) {
    lines.push(`- ${surface}: lead_magnet=${boolToMark(checks.hasLeadMagnet)} | affiliate=${boolToMark(checks.hasAffiliate)} | checkout=${boolToMark(checks.hasProductCheckout)}`);
  }
  lines.push("");
  lines.push("## Revenue Model (Assumptions)");
  lines.push(`- Monthly visits: ${revenueModel.assumptions.monthlyVisits}`);
  lines.push(`- Affiliate CTR: ${toPercent(revenueModel.assumptions.affiliateCtr)}`);
  lines.push(`- Affiliate CVR: ${toPercent(revenueModel.assumptions.affiliateCvr)}`);
  lines.push(`- Affiliate commission: $${revenueModel.assumptions.affiliateCommission.toFixed(2)}`);
  lines.push(`- Product CVR: ${toPercent(revenueModel.assumptions.productCvr)}`);
  lines.push(`- Product price: $${revenueModel.assumptions.productPrice.toFixed(2)}`);
  lines.push(`- Email opt-in: ${toPercent(revenueModel.assumptions.emailOptin)}`);
  lines.push(`- Email->product CVR: ${toPercent(revenueModel.assumptions.emailToProduct)}`);
  lines.push("");
  lines.push("## Revenue Estimate (Internal)");
  lines.push(`- Affiliate: $${revenueModel.estimate.affiliateRevenue.toFixed(2)}`);
  lines.push(`- Product direct: $${revenueModel.estimate.productRevenue.toFixed(2)}`);
  lines.push(`- Email-driven product: $${revenueModel.estimate.emailRevenue.toFixed(2)}`);
  lines.push(`- Total estimated: $${revenueModel.estimate.totalRevenue.toFixed(2)}`);
  lines.push(`- Gap to target: $${revenueModel.estimate.gapUsd.toFixed(2)}`);
  lines.push("");
  lines.push("## Top Auto-News Opportunities");
  if (!opportunities.length) {
    lines.push("- No opportunities found from auto-news feed.");
  } else {
    opportunities.forEach((opportunity, index) => {
      lines.push(`${index + 1}. ${opportunity.title}`);
      lines.push(`   - Source: ${opportunity.source}`);
      lines.push(`   - Keyword: ${opportunity.keyword}`);
      lines.push(`   - Monetization angle: ${opportunity.monetizationAngle}`);
      lines.push(`   - CTA: ${opportunity.cta}`);
    });
  }
  lines.push("");
  lines.push("## Operator Action Queue");
  actions.forEach((item, index) => {
    lines.push(`${index + 1}. [${item.priority}] ${item.action}`);
    lines.push(`   - Why: ${item.why}`);
  });
  lines.push("");
  lines.push("## Draft Generation");
  lines.push(`- Draft slots per run: ${draftInfo.perRun}`);
  lines.push(`- New drafts generated: ${draftInfo.created.length}`);
  if (draftInfo.created.length) {
    draftInfo.created.forEach((file) => lines.push(`- ${file}`));
  } else {
    lines.push("- No new drafts generated (existing coverage or no opportunities).");
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function run() {
  const generatedAt = new Date().toISOString();
  const postsSource = await safeReadText(POSTS_FILE);
  const csPostsSource = await safeReadText(POSTS_CS_FILE);
  const newsSource = await safeReadText(NEWS_FILE);
  const blogIndexSource = await safeReadText(BLOG_INDEX_FILE);
  const newsIndexSource = await safeReadText(NEWS_INDEX_FILE);
  const autoNews = await safeReadJson(AUTO_NEWS_FILE, { items: [] });

  const basePostsBlock = extractArrayBlock(postsSource, /const\s+basePosts\s*:\s*BlogPost\[\]\s*=\s*\[/);
  const comparisonsBlock = extractArrayBlock(postsSource, /export\s+const\s+comparisons\s*:\s*ComparisonPage\[\]\s*=\s*\[/);
  const csPostsBlock = extractArrayBlock(csPostsSource, /export\s+const\s+csExpansionPosts\s*:\s*BlogPost\[\]\s*=\s*\[/);
  const newsBlock = extractArrayBlock(newsSource, /export\s+const\s+newsBriefs\s*:\s*NewsBrief\[\]\s*=\s*\[/);

  const editorialAudit = buildEditorialAudit({
    basePostsBlock,
    csPostsBlock,
    newsBlock,
    blogIndexSource,
    newsIndexSource
  });

  const postsCount = editorialAudit.postsCount;
  const comparisonsCount = countSlugEntriesInBlock(comparisonsBlock);
  const newsCount = editorialAudit.newsCount;
  const autoItems = parseAutoNewsItems(autoNews);
  const opportunities = autoItems.slice(0, 6).map(createOpportunity);

  const affiliateRows = readAffiliateRows();
  const placementCoverage = {
    home: hasPlacement(affiliateRows, "home"),
    resources: hasPlacement(affiliateRows, "resources"),
    blog: hasPlacement(affiliateRows, "blog"),
    comparison: hasPlacement(affiliateRows, "comparison")
  };

  const ctaCoverage = await detectCtaCoverage();
  const hasCheckoutUrl = Boolean(sanitizeUrl(process.env.NEXT_PUBLIC_PRODUCT_CHECKOUT_URL || ""));
  const hasLeadMagnet = Boolean((process.env.NEXT_PUBLIC_LEAD_MAGNET_URL_EN || "").trim() && (process.env.NEXT_PUBLIC_LEAD_MAGNET_URL_FR || "").trim());
  const emailProvider = (process.env.EMAIL_PROVIDER || "none").trim().toLowerCase();
  const validAffiliateCount = affiliateRows.filter((row) => row.valid).length;
  const revenueModel = calculateRevenueModel({
    hasAffiliates: validAffiliateCount > 0,
    hasCheckoutUrl,
    hasEmailAutomation: emailProvider === "convertkit"
  });

  const actions = buildActionQueue({
    affiliateRows,
    placementCoverage,
    ctaCoverage,
    revenueModel,
    hasCheckoutUrl,
    emailProvider,
    hasLeadMagnet,
    editorialAudit
  });
  const draftInfo = await generateDrafts(opportunities, generatedAt);

  const report = buildMarkdown({
    generatedAt,
    postsCount,
    comparisonsCount,
    newsCount,
    autoNewsCount: autoItems.length,
    editorialAudit,
    affiliateRows,
    placementCoverage,
    ctaCoverage,
    revenueModel,
    opportunities,
    actions,
    draftInfo
  });

  const queue = {
    generatedAt,
    target: {
      monthlyRevenueUsd: INTERNAL_TARGET_USD
    },
    summary: {
      postsCount,
      comparisonsCount,
      newsCount,
      autoNewsCount: autoItems.length
    },
    editorial: editorialAudit,
    monetization: {
      validAffiliates: validAffiliateCount,
      placementCoverage,
      hasCheckoutUrl,
      emailProvider,
      hasLeadMagnet
    },
    revenueModel,
    opportunities,
    actions,
    drafts: {
      perRun: draftInfo.perRun,
      generatedCount: draftInfo.created.length,
      generatedFiles: draftInfo.created
    }
  };

  await fs.mkdir(path.dirname(REPORT_FILE), { recursive: true });
  await fs.writeFile(REPORT_FILE, report, "utf8");
  await fs.writeFile(QUEUE_FILE, `${JSON.stringify(queue, null, 2)}\n`, "utf8");

  console.log("Blog Operator Agent");
  console.log("-------------------");
  console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
  console.log(`Queue: ${path.relative(ROOT, QUEUE_FILE)}`);
  console.log(`Opportunities: ${opportunities.length}`);
  console.log(`Actions: ${actions.length}`);
  console.log(`Drafts generated: ${draftInfo.created.length}`);
  console.log(`Estimated total revenue: $${queue.revenueModel.estimate.totalRevenue.toFixed(2)} / month`);
  console.log(`Gap to $${INTERNAL_TARGET_USD}: $${queue.revenueModel.estimate.gapUsd.toFixed(2)}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
