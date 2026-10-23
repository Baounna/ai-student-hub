import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The newsletter form lives in the footer of the locale layout, so whatever it
 * mounts, it mounts on all 469 pages of the site.
 *
 * It used to mount Cloudflare's Turnstile challenge there unconditionally: a
 * third-party DNS lookup, a TLS handshake, roughly 80 kB of script and an
 * iframe on /privacy, on /terms and on every news brief, plus a cross-origin
 * preload racing three font files for the page's first connections. That is
 * more than every byte of first-party client JavaScript on this site put
 * together. Verified by grepping the served HTML of a production build:
 * "challenges.cloudflare.com" appeared on /en, /en/blog, /en/stages, /en/news,
 * /en/resources, /en/privacy and /en/terms, and after the fix on none of them.
 *
 * A build grep is the real proof and it needs a server, so this holds the
 * source-level invariants that would quietly undo it: the widget behind the
 * interaction gate, the gate reachable without a pointer, and the submit button
 * still refusing to send without a token.
 */
const file = (p: string) => readFileSync(path.join(process.cwd(), p), "utf8");

const form = file("src/components/newsletter-form.tsx");
const widget = file("src/components/ui/turnstile-widget.tsx");
const localeLayout = file("src/app/[lang]/layout.tsx");

describe("the newsletter form's bot challenge", () => {
  it("is still rendered on every page, which is the whole reason for the gate", () => {
    // If this ever stops being true the gate is no longer load-bearing, and
    // whoever reads this test should know that before simplifying it away.
    expect(localeLayout).toMatch(/<Newsletter compact/);
  });

  it("mounts the widget only once the reader has reached for the form", () => {
    const mounts = form.match(/<TurnstileWidget/g) || [];
    expect(mounts).toHaveLength(1);

    const gate = form.indexOf("botProtectionEnabled && armed");
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(form.indexOf("<TurnstileWidget"));
  });

  it("arms on focus, not only on a tap, so a keyboard reader gets a challenge", () => {
    expect(form).toContain("onFocus={armBotProtection}");
    expect(form).toContain("onTouchStart={armBotProtection}");
  });

  it("arms on a change with no focus, which is what a password manager does", () => {
    // Autofilled from the manager's own UI, the field can be populated without
    // ever being focused. That reader would otherwise press the button on an
    // unarmed form and collect a 403 for a challenge never offered.
    const onChange = form.slice(form.indexOf("onChange={(event) => {", form.indexOf('type="email"')));
    expect(onChange.slice(0, 200)).toContain("armBotProtection()");
  });

  it("keeps the submit gate exactly where it was", () => {
    // The point of the change is when the challenge loads, not whether it is
    // enforced. Nobody subscribes without a token.
    expect(form).toContain("const canSubmit = !botProtectionEnabled || Boolean(botToken);");
    expect(form).toContain("disabled={status === \"loading\" || !canSubmit}");
  });

  it("explains the disabled button before the challenge exists", () => {
    // "Tick the box above to enable the button" is the caption once the widget
    // is up. Shown before it, it names a box the reader cannot find.
    const unarmed = form.indexOf("botProtectionEnabled && !armed");
    expect(unarmed).toBeGreaterThan(-1);
    expect(unarmed).toBeLessThan(form.indexOf("botProtectionEnabled && armed"));
  });

  it("loads Cloudflare's script from inside the gated widget and nowhere else", () => {
    expect(widget).toContain("https://challenges.cloudflare.com/turnstile/v0/api.js");
    // No hand-written preload: the only reference is the Script tag that now
    // mounts on interaction, so Next has nothing to hint in the page's head.
    expect(widget).not.toMatch(/rel="preload"/);
    expect(localeLayout).not.toContain("challenges.cloudflare.com");
  });
});
