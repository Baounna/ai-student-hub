import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * A workflow that commits rendered content has to verify it first, because
 * nothing else will.
 *
 * GitHub does not trigger workflows from a push made with the default
 * GITHUB_TOKEN. So CI never runs on a commit an agent pushes — not "later",
 * not at all. Checked on a real day: three agent commits landed on main and
 * the only CI run that existed was for the last human one.
 *
 * check-stages.yml and find-stages.yml both run typecheck, test and build
 * before their commit step, which is the only reason that is safe. The content
 * agents — auto-news twice a day, the operator weekly, the master pipeline on
 * demand — all staged src/content/auto-news.json with no gate at all. A feed
 * that produced malformed content would have reached Vercel unverified; the
 * live site would have held the last good build and nobody would have been
 * told for up to three days, until the watchdog's freshness limit noticed.
 *
 * Anything staging only docs/ is exempt: it is not rendered and cannot break a
 * build.
 */
const DIR = ".github/workflows";

const workflows = readdirSync(DIR)
  .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
  .map((name) => ({ name, text: readFileSync(path.join(DIR, name), "utf8") }));

/** Workflows whose `git add` touches anything the site renders. */
const committers = workflows.filter(({ text }) =>
  [...text.matchAll(/^\s*git add .*$/gm)].some((m) => /\bsrc\//.test(m[0])) ||
  // agents-master builds its paths into a variable first.
  [...text.matchAll(/^\s*echo "TARGET_PATHS=.*$/gm)].some((m) => /\bsrc\//.test(m[0]))
);

describe("workflow commit gate", () => {
  it("finds the workflows that commit rendered content", () => {
    // Without this, a rename would make the check below vacuously pass.
    expect(committers.length).toBeGreaterThanOrEqual(5);
  });

  it.each(["npm run typecheck", "npm test", "npm run build"])(
    "every such workflow runs %s before committing",
    (command) => {
      const missing = committers
        .filter(({ text }) => !text.includes(command))
        .map(({ name }) => name);
      expect(missing).toEqual([]);
    }
  );

  it("runs the build before the commit, not after it", () => {
    const wrongOrder = committers
      .filter(({ text }) => {
        const build = text.indexOf("npm run build");
        const firstAdd = text.search(/^\s*git add /m);
        return build === -1 || firstAdd === -1 || build > firstAdd;
      })
      .map(({ name }) => name);
    expect(wrongOrder).toEqual([]);
  });
});
