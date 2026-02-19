#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const AUTO_NEWS_FILE = path.join(ROOT, "src/content/auto-news.json");
const POSTS_FILE = path.join(ROOT, "src/content/posts.ts");
const NEWS_FILE = path.join(ROOT, "src/content/news.ts");
const REPORT_FILE = path.join(ROOT, "docs/agent/latest-report.md");
const QUEUE_FILE = path.join(ROOT, "docs/agent/next-actions.json");
const DRAFTS_DIR = path.join(ROOT, "docs/agent/drafts");

const CTA_FILES = {
  home: path.join(ROOT, "src/app/[lang]/page.tsx"),
  resources: path.join(ROOT, "src/app/[lang]/resources/page.tsx"),
  blog: path.join(ROOT, "src/app/[lang]/blog/[slug]/page.tsx"),
  compare: path.join(ROOT, "src/app/[lang]/compare/[slug]/page.tsx")
};

const INTERNAL_TARGET_USD = 10;

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

function countBlockEntries(fileText, startPattern) {
  const start = fileText.indexOf(startPattern);
  if (start < 0) return 0;
  const end = fileText.indexOf("];", start);
  if (end < 0) return 0;
  const block = fileText.slice(start, end);
  const matches = block.match(/\bslug:\s*"/g);
  return matches ? matches.length : 0;
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

function buildActionQueue({ affiliateRows, placementCoverage, ctaCoverage, revenueModel, hasCheckoutUrl, emailProvider, hasLeadMagnet }) {
  const actions = [];
  const validAffiliates = affiliateRows.filter((row) => row.valid).length;

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
    action: "Review CTR/opt-in/product-click events weekly and update weakest CTA copy.",
    why: "Copy iteration compounds conversions without extra traffic costs."
  });

  return actions.slice(0, 10);
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

  lines.push("# AI Student Hub Blog Operator Report");
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
  const newsSource = await safeReadText(NEWS_FILE);
  const autoNews = await safeReadJson(AUTO_NEWS_FILE, { items: [] });

  const postsCount = countBlockEntries(postsSource, "export const posts:");
  const comparisonsCount = countBlockEntries(postsSource, "export const comparisons:");
  const newsCount = countBlockEntries(newsSource, "export const newsBriefs:");
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
    hasLeadMagnet
  });
  const draftInfo = await generateDrafts(opportunities, generatedAt);

  const report = buildMarkdown({
    generatedAt,
    postsCount,
    comparisonsCount,
    newsCount,
    autoNewsCount: autoItems.length,
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
