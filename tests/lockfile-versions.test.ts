import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs script, no types
import { readLockVersions, diffLockVersions } from "../scripts/lockfile-versions.mjs";

const lock = (packages: Record<string, unknown>) =>
  JSON.stringify({ name: "blog", lockfileVersion: 3, packages });

/**
 * The watchdog repairs a broken lockfile unattended and pushes to main. These
 * two functions are the only thing separating "it fixed the structure" from
 * "it upgraded twelve dependencies and the suite happened to pass".
 */
describe("lockfile version comparison", () => {
  it("ignores the root project, which has no dependency version", () => {
    const versions = readLockVersions(lock({ "": { version: "0.1.0" }, "node_modules/next": { version: "16.3.6" } }));
    expect(versions).toEqual({ "node_modules/next": "16.3.6" });
  });

  it("sees no change when the repair was structural", () => {
    // A real repair fixes fields like integrity or resolved and leaves versions be.
    const before = readLockVersions(lock({ "node_modules/next": { version: "16.3.6" } }));
    const after = readLockVersions(
      lock({ "node_modules/next": { version: "16.3.6", integrity: "sha512-restored", resolved: "https://x" } })
    );
    expect(diffLockVersions(before, after)).toEqual([]);
  });

  it("catches a version that moved inside its semver range", () => {
    const before = readLockVersions(lock({ "node_modules/next": { version: "16.3.5" } }));
    const after = readLockVersions(lock({ "node_modules/next": { version: "16.3.6" } }));
    expect(diffLockVersions(before, after)).toEqual([
      { pkgPath: "node_modules/next", from: "16.3.5", to: "16.3.6" }
    ]);
  });

  it("catches an added and a removed package", () => {
    const before = readLockVersions(lock({ "node_modules/gone": { version: "1.0.0" } }));
    const after = readLockVersions(lock({ "node_modules/new": { version: "2.0.0" } }));
    expect(diffLockVersions(before, after)).toEqual([
      { pkgPath: "node_modules/gone", from: "1.0.0", to: "(removed)" },
      { pkgPath: "node_modules/new", from: "(added)", to: "2.0.0" }
    ]);
  });

  // The same package appears at several paths with different versions. Keying
  // by bare name would let a change at one path hide behind another path that
  // did not move.
  it("distinguishes the same package at two different paths", () => {
    const before = readLockVersions(
      lock({ "node_modules/a/node_modules/ms": { version: "2.0.0" }, "node_modules/ms": { version: "2.1.3" } })
    );
    const after = readLockVersions(
      lock({ "node_modules/a/node_modules/ms": { version: "2.1.0" }, "node_modules/ms": { version: "2.1.3" } })
    );
    expect(diffLockVersions(before, after)).toEqual([
      { pkgPath: "node_modules/a/node_modules/ms", from: "2.0.0", to: "2.1.0" }
    ]);
  });

  it("tolerates a package entry with no version, such as a workspace link", () => {
    const versions = readLockVersions(lock({ "node_modules/linked": { link: true }, "node_modules/x": { version: "1.0.0" } }));
    expect(versions).toEqual({ "node_modules/x": "1.0.0" });
  });
});
