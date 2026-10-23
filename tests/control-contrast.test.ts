import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The edge of a control, measured rather than eyeballed.
 *
 * --control-border exists because --border is a divider colour and was being
 * used to draw text fields and filter chips: 1.35:1 against --surface, 1.29:1
 * against the page ground. WCAG 1.4.11 asks 3:1 for the boundary of a control
 * and exempts only inactive or browser-default ones, which none of these are.
 *
 * The token was introduced at #848c75 and cleared 3:1 against every surface it
 * was checked against -- but not against --surface-strong, which nobody
 * checked, and which is what the desktop header search box sits on. It came
 * out at 2.99:1: a hundredth short, on a control present on every page of the
 * site. A number that close to the bar is exactly the kind that gets written
 * down once and never recomputed, so it is computed here instead, from the
 * literal hex values in the stylesheet, in both themes.
 *
 * The listed grounds are every background this token is actually drawn on:
 * --surface (.field-input, .search-input, .blog-chip and the keyword filter),
 * --surface-strong (.header-search-shell and the floating CTA cards),
 * --bg (the unfilled filter chips on /stages) and --bg-soft.
 */
const CSS = readFileSync("src/app/globals.css", "utf8");

function tokens(blockStart: string): Record<string, string> {
  const start = CSS.indexOf(blockStart);
  expect(start, `${blockStart} is no longer in globals.css`).toBeGreaterThan(-1);
  const block = CSS.slice(start, CSS.indexOf("\n}", start));
  const found: Record<string, string> = {};
  for (const [, name, hex] of block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    found[name] = hex.toLowerCase();
  }
  return found;
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const THEMES = {
  light: tokens(":root {"),
  dark: tokens('html[data-theme="dark"] {')
};

// Every background --control-border is drawn against, anywhere on the site.
const GROUNDS = ["surface", "surface-strong", "bg", "bg-soft"] as const;

describe("the control border", () => {
  it("is defined in both themes", () => {
    for (const [name, theme] of Object.entries(THEMES)) {
      expect(theme["control-border"], `${name} has no --control-border`).toMatch(/^#[0-9a-f]{6}$/);
      for (const ground of GROUNDS) expect(theme[ground], `${name} has no --${ground}`).toBeTruthy();
    }
  });

  it("clears 3:1 on every surface it is drawn on, in both themes", () => {
    for (const [name, theme] of Object.entries(THEMES)) {
      for (const ground of GROUNDS) {
        const measured = ratio(theme["control-border"], theme[ground]);
        expect(
          measured,
          `${name}: --control-border on --${ground} is ${measured.toFixed(2)}:1, under the 3:1 WCAG 1.4.11 asks of a control's boundary`
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  /**
   * The failing pair, named, so the fix cannot quietly come undone.
   *
   * This is the one that was at 2.99:1. Asserting it separately is not
   * redundant: it says which surface the token was last widened for, so the
   * next person to adjust it knows what the binding constraint is rather than
   * reading a generic failure.
   */
  it("clears it with room on --surface-strong, which is the tightest pair", () => {
    expect(ratio(THEMES.light["control-border"], THEMES.light["surface-strong"])).toBeGreaterThan(3.02);
  });
});

describe("the controls that are drawn with it", () => {
  it("includes .btn-secondary, whose fill is invisible against the page", () => {
    // In light, --surface is already #ffffff, so .btn-secondary's gradient
    // resolves to pure white: 1.04:1 against the #fbfaf7 page. The border is
    // the only thing marking the edge of "View the offer" on all 94 internship
    // rows, and it was a mix of --border and --text at 1.46:1.
    const block = CSS.slice(CSS.indexOf("  .btn-secondary {"));
    expect(block.slice(0, 400)).toMatch(/border-color: var\(--control-border\);/);
  });

  it("includes every filter control on the internship board", () => {
    const board = readFileSync("src/app/[lang]/stages/page.tsx", "utf8");
    // The chips are drawn from one helper now; its inactive branch and the
    // keyword input are the two places the token has to appear.
    expect(board).toContain("border-[color:var(--control-border)]");
    // And nowhere may a chip or the input fall back to the divider colour.
    // --border is still right for the rules between listings, which is why
    // this looks only at the bordered controls.
    expect(board, "a filter control went back to the divider colour").not.toMatch(
      /rounded-full border border-\[color:var\(--border\)\]/
    );
  });

  it("includes the country pages' chips", () => {
    const country = readFileSync("src/app/[lang]/stages/[country]/page.tsx", "utf8");
    expect(country).not.toMatch(/rounded-full border border-\[color:var\(--border\)\]/);
    expect(country).toContain("border-[color:var(--control-border)]");
  });
});

describe("the focus ring", () => {
  it("covers elements made focusable by hand, not just the native controls", () => {
    // The ring's selector listed a, button, input, textarea, select and
    // .reading-prose pre. Anything given a tabindex by hand -- the horizontal
    // scrollers around the comparison tables -- took the browser default
    // instead, which is the one outline on the page nobody chose.
    const block = CSS.slice(CSS.indexOf("  a:focus-visible,"));
    expect(block.slice(0, 1200)).toContain('[tabindex="0"]:focus-visible');
  });
});
