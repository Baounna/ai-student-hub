import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * A workflow that builds the site has to hand the build its config.
 *
 * `next build` runs with NODE_ENV=production, which trips the production
 * validation in src/lib/env-validation.ts, so every workflow that builds needs
 * the throwaway SITE_URL placeholders. CI, the link check and the watchdog all
 * carry that block. The internship finder was written last and did not.
 *
 * It failed on its first scheduled run, 15 October, and every run after. The
 * failure was not in the finder: discovery worked and the rows were built, then
 * the verify step threw before the commit step it gates, so the agent never
 * once added a listing from CI. Six days went into looking for a bug in the
 * script while the script was fine, and a watchdog line that was red for an
 * unrelated reason hid it.
 *
 * One block, four places to get it right, and nothing checking they matched.
 *
 * Read as text rather than parsed: js-yaml is only a transitive dependency
 * here, and this repository's lockfile has to be regenerated inside a node:24
 * container, which is too much to spend on a parser for a presence check. The
 * cost is that a key in the wrong job would satisfy this -- the failure it
 * guards against was an absent block, not a misplaced one.
 */
const DIR = ".github/workflows";
const REQUIRED = ["SITE_URL", "NEXT_PUBLIC_SITE_URL"];

const workflows = readdirSync(DIR)
  .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
  .map((name) => ({ name, text: readFileSync(path.join(DIR, name), "utf8") }));

const builders = workflows.filter(({ text }) => /^\s*(?:-\s*)?(?:run:\s*)?npm run build\b/m.test(text));

describe("workflow build environment", () => {
  it("finds the build workflows it is meant to be checking", () => {
    // Without this, renaming the script would make the check below vacuously
    // pass on an empty list.
    expect(workflows.length).toBeGreaterThan(0);
    expect(builders.length).toBeGreaterThanOrEqual(4);
  });

  it("gives every building workflow the config the production build demands", () => {
    const missing = builders
      .map(({ name, text }) => {
        const absent = REQUIRED.filter((key) => !new RegExp(`^\\s*${key}:\\s*\\S`, "m").test(text));
        return absent.length ? `${name}: ${absent.join(", ")}` : "";
      })
      .filter(Boolean);

    expect(missing).toEqual([]);
  });

  it("sets those placeholders to something the validator accepts", () => {
    // https and not localhost, or the build throws anyway and the block is
    // decoration.
    for (const { name, text } of builders) {
      const value = text.match(/^\s*SITE_URL:\s*(\S+)/m)?.[1];
      expect(value, name).toMatch(/^https:\/\//);
      expect(value, name).not.toMatch(/localhost|127\.0\.0\.1/);
    }
  });
});
