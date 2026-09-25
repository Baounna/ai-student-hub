#!/usr/bin/env node
/**
 * The resolved version of every package in a lockfile.
 *
 * The watchdog repairs an out-of-sync lockfile unattended and pushes the result
 * to main. The repair itself is verified -- npm ci, lint, typecheck, tests and
 * build all have to pass first -- but "the suite passes" is not the same claim
 * as "nothing was upgraded". `npm install --package-lock-only` is free to move
 * any dependency to a newer version inside its semver range, and a green suite
 * on a freshly published patch says only that the patch did not break the site.
 *
 * This repo pins all 23 workflow actions to 40-character SHAs precisely so that
 * no third party can change what CI runs without a commit somebody reviewed.
 * A self-heal that quietly bumps npm dependencies on the same branch undoes
 * that from the other end. So the repair now has to show that it only fixed the
 * lockfile's structure, and that every version came out where it went in.
 *
 *   node scripts/lockfile-versions.mjs [path]     print path -> version, sorted
 *   node scripts/lockfile-versions.mjs --diff a b exit 1 if any version moved
 */
import fs from "node:fs/promises";

/**
 * Keyed by the lockfile's own package path ("node_modules/next"), not by bare
 * name: the same package legitimately appears at several paths with different
 * versions, and collapsing them to a name would hide a change at one path
 * behind an unchanged version at another.
 */
export function readLockVersions(text) {
  const lock = JSON.parse(text);
  const out = {};
  for (const [pkgPath, meta] of Object.entries(lock.packages || {})) {
    if (!pkgPath) continue; // the root project, whose version is not a dependency
    if (meta && typeof meta.version === "string") out[pkgPath] = meta.version;
  }
  return out;
}

export function diffLockVersions(before, after) {
  const changed = [];
  for (const [pkgPath, version] of Object.entries(before)) {
    if (!(pkgPath in after)) changed.push({ pkgPath, from: version, to: "(removed)" });
    else if (after[pkgPath] !== version) changed.push({ pkgPath, from: version, to: after[pkgPath] });
  }
  for (const [pkgPath, version] of Object.entries(after)) {
    if (!(pkgPath in before)) changed.push({ pkgPath, from: "(added)", to: version });
  }
  return changed.sort((a, b) => a.pkgPath.localeCompare(b.pkgPath));
}

// Only run the CLI when invoked directly, so the tests can import the functions.
if (process.argv[1] && process.argv[1].endsWith("lockfile-versions.mjs")) {
  const argv = process.argv.slice(2);
  if (argv[0] === "--diff") {
    const [, a, b] = argv;
    if (!a || !b) {
      console.error("usage: lockfile-versions.mjs --diff <before.json> <after.json>");
      process.exit(2);
    }
    const changed = diffLockVersions(
      readLockVersions(await fs.readFile(a, "utf8")),
      readLockVersions(await fs.readFile(b, "utf8"))
    );
    if (!changed.length) {
      console.log("No dependency version changed. The repair was structural.");
      process.exit(0);
    }
    console.error(`The repair moved ${changed.length} package version(s):\n`);
    for (const c of changed) console.error(`  ${c.pkgPath}: ${c.from} -> ${c.to}`);
    console.error("\nThat is a dependency upgrade, not a lockfile repair. Not pushing it unreviewed.");
    process.exit(1);
  }
  const path = argv[0] || "package-lock.json";
  console.log(JSON.stringify(readLockVersions(await fs.readFile(path, "utf8")), null, 2));
}
