import { describe, it, expect } from "vitest";
// @ts-expect-error -- plain .mjs script helper, no types
import { visibleText } from "../scripts/lib/visible-text.mjs";

const GONE = "Cette offre n'est plus disponible";

describe("visibleText", () => {
  it("returns the prose of a well-formed document", () => {
    expect(visibleText(`<div class="a b"><p>${GONE}</p></div>`)).toBe(GONE);
  });

  describe("keeps text a browser shows", () => {
    // Each of these blanked the whole document under the regex that treated an
    // apostrophe as opening a quoted value wherever it appeared. A dead listing
    // whose page said so then passed as open.
    it.each([
      ["apostrophe in an unquoted attribute value", `<a href=/stage/l'offre>${GONE}</a>`],
      ["apostrophe earlier in the document", `<nav data-label=Offres d'emploi></nav><p>${GONE}</p>`],
      ["unterminated single-quoted value", `<div class='a><p>${GONE}</p>`],
      ["unterminated double-quoted value", `<div class="a><p>${GONE}</p>`],
      ["apostrophe in an attribute name", `<div data-l'x=1><p>${GONE}</p></div>`],
      // Two quote-opening apostrophes that pair up across elements: the naive
      // reading makes the first one's value swallow everything between them.
      ["quotes that pair across elements", `<div class='a><p>${GONE}</p><span title='b'>`],
      ["double quotes that pair across elements", `<div class="a><p>${GONE}</p><span title="b">`]
    ])("%s", (_label, html) => {
      expect(visibleText(html)).toContain(GONE);
    });
  });

  describe("drops text a browser does not show", () => {
    it.each([
      [">" + " inside a comment", `<!-- a > b --><p>${GONE}</p>`, "b -->"],
      [">" + " inside an attribute", `<a title="a > b">${GONE}</a>`, 'b">'],
      ["script contents", `<script>var x = "${GONE}";</script><p>ok</p>`, GONE],
      ["style contents", `<style>/* ${GONE} */</style><p>ok</p>`, GONE],
      // Single-page job boards ship an "offer expired" template that is only
      // cloned when it applies. Rendering it made live jobs look dead.
      ["template contents", `<template><p>${GONE}</p></template><p>ok</p>`, GONE],
      ["a doctype", `<!DOCTYPE html><p>ok</p>`, "DOCTYPE"],
      ["an xml declaration", `<?xml version="1.0"?><p>ok</p>`, "xml"]
    ])("%s", (_label, html, absent) => {
      expect(visibleText(html)).not.toContain(absent);
    });
  });

  it("ends a script at the close tag even inside a string", () => {
    // Every browser does this too, so matching it is correct, not a shortcut.
    expect(visibleText(`<script>var s = "</script>";</script><p>${GONE}</p>`)).toContain(GONE);
  });

  it("keeps a lone < that is not a tag", () => {
    expect(visibleText("<p>5 < 6 and 7 > 6</p>")).toBe("5 < 6 and 7 > 6");
  });

  it("separates elements so adjacent words do not merge", () => {
    expect(visibleText("<p>offre</p><p>expiree</p>")).toBe("offre expiree");
  });

  it("survives truncated markup", () => {
    expect(visibleText(`<p>${GONE}`)).toBe(GONE);
    expect(visibleText(`<p>${GONE}</p><div class="x`)).toBe(GONE);
    expect(visibleText("<!-- never closed")).toBe("");
  });

  it("stays linear on input built to make a regex backtrack", () => {
    const started = Date.now();
    visibleText(`<div ${'x="y" '.repeat(20000)}>${GONE}`);
    visibleText(`<div class='${"a".repeat(200000)}`);
    visibleText(`${'<a href="'.repeat(20000)}>${GONE}`);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("handles a real page shape", () => {
    const html = `<!DOCTYPE html><html><head><title>Stage</title>
      <script>window.__DATA__ = {"status":"closed"};</script>
      <style>.a{content:"> "}</style></head>
      <body><nav data-label=Offres d'emploi><a href="/x">Emplois</a></nav>
      <main><h1>Stage IA</h1><p>${GONE}</p></main>
      <!-- tracking: a > b --></body></html>`;
    const text = visibleText(html);

    expect(text).toContain(GONE);
    expect(text).toContain("Stage IA");
    expect(text).not.toContain("__DATA__");
    expect(text).not.toContain("tracking");
  });
});
