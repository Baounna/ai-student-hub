import { describe, it, expect } from "vitest";
import { newsBriefs } from "@/content/news";
import { posts } from "@/content/posts";
import { locales } from "@/i18n/config";
import { buildFeed } from "@/lib/feed";
import { feedPath } from "@/lib/feed-paths";

/**
 * Not a full XML parse -- the repo has no parser and this is not worth a
 * dependency. It catches the two ways hand-built XML actually breaks: an
 * ampersand that is not part of an entity, and an element that never closes.
 */
function xmlComplaints(xml: string) {
  const complaints: string[] = [];

  const strayAmp = xml.match(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g);
  if (strayAmp) complaints.push(`${strayAmp.length} unescaped ampersand(s)`);

  const opened = new Map<string, number>();
  for (const [, closing, name, selfClosing] of xml.matchAll(/<(\/?)([a-zA-Z][\w:.-]*)[^>]*?(\/?)>/g)) {
    if (name.startsWith("?") || selfClosing === "/") continue;
    opened.set(name, (opened.get(name) ?? 0) + (closing === "/" ? -1 : 1));
  }
  for (const [name, depth] of opened) {
    if (depth !== 0) complaints.push(`<${name}> unbalanced by ${depth}`);
  }

  return complaints;
}

describe("buildFeed", () => {
  it.each(locales)("produces well-formed XML for %s", (locale) => {
    expect(xmlComplaints(buildFeed(locale))).toEqual([]);
  });

  it.each(locales)("declares %s as its own language", (locale) => {
    expect(buildFeed(locale)).toContain(`<language>${locale}</language>`);
  });

  it.each(locales)("points rel=self at its own path for %s", (locale) => {
    const xml = buildFeed(locale);
    const self = xml.match(/<atom:link href="([^"]+)" rel="self"/);

    expect(self).not.toBeNull();
    expect(self?.[1]).toContain(feedPath[locale]);
    // The French feed pointing at /feed.xml is the specific bug this guards:
    // a reader handed a copy could never re-find the feed it came from.
    expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
  });

  it("links the French feed to French pages only", () => {
    const links = [...buildFeed("fr").matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1]);
    const items = links.slice(1); // the first <link> is the channel's own

    expect(items.length).toBeGreaterThan(0);
    expect(items.filter((href) => !href.includes("/fr/"))).toEqual([]);
  });

  it("carries the site's own writing and none of the auto briefs", () => {
    const xml = buildFeed("en");

    expect((xml.match(/<item>/g) || []).length).toBe(posts.length + newsBriefs.length);
    // Those pages are noindex near-duplicates of other people's summaries; 60
    // of them used to sit above every original post in date order.
    expect(xml).not.toContain("/news/auto/");
    expect(xml).not.toContain("[Auto]");
  });

  it("dates lastBuildDate from the newest item, not the request", () => {
    const xml = buildFeed("en");
    const lastBuild = xml.match(/<lastBuildDate>([^<]+)<\/lastBuildDate>/)?.[1];
    const firstItem = xml.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1];

    expect(lastBuild).toBe(firstItem);
  });

  it("orders items newest first", () => {
    const dates = [...buildFeed("en").matchAll(/<pubDate>([^<]+)<\/pubDate>/g)].map((m) =>
      Date.parse(m[1])
    );

    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it("escapes markup that arrives in a title or summary", () => {
    const xml = locales.map((locale) => buildFeed(locale)).join("");
    const insideText = [...xml.matchAll(/<(?:title|description)>([^<]*)<\/(?:title|description)>/g)];

    expect(insideText.length).toBeGreaterThan(0);
    for (const [, text] of insideText) {
      expect(text).not.toMatch(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/);
    }
  });
});
