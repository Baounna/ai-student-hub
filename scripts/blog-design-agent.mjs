#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const FILES = {
  blogIndex: path.join(ROOT, "src/app/[lang]/blog/page.tsx"),
  blogPost: path.join(ROOT, "src/app/[lang]/blog/[slug]/page.tsx"),
  styles: path.join(ROOT, "src/app/globals.css")
};

const REPORT_FILE = path.join(ROOT, "docs/agent/design-report.md");
const ACTIONS_FILE = path.join(ROOT, "docs/agent/design-actions.json");

const CHECKS = [
  {
    id: "index-hero",
    label: "Blog index hero section",
    file: "blogIndex",
    test: /className="do-hero[^"]*"/,
    weight: 8,
    action: "Add a premium hero section on blog index with clear value proposition.",
    why: "Hero hierarchy directly affects first-scroll retention."
  },
  {
    id: "index-search",
    label: "Blog keyword search form",
    file: "blogIndex",
    test: /form action={`\/\$\{locale\}\/blog`} method="get"/,
    weight: 6,
    action: "Expose search intent capture on blog index (query form).",
    why: "Search reduces bounce for high-intent visitors."
  },
  {
    id: "index-featured-card",
    label: "Featured post card",
    file: "blogIndex",
    test: /Featured article|Article principal/,
    weight: 7,
    action: "Add a featured article block above stream posts.",
    why: "Featured content guides attention toward best converting content."
  },
  {
    id: "index-quick-filters",
    label: "Quick category filters",
    file: "blogIndex",
    test: /Quick filters|Filtres rapides/,
    weight: 6,
    action: "Add quick category chips near the hero section.",
    why: "Filter chips increase exploration depth and pages per session."
  },
  {
    id: "index-social-proof-strip",
    label: "Blog quality signal strip",
    file: "blogIndex",
    test: /blog-signal-card/,
    weight: 7,
    action: "Add quality signal cards (sources, cadence, practical focus) to blog index.",
    why: "Trust indicators improve click-through to articles."
  },
  {
    id: "index-most-popular",
    label: "Most popular sidebar",
    file: "blogIndex",
    test: /Most popular|Les plus lus/,
    weight: 5,
    action: "Add a most-popular section in sidebar.",
    why: "Popular content shortcuts improve route-to-value for first-time users."
  },
  {
    id: "index-newsletter",
    label: "Newsletter in blog sidebar",
    file: "blogIndex",
    test: /Newsletter compact locale=\{locale\} source="blog_index_aside"/,
    weight: 6,
    action: "Add compact newsletter capture to blog sidebar.",
    why: "Email capture monetizes non-buying traffic."
  },
  {
    id: "post-reading-progress",
    label: "Reading progress component",
    file: "blogPost",
    test: /<ReadingProgress \/>/,
    weight: 5,
    action: "Add reading progress bar for long-form post usability.",
    why: "Progress signals reduce abandonment on long pages."
  },
  {
    id: "post-at-a-glance",
    label: "Post at-a-glance summary panel",
    file: "blogPost",
    test: /At a glance|Article en bref/,
    weight: 6,
    action: "Add an at-a-glance panel in the post header.",
    why: "Fast skim context improves perceived clarity."
  },
  {
    id: "post-metrics-strip",
    label: "Post metrics signal strip",
    file: "blogPost",
    test: /post-signal-grid/,
    weight: 7,
    action: "Add post metrics strip (sources, read effort, related depth).",
    why: "Visible evidence and structure builds editorial trust."
  },
  {
    id: "post-lead-typography",
    label: "Enhanced lead paragraph styling",
    file: "blogPost",
    test: /reading-lead/,
    weight: 4,
    action: "Style the lead paragraph to improve scannability and visual hierarchy.",
    why: "Strong opening typography increases time on page."
  },
  {
    id: "post-toc",
    label: "Article table of contents",
    file: "blogPost",
    test: /<ArticleToc /,
    weight: 6,
    action: "Add sticky table of contents for long articles.",
    why: "TOC improves navigation and mobile return usage."
  },
  {
    id: "post-references",
    label: "References section with source labels",
    file: "blogPost",
    test: /References and sources|References et sources/,
    weight: 6,
    action: "Add structured references section with clear source labels.",
    why: "Source transparency improves trust and SEO quality signals."
  },
  {
    id: "post-reference-domain-pill",
    label: "Reference domain pills",
    file: "blogPost",
    test: /reference-host-pill/,
    weight: 5,
    action: "Add domain pills to reference links for quick source recognition.",
    why: "Faster source scanning improves perceived authority."
  },
  {
    id: "post-tool-cards",
    label: "Recommended tools cards",
    file: "blogPost",
    test: /Recommended tools to execute faster|Outils recommandés pour passer à l'action/,
    weight: 6,
    action: "Keep recommended tools cards in article body with clear CTA hierarchy.",
    why: "Natural tool placement drives ethical affiliate clicks."
  },
  {
    id: "post-sticky-cta",
    label: "Sticky conversion CTA",
    file: "blogPost",
    test: /<StickyPostCta locale=\{locale\} \/>/,
    weight: 6,
    action: "Add sticky CTA at post level for conversion recapture.",
    why: "Sticky CTAs increase conversion without disrupting reading flow."
  },
  {
    id: "styles-design-tokens",
    label: "Global design helper classes",
    file: "styles",
    test: /\.blog-signal-card|\.post-signal-grid|\.reading-lead/,
    weight: 7,
    action: "Define reusable CSS classes for blog signal cards and lead typography.",
    why: "Reusable tokens keep visual system consistent and scalable."
  }
];

function toInteger(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function safeReadText(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function actionPriority(weight) {
  if (weight >= 7) return "P1";
  if (weight >= 5) return "P2";
  return "P3";
}

function buildMarkdown({ generatedAt, targetScore, totalWeight, weightedScore, normalizedScore, checks, actions }) {
  const lines = [];
  lines.push("# AI Student Hub Blog Design Agent Report");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Target score: ${targetScore}/100`);
  lines.push(`Score: ${normalizedScore}/100 (${weightedScore}/${totalWeight} weighted points)`);
  lines.push("");
  lines.push("## Scorecard");
  checks.forEach((check) => {
    const marker = check.passed ? "PASS" : "MISS";
    lines.push(`- [${marker}] ${check.label} (${check.weight})`);
  });
  lines.push("");
  lines.push("## Action Queue");

  if (!actions.length) {
    lines.push("- No action required. Blog design checks are currently passing.");
  } else {
    actions.forEach((item, index) => {
      lines.push(`${index + 1}. [${item.priority}] ${item.action}`);
      lines.push(`   - Why: ${item.why}`);
      lines.push(`   - File: ${item.file}`);
    });
  }
  lines.push("");

  if (normalizedScore >= targetScore) {
    lines.push("Status: on target. Keep shipping incremental quality improvements.");
  } else {
    lines.push("Status: below target. Prioritize P1 design gaps before next content sprint.");
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function run() {
  const generatedAt = new Date().toISOString();
  const targetScore = Math.max(50, Math.min(toInteger(process.env.DESIGN_AGENT_TARGET_SCORE, 88), 100));
  const maxActions = Math.max(3, Math.min(toInteger(process.env.DESIGN_AGENT_MAX_ACTIONS, 10), 20));

  const fileCache = new Map();
  for (const [key, filePath] of Object.entries(FILES)) {
    const source = await safeReadText(filePath);
    fileCache.set(key, source);
  }

  const checks = CHECKS.map((check) => {
    const source = fileCache.get(check.file) || "";
    const passed = check.test.test(source);
    return {
      id: check.id,
      label: check.label,
      file: path.relative(ROOT, FILES[check.file]),
      weight: check.weight,
      passed,
      action: check.action,
      why: check.why
    };
  });

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const weightedScore = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
  const normalizedScore = totalWeight ? Math.round((weightedScore / totalWeight) * 100) : 0;

  const actions = checks
    .filter((check) => !check.passed)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, maxActions)
    .map((check) => ({
      priority: actionPriority(check.weight),
      action: check.action,
      why: check.why,
      file: check.file,
      checkId: check.id,
      weight: check.weight
    }));

  const payload = {
    generatedAt,
    targetScore,
    score: normalizedScore,
    weightedScore,
    totalWeight,
    ratio: totalWeight ? Number((weightedScore / totalWeight).toFixed(3)) : 0,
    summary: {
      checks: checks.length,
      passed: checks.filter((check) => check.passed).length,
      failed: checks.filter((check) => !check.passed).length,
      onTarget: normalizedScore >= targetScore
    },
    checks,
    actions
  };

  const report = buildMarkdown({ generatedAt, targetScore, totalWeight, weightedScore, normalizedScore, checks, actions });

  await fs.mkdir(path.dirname(REPORT_FILE), { recursive: true });
  await fs.writeFile(REPORT_FILE, report, "utf8");
  await fs.writeFile(ACTIONS_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("Blog Design Agent");
  console.log("-----------------");
  console.log(`Score: ${normalizedScore}/100 (${weightedScore}/${totalWeight})`);
  console.log(`Target: ${targetScore}`);
  console.log(`Actions: ${actions.length}`);
  console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
  console.log(`Queue: ${path.relative(ROOT, ACTIONS_FILE)}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
