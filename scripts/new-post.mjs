#!/usr/bin/env node
/**
 * Scaffold a blog post.
 *
 * Publishing one article meant hand-writing an eighteen-field typed object
 * inside a 1,200-line file — slug, cluster, tags, keywords, relatedSlugs,
 * popularScore, an affiliate callout with copy in two languages, references,
 * and the body twice, once per locale. Every field is a chance to typo a slug
 * or forget the French half, and the cost lands on the one activity the site
 * now depends on: publishing every week.
 *
 * This writes the scaffold so the only work left is prose.
 *
 *   npm run new:post -- --title "Your headline here"
 *   npm run new:post -- --title "..." --category "LLM Systems" --track ai
 *
 * It refuses to run rather than produce something broken: unknown category,
 * duplicate slug, missing title. Run `npm run typecheck` afterwards — the
 * scaffold is valid TypeScript, so a failure there means the file moved, not
 * that your draft is wrong.
 */
import fs from "node:fs/promises";
import path from "node:path";

const POSTS_FILE = path.join(process.cwd(), "src/content/posts.ts");
const ANCHOR = "const basePosts: BlogPost[] = [";

const CATEGORIES = [
  "AI Fundamentals",
  "ML Engineering",
  "LLM Systems",
  "CS Fundamentals",
  "Systems & Backend",
  "Cloud/DevOps",
  "Security & Performance",
  "Career/Interviews"
];
const TRACKS = ["ai", "cs", "career"];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith("--") ? next : "true";
  }
  return args;
}

/** Slugs end up in URLs and in relatedSlugs, so keep them boring and stable. */
function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.title || args.title === "true") {
  console.log(`
  Scaffold a blog post.

    npm run new:post -- --title "Your headline here"

  Options
    --title     required
    --category  one of: ${CATEGORIES.join(", ")}
                default: AI Fundamentals
    --track     ${TRACKS.join(" | ")}   default: ai
    --date      YYYY-MM-DD              default: today
`);
  process.exit(args.help ? 0 : 1);
}

const title = args.title.trim();
const category = (args.category || "AI Fundamentals").trim();
const track = (args.track || "ai").trim();
const publishedAt = (args.date || new Date().toISOString().slice(0, 10)).trim();

if (!CATEGORIES.includes(category)) {
  fail(`Unknown category "${category}".\n  Pick one of: ${CATEGORIES.join(", ")}`);
}
if (!TRACKS.includes(track)) {
  fail(`Unknown track "${track}". Pick one of: ${TRACKS.join(", ")}`);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) {
  fail(`Date must look like 2026-09-19, got "${publishedAt}".`);
}

const slug = slugify(title);
if (!slug) fail("That title produces an empty slug. Use some letters or numbers.");

const source = await fs.readFile(POSTS_FILE, "utf8");

if (source.includes(`slug: "${slug}"`)) {
  fail(`A post with the slug "${slug}" already exists. Change the title, or edit that post.`);
}
if (!source.includes(ANCHOR)) {
  fail(`Could not find "${ANCHOR}" in ${POSTS_FILE}.\n  The file was restructured — update ANCHOR in scripts/new-post.mjs.`);
}

const TODO_EN = "TODO: write this paragraph in English.";
const TODO_FR = "TODO: ecrire ce paragraphe en francais.";

// readTime is measured from the body at build time, so it is deliberately not
// a field you fill in — an invented reading time was a real bug here once.
const entry = `  {
    slug: "${slug}",
    // Unused: every page calls coverImageUrl(slug, category) and generates the
    // cover from those two values. The field is still required by the type, so
    // it is left empty rather than given a path to an image that does not exist.
    coverImage: "",
    title: "${title.replace(/"/g, '\\"')}",
    excerpt: "TODO: one sentence on what the reader gets.",
    category: "${category}",
    intentKeyword: "${slug.replace(/-/g, " ")}",
    track: "${track}",
    tags: ["TODO-tag"],
    cluster: "${category}",
    publishedAt: "${publishedAt}",
    readTime: "",
    keywords: ["${slug.replace(/-/g, " ")}"],
    popularScore: 50,
    relatedSlugs: [],
    affiliateCallout: {
      headline: { en: "TODO: callout headline", fr: "TODO: titre de l'encart" },
      description: { en: "TODO: one line.", fr: "TODO: une ligne." },
      links: []
    },
    references: [],
    locales: {
      en: {
        title: "${title.replace(/"/g, '\\"')}",
        excerpt: "TODO: one sentence on what the reader gets.",
        content: [
          "${TODO_EN}",
          "${TODO_EN}",
          "${TODO_EN}"
        ]
      },
      fr: {
        title: "TODO: le titre en francais",
        excerpt: "TODO: une phrase sur ce que le lecteur obtient.",
        content: [
          "${TODO_FR}",
          "${TODO_FR}",
          "${TODO_FR}"
        ]
      }
    },
    content: []
  },
`;

const at = source.indexOf(ANCHOR) + ANCHOR.length;
const updated = `${source.slice(0, at)}\n${entry}${source.slice(at)}`;
await fs.writeFile(POSTS_FILE, updated);

console.log(`
  Scaffolded: ${slug}

  Next
    1. Open src/content/posts.ts — your draft is the first entry.
    2. Replace every TODO. There are ${(entry.match(/TODO/g) || []).length}, and the French half is not optional:
       an untranslated post renders English text on the /fr page.
    3. npm run typecheck && npm run build
    4. Preview at /en/blog/${slug}

  Left blank on purpose
    readTime     measured from the body at build time
    content      filled from locales.en at build time
    relatedSlugs add 2-3 slugs once you know which posts this sits beside
`);
