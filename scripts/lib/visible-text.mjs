/**
 * The text a browser would show, extracted from an HTML document.
 *
 * This exists because one regex decided whether a job listing was dead, and it
 * got the answer wrong twice, in opposite directions.
 *
 * `<[^>]+>` stopped at the first ">" it saw, so `<!-- a > b -->` left "b -->"
 * in the text and `title="a > b"` swallowed the rest of the element. The
 * replacement consumed quoted attribute values -- and treated an apostrophe as
 * opening one wherever it appeared, including in an unquoted value. A single
 * `<a href=/stage/l'offre>` then ran the match to the next apostrophe anywhere
 * in the document and on to the next ">", so a page whose body read "Cette
 * offre n'est plus disponible" came back as the empty string. That is the
 * expensive direction: a dead listing reported as open, with `--write` stamping
 * checkedAt so the site asserts it was verified today.
 *
 * A scanner, not a regex. It is linear, it cannot give back, and a mistake in
 * one element cannot reach the next one. Where it departs from the HTML spec it
 * departs toward leaving text in: a stray `value=x it's>` surviving into the
 * text can only cause a false "gone", which this tool routes to a human, while
 * deleting real text causes a false "open", which it routes to a student.
 */

/** Elements whose content is text a browser never renders as prose. */
const SKIPPED_CONTENT = new Set(["script", "style", "template"]);

/**
 * Where the tag starting at `start` ends.
 *
 * A quote only opens a quoted value directly after "=", which is the rule that
 * `<a href=/stage/l'offre>` broke: there the apostrophe sits in an unquoted
 * value, where the spec and every browser treat it as an ordinary character.
 *
 * An unterminated quoted value runs to end-of-input per spec. This stops it at
 * the next ">" instead, so one unclosed `class='` cannot blank a whole page.
 */
function findTagEnd(html, start) {
  let i = start;
  let afterEquals = false;

  while (i < html.length) {
    const ch = html[i];

    if (ch === ">") return i;

    if (ch === "=") {
      afterEquals = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      if (!afterEquals) {
        // An ordinary character: inside an attribute name, or in an unquoted
        // value. Not the start of anything.
        i += 1;
        continue;
      }
      const close = html.indexOf(ch, i + 1);
      // A ">" inside a quoted value is ordinary -- title="a > b" is the case
      // the first regex here got wrong -- so a value that closes is honoured
      // past it. What is not honoured is a value that closes only after a "<":
      // an attribute does not contain the start of another element, so the
      // quote never opened one and pairing with it would delete real text.
      const stray = html.indexOf("<", i + 1);
      if (close === -1 || (stray !== -1 && stray < close)) {
        const gt = html.indexOf(">", i + 1);
        return gt === -1 ? html.length : gt;
      }
      i = close + 1;
      afterEquals = false;
      continue;
    }

    if (!/\s/.test(ch)) afterEquals = false;
    i += 1;
  }

  return html.length;
}

export function visibleText(html) {
  const source = String(html ?? "");
  let out = "";
  let i = 0;

  while (i < source.length) {
    const lt = source.indexOf("<", i);
    if (lt === -1) {
      out += source.slice(i);
      break;
    }
    out += source.slice(i, lt);

    if (source.startsWith("<!--", lt)) {
      const end = source.indexOf("-->", lt + 4);
      i = end === -1 ? source.length : end + 3;
      out += " ";
      continue;
    }

    // <!doctype>, <![CDATA[...]]>, <?xml ?>: never prose.
    if (source.startsWith("<!", lt) || source.startsWith("<?", lt)) {
      const cdata = source.startsWith("<![CDATA[", lt) ? source.indexOf("]]>", lt + 9) : -1;
      const end = cdata !== -1 ? cdata + 2 : source.indexOf(">", lt + 2);
      i = end === -1 ? source.length : end + 1;
      out += " ";
      continue;
    }

    const name = /^<\/?([a-zA-Z][^\s/>]*)/.exec(source.slice(lt, lt + 80));
    if (!name) {
      // A "<" that is just a character. Keep it; it is part of the text.
      out += "<";
      i = lt + 1;
      continue;
    }

    const tagEnd = findTagEnd(source, lt + name[0].length);
    const tag = name[1].toLowerCase();
    const closing = source[lt + 1] === "/";
    out += " ";
    i = tagEnd === source.length ? source.length : tagEnd + 1;

    if (!closing && SKIPPED_CONTENT.has(tag)) {
      // Raw text and template content. A browser ends these at the close tag
      // whatever the content claims -- `"</script>"` inside a JS string closes
      // a script element in every browser -- so a plain search matches.
      const close = source.toLowerCase().indexOf(`</${tag}`, i);
      i = close === -1 ? source.length : close;
    }
  }

  return out.replace(/\s+/g, " ").trim();
}
