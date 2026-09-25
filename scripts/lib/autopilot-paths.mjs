/**
 * The only paths the autopilot is allowed to commit.
 *
 * It used to stage with `git add -A`, which commits whatever happens to be in
 * the tree -- not whatever the pipeline produced. Those are the same thing only
 * on a clean checkout. On a developer machine, or a runner where an earlier step
 * left a file behind, `-A` quietly sweeps unrelated work into an unattended
 * commit that then pushes itself to main. I did exactly this to three of my own
 * commits by hand before switching to explicit paths; a script that runs on a
 * schedule has nobody reading the diff at all.
 *
 * The list matches what .github/workflows/agents-master.yml already declares
 * for this same pipeline (npm run agent:all), so the two cannot drift into
 * disagreeing about what the run is expected to touch.
 */
export const AUTOPILOT_COMMIT_PATHS = [
  "src/content/auto-news.json",
  "src/content/auto-tools.json",
  "docs/agent"
];

/**
 * Split the changed-file list into what these paths cover and what they do not.
 *
 * Takes bare repository-relative paths, which is what the caller's
 * getChangedFiles() already produces -- it strips the `git status --short`
 * prefix and resolves renames before returning. An earlier version of this
 * function also tried to strip a status prefix, which on a bare path containing
 * an early space ("my notes/a.md") would have eaten the first characters of a
 * real filename.
 *
 * The leftovers are reported rather than dropped in silence. An unattended
 * commit that skips a file is better than one that includes a surprise, but
 * only if the run says which -- otherwise "the autopilot committed" and "the
 * autopilot committed everything it changed" look identical in the log.
 */
export function partitionByCommitPaths(changedFiles, paths = AUTOPILOT_COMMIT_PATHS) {
  const covered = [];
  const skipped = [];
  for (const raw of changedFiles || []) {
    const file = String(raw).trim().replace(/^"|"$/g, "");
    if (!file) continue;
    const isCovered = paths.some((p) => file === p || file.startsWith(`${p}/`));
    (isCovered ? covered : skipped).push(file);
  }
  return { covered, skipped };
}
