import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Public config and its documentation have to describe the same site.
 *
 * Both directions have already cost something here. src/config/site.ts carries
 * a comment about the first: primaryUrl, stripeUrl, koFiUrl and
 * githubSponsorsUrl were defined and consumed nowhere — "config that invites
 * someone to go and create a Ko-fi account for a field no page would render".
 * NEXT_PUBLIC_ANTIGRAVITY_URL was the same thing in .env.example, offering an
 * override for a value nothing reads.
 *
 * The other direction is worse: NEXT_PUBLIC_DONATION_CURRENCY decides what a
 * donate button charges, and it existed only in the single line that read it.
 * Nobody deploying this site would have known it was settable, which for a
 * money path means the default was effectively the only value.
 *
 * Scoped to NEXT_PUBLIC_ deliberately. Those are the site's own public
 * configuration and the symmetry is a real invariant. Server-side names are
 * not: CI, NODE_ENV and the GITHUB_* family come from the runner and have no
 * business in an example file, and several are read through computed names
 * like `AFFILIATE_${index}_NAME`, which no text scan can resolve.
 */
const ENV_EXAMPLE = ".env.example";
const SCAN_ROOTS = ["src", "scripts"];
const PUBLIC_NAME = /NEXT_PUBLIC_[A-Z0-9_]+/g;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx|mjs|js)$/.test(entry)) out.push(full);
  }
  return out;
}

const code = sourceFiles(".").length
  ? SCAN_ROOTS.flatMap(sourceFiles)
      .map((file) => readFileSync(file, "utf8"))
      .join("\n")
  : "";

const documented = new Set(
  readFileSync(ENV_EXAMPLE, "utf8")
    .split("\n")
    .map((line) => line.match(/^(NEXT_PUBLIC_[A-Z0-9_]+)=/)?.[1])
    .filter((name): name is string => Boolean(name))
);

// Locale-suffixed pairs are read through one base name, so credit the base.
const read = new Set(
  [...code.matchAll(PUBLIC_NAME)].map((m) => m[0]).flatMap((name) => [name, `${name}_EN`, `${name}_FR`])
);

describe("public env parity", () => {
  it("finds both sides, so the comparison means something", () => {
    expect(documented.size).toBeGreaterThan(5);
    expect([...read].length).toBeGreaterThan(5);
  });

  it("documents every public setting the code reads", () => {
    const undocumented = [...read]
      .filter((name) => code.includes(`"${name}"`) || code.includes(`.${name}`))
      .filter((name) => !documented.has(name) && !documented.has(`${name}_EN`));
    expect(undocumented).toEqual([]);
  });

  it("offers no public setting that nothing reads", () => {
    expect([...documented].filter((name) => !read.has(name))).toEqual([]);
  });
});
