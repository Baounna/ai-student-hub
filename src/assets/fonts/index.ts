import fs from "node:fs";
import path from "node:path";

/**
 * The site's own typefaces, for the routes that render images.
 *
 * Both image routes declared `fontFamily: "sans-serif"`, so every generated
 * cover and social card was set in whatever the server's default sans happened
 * to be — while the site itself sets headings in Newsreader and everything else
 * in Public Sans. Side by side with a real page, the images read as something
 * made by a different tool.
 *
 * Satori, which renders these, accepts TTF/OTF/WOFF but not WOFF2 — and WOFF2
 * is all next/font caches, so the files are vendored here instead. They are
 * read once per process, not per request.
 */
const dir = path.join(process.cwd(), "src/assets/fonts");

function load(file: string) {
  return fs.readFileSync(path.join(dir, file));
}

/**
 * Newsreader for titles, Public Sans for labels — the same pairing as the site.
 *
 * Public Sans ships at two weights because the social card asks for both: the
 * kicker and wordmark are 700, and the footer note is regular. With only 700
 * loaded, Satori fell back to it for everything, so a line meant to sit quietly
 * under a rule rendered as bold as the wordmark beside it.
 */
export const imageFonts = [
  { name: "Newsreader", data: load("newsreader-700.ttf"), weight: 700 as const, style: "normal" as const },
  { name: "Public Sans", data: load("public-sans-400.ttf"), weight: 400 as const, style: "normal" as const },
  { name: "Public Sans", data: load("public-sans-700.ttf"), weight: 700 as const, style: "normal" as const }
];
