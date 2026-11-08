import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { titleKey } from "@/lib/live-news";

/**
 * /news used to be the slowest page on the site by an order of magnitude.
 *
 * getLiveAiCsUpdates fetches seventeen third-party feeds and was awaited as the
 * first statement of the page component, before a single element of JSX. So the
 * time to first byte was the time of the slowest host we do not run, and the
 * twenty-seven hand-written briefs underneath -- plain imports, needing nothing
 * -- waited behind them. Measured on a production build: 270.8ms for /en/news
 * against 12-18ms for every other page, and that was with DNS broken so all
 * seventeen fetches failed instantly. In production each is a real request, and
 * one host that accepts a connection then goes quiet held the page for the full
 * ten-second timeout with nothing on screen.
 *
 * Two changes, and this guards both: the fetch moved behind a Suspense
 * boundary, and the per-feed ceiling came down to 2.5s.
 */
const read = (p: string) => readFileSync(path.join(process.cwd(), p), "utf8");

const NEWS_PAGES = ["src/app/[lang]/news/page.tsx", "src/app/[lang]/news/live/page.tsx"];

describe("the live feed fetch", () => {
  it("cannot hold a page for ten seconds any more", () => {
    const source = read("src/lib/live-news.ts");
    const declared = source.match(/FEED_TIMEOUT_MS\s*=\s*([\d_]+)/)?.[1];
    expect(declared).toBeDefined();
    expect(Number(String(declared).replace(/_/g, ""))).toBeLessThanOrEqual(2_500);

    // Seventeen feeds are fetched together, so the ceiling is not a per-feed
    // budget -- it is the worst case for the whole page. A second literal
    // smuggled into the fetch would make the constant decorative.
    expect(source).toContain("AbortSignal.timeout(FEED_TIMEOUT_MS)");
    expect(source.match(/AbortSignal\.timeout\(/g) || []).toHaveLength(1);
  });

  it.each(NEWS_PAGES)("is not awaited before any JSX in %s", (file) => {
    const source = read(file);
    const body = source.slice(source.indexOf("export default async function"));

    // The page component renders the shell and nothing else reaches for the
    // network. Moving the fetch back up here is the regression.
    expect(body).not.toContain("getLiveAiCsUpdates");
    expect(body).toContain("<Suspense");
  });

  it.each(NEWS_PAGES)("streams real headlines rather than a placeholder in %s", (file) => {
    // The fallback is the committed auto-news snapshot -- the same feeds, read
    // on a cron into src/content/auto-news.json. A skeleton here would claim we
    // have nothing to show while a copy sits in the repo.
    expect(read(file)).toMatch(/fallback=\{<(WebUpdatesBody|UpdateStream)/);
  });

  it("no longer exports a revalidate that the root layout overrides", () => {
    // Both pages exported `revalidate = 1800` while the measured Cache-Control
    // on /en/news was `private, no-cache, no-store, max-age=0,
    // must-revalidate`: the root layout reads headers() for the CSP nonce, so
    // the whole tree renders per request. The thirty minutes that do exist are
    // the per-feed `next: { revalidate }`, which is a data-cache setting.
    for (const file of NEWS_PAGES) {
      expect(read(file)).not.toMatch(/^export const revalidate/m);
    }
    expect(read("src/lib/live-news.ts")).toContain("next: { revalidate: 60 * 30 }");
  });
});

/**
 * A prefetch of a dynamic route returns 389-444 bytes -- the route tree, which
 * is correct -- while the render it stands in for is 75.8 kB for /en and
 * 210.8 kB for /en/stages. With no loading.tsx anywhere in src, every in-app
 * click left the old page on screen, unchanged, until the new one had finished
 * rendering on the server: no way to tell a slow navigation from a missed click.
 */
describe("route loading states", () => {
  const files = ["src/app/[lang]/loading.tsx", "src/app/[lang]/news/loading.tsx"];

  it.each(files)("%s exists", (file) => {
    expect(existsSync(path.join(process.cwd(), file))).toBe(true);
  });

  it.each(files)("%s respects a reader who asked for less motion", (file) => {
    const source = read(file);
    const animations = source.match(/[\w:-]*animate-[\w-]+/g) || [];
    expect(animations.length).toBeGreaterThan(0);
    for (const className of animations) {
      expect(className.startsWith("motion-safe:")).toBe(true);
    }
  });

  it.each(files)("%s says nothing, because it cannot know the language", (file) => {
    // loading.tsx takes no params, so it cannot tell /en from /fr. A skeleton
    // that announces itself in the wrong language is worse than a silent one,
    // and the App Router's route announcer still reads the title on arrival.
    expect(read(file)).toContain('aria-hidden="true"');
  });
});

/**
 * One announcement, two publishers, two of the twelve slots.
 *
 * The live strip deduplicated on `${href}|${title}`, a key strictly narrower
 * than the href alone: adding the title to a key that already holds the URL
 * can only split groups, never merge them. So the same story carried by two
 * blogs was never merged, and on 8 November 2026 /fr/news showed "Gemini Omni
 * 1.2 Flash: Fast and cost-effective with longer clips" twice, labelled
 * DeepMind Blog and Google AI Blog, at two URLs. Google and DeepMind cross-post
 * constantly, as do the AWS and Azure blogs; this is the normal case.
 */
describe("the same story from two sources", () => {
  const SOURCE = read("src/lib/live-news.ts");

  it("no longer keys on a URL it has already keyed on", () => {
    expect(SOURCE).not.toMatch(/`\$\{item\.href\}\|\$\{item\.title\}`/);
    expect(SOURCE).toMatch(/const key = item\.href\.toLowerCase\(\);/);
  });

  it("collapses a cross-post to one entry", () => {
    const title = "Gemini Omni 1.2 Flash: Fast and cost-effective with longer clips";
    expect(titleKey(title)).toBe(titleKey(title.toUpperCase()));
    // The re-post is rarely character-identical: a different dash, a curly
    // quote, an accent typed or not.
    expect(titleKey("Gemini Omni 1.2 Flash — Fast, cost-effective")).toBe(
      titleKey("Gemini Omni 1.2 Flash - Fast cost effective")
    );
    expect(titleKey("Évaluation des modèles")).toBe(titleKey("Evaluation des modeles"));
  });

  it("keeps two genuinely different headlines apart", () => {
    expect(titleKey("Gemini Omni 1.2 Flash")).not.toBe(titleKey("Gemini Omni 1.3 Flash"));
    expect(titleKey("")).toBe("");
  });

  it("keeps the first publisher, not the first feed read", () => {
    // Deduplicating before the sort would keep whichever feed happened to be
    // fetched first; after it, the earliest publication wins.
    const sortIndex = SOURCE.indexOf("const sorted = Array.from(deduped.values())");
    const titleDedupeIndex = SOURCE.indexOf("const byTitle = new Map<string, LiveNewsItem>()");
    expect(sortIndex).toBeGreaterThan(-1);
    expect(titleDedupeIndex).toBeGreaterThan(sortIndex);
    // And the deduplicated list is the one that actually reaches the reader.
    expect(SOURCE).toMatch(/const candidatePool = recent\.length \? recent : unique;/);
  });
});
