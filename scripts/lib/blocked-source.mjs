/**
 * Whether an item comes from a source the editorial policy excludes.
 *
 * Today that is arXiv: preprints are not peer reviewed, and the policy is not
 * to present them to readers as established results.
 *
 * There were four copies of this test and they disagreed. `verify-agent-health`
 * had been narrowed to an exact hostname match, which is right for a security
 * sanitiser and wrong here: it stopped recognising `https://arxiv.org./abs/x`
 * (a hostname is legally written with a trailing dot), a bare `arxiv.org/abs/x`
 * with no scheme (which `new URL` refuses outright), and any reader proxy that
 * carries the real URL in its path. The ingest gates meanwhile still matched
 * "arxiv.org" as a substring, so the verifier could pass content the gate was
 * built to drop -- a health check that certifies the thing it cannot see.
 *
 * The bias is deliberate and it is the opposite of a sanitiser's. This is a
 * denylist: matching too much costs an operator one review, matching too little
 * publishes what the policy forbids. So a lookalike host like
 * `arxiv.org.example.com` is blocked too, on purpose.
 *
 * Kept in step with src/lib/blocked-source.ts by tests/blocked-source.test.ts,
 * which runs one table of cases through both -- app code cannot import a .mjs
 * helper here (allowJs is off) and a silent divergence is what produced this.
 */

const BLOCKED_HOSTS = ["arxiv.org"];
const BLOCKED_WORDS = /\barxiv\b/;

function hostOf(href) {
  try {
    return new URL(String(href)).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return "";
  }
}

export function isBlockedSource({ href, source, sourceFeed } = {}) {
  const host = hostOf(href);
  if (BLOCKED_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) {
    return true;
  }

  const text = [href, source, sourceFeed].map((value) => String(value ?? "")).join(" ").toLowerCase();
  return BLOCKED_WORDS.test(text);
}
