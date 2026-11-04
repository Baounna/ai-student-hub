/**
 * What a fetch of a cited page proves, and what it does not.
 *
 * Pure and separate from the script so the cases can be tested without the
 * network. The hard-won lesson this encodes is that "could not read it" and
 * "it is not there" are different findings, and a checker that merges them
 * reports broken links that are not broken. Twenty-five of those were reported
 * on this content once; every one turned out to be bot filtering, and the hours
 * went into chasing them instead of into the real ones.
 */

/** Hosts whose canonical form adds or drops these without changing the page. */
function normalize(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return { host, path, search: parsed.search, href: `${host}${path}${parsed.search}` };
  } catch {
    return null;
  }
}

/**
 * A redirect that lands on the site's own front page or a bare section index,
 * from a URL that named a specific page, is the signature of a page that was
 * taken down: the server has nothing at that address and sends the visitor to
 * the top. It is also exactly how an expired job posting behaves, which is how
 * check-stages.mjs already reads it.
 */
function isGenericDestination(before, after) {
  if (after.path === "/") return before.path !== "/";
  const beforeDepth = before.path.split("/").filter(Boolean).length;
  const afterDepth = after.path.split("/").filter(Boolean).length;
  return afterDepth < beforeDepth && beforeDepth >= 2 && afterDepth <= 1;
}

/**
 * The same address written differently.
 *
 * Every one of these was a false positive on the first real run over this
 * content, and each would have fired on every run afterwards, which is how a
 * check stops being read:
 *
 *   /lang_UPSERT.html -> /lang_upsert.html   sqlite.org, case only
 *   /body-parser.html -> /body-parser/       expressjs.com, extension to directory
 *   /docs/x           -> /en-US/docs/x       developer.mozilla.org, locale prefix
 *
 * Paths really are case-sensitive, and .html really can be a different resource
 * from a directory -- but not when the server itself redirects one to the other.
 * The redirect is the server saying they are the same thing.
 */
function isSamePage(before, after) {
  if (before.href === after.href) return true;
  if (before.host !== after.host) {
    // A documentation site moving to its own subdomain, or dropping one, is a
    // move of the whole site and not of this page. Judged by path, not host.
    const hostFamily = (host) => host.split(".").slice(-2).join(".");
    if (hostFamily(before.host) !== hostFamily(after.host)) return false;
  }
  const canonical = (path) =>
    path
      .toLowerCase()
      .replace(/\.(html?|php|aspx)$/, "")
      .replace(/^\/[a-z]{2}(-[a-z]{2})?(?=\/|$)/, "") || "/";
  return canonical(before.path) === canonical(after.path);
}

export function citationVerdict({ href, status, finalUrl }) {
  const before = normalize(href);
  const after = normalize(finalUrl || href);

  if (!before) return { level: "check", detail: "not a URL this checker can parse" };

  // No response at all, a refusal, a rate limit, or the server erroring are all
  // statements about the request, not about the page. They go to a person and
  // are never counted as a dead citation.
  if (status === 0) return { level: "check", detail: "no response" };
  if (status === 403) return { level: "check", detail: "HTTP 403 (refused us; proves nothing either way)" };
  if (status === 429) return { level: "check", detail: "HTTP 429 (rate limited; proves nothing either way)" };
  if (status >= 500) return { level: "check", detail: `HTTP ${status} (server error; proves nothing either way)` };

  if (status === 404 || status === 410) return { level: "gone", detail: `HTTP ${status}` };
  if (status < 200 || status >= 400) return { level: "check", detail: `HTTP ${status}` };

  if (!after || isSamePage(before, after)) return { level: "ok", detail: `HTTP ${status}` };

  if (isGenericDestination(before, after)) {
    return {
      level: "moved",
      detail: `HTTP ${status} but redirected off the page to ${finalUrl}`
    };
  }

  // A redirect to another specific page is usually a reorganised site, and the
  // cited material is usually still there under the new address. Still a
  // person's call, because the only thing that settles it is reading the new
  // page, but it is not the same alarm as landing on a homepage.
  return {
    level: "moved",
    detail: `HTTP ${status} but redirected to a different page: ${finalUrl}`
  };
}
