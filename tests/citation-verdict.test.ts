import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs script, no types
import { citationVerdict } from "../scripts/lib/citation-verdict.mjs";

/**
 * The expensive mistake a link checker makes is reporting a page as dead
 * because a publisher would not serve it to a script. Twenty-five "broken"
 * citations were reported on this content once; every one of them answered 200
 * to a browser. The hours went into chasing them instead of into the five that
 * had genuinely moved.
 *
 * So "could not read it" is its own verdict here, and these tests pin the line
 * between it and "it is not there".
 */
const verdict = (href: string, status: number, finalUrl = href) =>
  citationVerdict({ href, status, finalUrl }) as { level: string; detail: string };

describe("citation verdict", () => {
  it("accepts a page that answers at the address we cited", () => {
    expect(verdict("https://owasp.org/Top10/", 200).level).toBe("ok");
  });

  it("treats a trailing slash, www and https as the same page", () => {
    expect(verdict("http://owasp.org/Top10", 200, "https://www.owasp.org/Top10/").level).toBe("ok");
  });

  it("treats a locale prefix as the same page", () => {
    // MDN answers /docs/Web/HTTP/Status with /en-US/docs/Web/HTTP/Status and
    // means no change whatsoever. Reporting that as moved would be noise on
    // every run, which is how a check stops being read.
    expect(verdict("https://developer.mozilla.org/docs/Web/HTTP/Status", 200,
      "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status").level).toBe("ok");
  });

  it("treats a case-only path rewrite as the same page", () => {
    // sqlite.org answers /lang_UPSERT.html with /lang_upsert.html. Paths really
    // are case-sensitive -- but a server redirecting one to the other is the
    // server saying they are the same thing.
    expect(verdict("https://www.sqlite.org/lang_UPSERT.html", 200,
      "https://sqlite.org/lang_upsert.html").level).toBe("ok");
  });

  it("treats .html answered by a directory as the same page", () => {
    expect(verdict("https://expressjs.com/en/resources/middleware/body-parser.html", 200,
      "https://expressjs.com/en/resources/middleware/body-parser/").level).toBe("ok");
  });

  it("reports a redirect onto the site's front page as moved", () => {
    const result = verdict("https://example.com/blog/2024/agents", 200, "https://example.com/");
    expect(result.level).toBe("moved");
    expect(result.detail).toMatch(/redirected off the page/);
  });

  it("reports a redirect to a bare section index as moved", () => {
    const result = verdict("https://example.com/docs/guides/eval", 200, "https://example.com/docs");
    expect(result.level).toBe("moved");
  });

  it("reports a redirect to another specific page as moved, but says it differently", () => {
    // The material is usually still there under the new address, so the person
    // reading this needs to know which of the two situations they are in.
    const result = verdict("https://example.com/docs/a/eval", 200, "https://example.com/docs/b/eval");
    expect(result.level).toBe("moved");
    expect(result.detail).toMatch(/different page/);
    expect(result.detail).not.toMatch(/off the page/);
  });

  it("reports 404 and 410 as gone", () => {
    expect(verdict("https://example.com/x", 404).level).toBe("gone");
    expect(verdict("https://example.com/x", 410).level).toBe("gone");
  });

  it("never calls a refusal, a rate limit or a server error a dead link", () => {
    for (const status of [403, 429, 500, 502, 503]) {
      const result = verdict("https://example.com/x", status);
      expect(result.level, `HTTP ${status}`).toBe("check");
      expect(result.detail).toMatch(/proves nothing either way/);
    }
  });

  it("never calls a timeout a dead link", () => {
    const result = verdict("https://example.com/x", 0, "");
    expect(result.level).toBe("check");
    expect(result.detail).toBe("no response");
  });

  it("sends an unparseable href to a person rather than guessing", () => {
    expect(verdict("not a url", 200).level).toBe("check");
  });

  it("does not call a whole-site move a dead page", () => {
    // docs.example.com/guide answering as example.com/guide is the site moving,
    // not this page, and the citation still lands on what it cited.
    expect(verdict("https://docs.example.com/guide", 200, "https://example.com/guide").level).toBe("ok");
  });

  it("still reports a move when the host changes to an unrelated one", () => {
    const result = verdict("https://ragas.io/docs/metrics", 200, "https://vibrantlabs.ai/");
    expect(result.level).toBe("moved");
  });
});
