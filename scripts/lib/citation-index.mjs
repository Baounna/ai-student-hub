/**
 * Every external link the published content promises a reader, read out of the
 * content files.
 *
 * Same constraint as scripts/lib/posts-index.mjs: the content lives in
 * TypeScript modules that import through the "@/" alias, which node can strip
 * types for but cannot resolve, so the source text is parsed instead. That is a
 * parser pointed at a moving file, and it is only safe because
 * tests/citation-index.test.ts imports the real modules through vitest -- which
 * does resolve the alias -- and asserts this returns exactly the same set of
 * links. Reshape a content file and that test fails before the checker can
 * report a clean run over links it never looked at.
 */
import fs from "node:fs/promises";

const FILES = ["src/content/posts.ts", "src/content/posts-cs.ts", "src/content/news.ts"];

function unquote(raw) {
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw.replace(/\\(["\\])/g, "$1");
  }
}

function isExternal(href) {
  try {
    const { protocol } = new URL(href);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Two kinds of promise, told apart because they fail differently.
 *
 * A citation says "this claim is backed by that page". If the page moves, the
 * claim is unsupported until someone reads the new one, so a moved citation
 * always needs a person -- nothing can rewrite it safely.
 *
 * A tool link says "here is the thing I am describing". A move there is usually
 * a rebrand and the link still lands somewhere useful, so it is reported with
 * less alarm.
 */
function parse(text) {
  const out = [];
  let slug = "";
  let name = "";
  let block = null;
  let depth = 0;

  for (const line of text.split("\n")) {
    const slugMatch = line.match(/^\s*slug: "((?:[^"\\]|\\.)*)"/);
    if (slugMatch) slug = unquote(slugMatch[1]);

    const nameMatch = line.match(/^\s*name: "((?:[^"\\]|\\.)*)"/);
    if (nameMatch) name = unquote(nameMatch[1]);

    if (!block && /^\s*references: \[/.test(line)) {
      block = "references";
      depth = 1;
      continue;
    }
    // news.ts carries one `source: { name, href }` per item rather than a list.
    // `source: "arXiv"` inside a references entry is a string, not a block, so
    // the brace is what separates them.
    if (!block && /^\s*source: \{/.test(line)) {
      block = "source";
      depth = 1;
      continue;
    }

    const hrefMatch = line.match(/^\s*href: "((?:[^"\\]|\\.)*)"/);
    if (hrefMatch) {
      const href = unquote(hrefMatch[1]);
      if (isExternal(href)) {
        out.push({
          kind: block ? "citation" : "tool",
          owner: block ? slug : name,
          href
        });
      }
    }

    if (block) {
      const open = block === "references" ? "[" : "{";
      const close = block === "references" ? "]" : "}";
      depth += line.split(open).length - 1;
      depth -= line.split(close).length - 1;
      if (depth <= 0) block = null;
    }
  }

  return out;
}

export async function citationIndex({ files = FILES, read = (f) => fs.readFile(f, "utf8") } = {}) {
  const out = [];
  for (const file of files) {
    const text = await read(file);
    for (const entry of parse(text)) out.push({ file, ...entry });
  }
  return out;
}

export { parse as parseContentLinks };
