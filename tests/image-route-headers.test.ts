import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs config, no types
import config from "../next.config.mjs";

/**
 * Social cards and article images have to be indexable.
 *
 * Every social card is /api/og and every article image is /api/cover, and the
 * /api/:path* catch-all was serving them "X-Robots-Tag: noindex, nofollow".
 * This was the other half of a bug already half fixed: robots.ts was changed to
 * let crawlers FETCH these, and the first thing they read when they did was an
 * instruction to ignore them. `image` is the one Article property Google
 * actually renders, so no page could become a search thumbnail or a Discover
 * card, and nothing on the site was eligible for Google Images.
 *
 * It stayed invisible for a reason worth remembering: LinkedIn, Facebook and X
 * do not honour X-Robots-Tag, so every social preview anyone tested by hand
 * worked perfectly.
 *
 * Measured while fixing it: listing the image rules BEFORE the catch-all
 * changes nothing, because a later matching rule wins. Hence an explicit
 * positive value after it. This test reads the resolved rules rather than the
 * file's text, because four source-text assertions in this repository have
 * already failed on changes that were correct.
 */
type HeaderRule = { source: string; headers: { key: string; value: string }[] };

const robots = (rule: HeaderRule | undefined) =>
  rule?.headers.find((h) => h.key.toLowerCase() === "x-robots-tag")?.value;

describe("image route headers", () => {
  it("declares the image routes after the catch-all that would noindex them", async () => {
    const rules: HeaderRule[] = await config.headers();
    const catchAll = rules.findIndex((r) => r.source === "/api/:path*");
    const og = rules.findIndex((r) => r.source === "/api/og");
    const cover = rules.findIndex((r) => r.source === "/api/cover/:path*");

    expect(catchAll, "the /api catch-all should still exist").toBeGreaterThan(-1);
    expect(og, "/api/og needs its own rule").toBeGreaterThan(catchAll);
    expect(cover, "/api/cover needs its own rule").toBeGreaterThan(catchAll);
  });

  it("lets crawlers index the images", async () => {
    const rules: HeaderRule[] = await config.headers();
    for (const source of ["/api/og", "/api/cover/:path*"]) {
      const value = robots(rules.find((r) => r.source === source));
      expect(value, `${source} must override the catch-all explicitly`).toBe("all");
    }
  });

  it("still keeps every other API route out of the index", async () => {
    const rules: HeaderRule[] = await config.headers();
    expect(robots(rules.find((r) => r.source === "/api/:path*"))).toBe("noindex, nofollow");
  });

  it("lets the images be embedded on other domains", async () => {
    // An image whose whole job is to render inside LinkedIn or a search result
    // should not carry a same-origin resource policy.
    const rules: HeaderRule[] = await config.headers();
    for (const source of ["/api/og", "/api/cover/:path*"]) {
      const corp = rules
        .find((r) => r.source === source)
        ?.headers.find((h) => h.key === "Cross-Origin-Resource-Policy")?.value;
      expect(corp, source).toBe("cross-origin");
    }
  });
});
