import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The empty-feed copy has to exist before the feed empties.
 *
 * scripts/verify-agent-health.mjs checks these, but only inside
 * `if (!items.length)` -- so on every ordinary day, with 240 news items and
 * 120 tool items, the check does not run. Three of its six needles were
 * written with the accents stripped and could never have matched the pages,
 * and nothing noticed for as long as the feeds stayed full. The one moment
 * they would have been exercised is the one moment a reader is looking at an
 * empty page.
 *
 * So the strings are asserted here too, every run, in both languages.
 */
const FALLBACKS = [
  {
    file: "src/app/[lang]/compare/page.tsx",
    en: "No new tools captured yet.",
    fr: "Aucune nouveauté captée pour le moment."
  },
  {
    file: "src/app/[lang]/news/page.tsx",
    en: "No new items yet.",
    fr: "Aucun nouvel item pour le moment."
  },
  {
    file: "src/app/[lang]/news/live/page.tsx",
    en: "No updates available right now",
    fr: "Aucune mise à jour disponible"
  }
];

/** Both spellings of an accent are live in this codebase: literal and \uXXXX. */
function flatten(text: string): string {
  return text
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)))
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

describe("empty-feed fallback copy", () => {
  it.each(FALLBACKS)("$file says it in both languages", ({ file, en, fr }) => {
    const source = flatten(readFileSync(file, "utf8"));
    expect(source, `${file} EN`).toContain(flatten(en));
    expect(source, `${file} FR`).toContain(flatten(fr));
  });

  it("is what the health check looks for, spelled the same way", () => {
    // The mismatch was between this list and the script's. Reading the script
    // keeps them from drifting apart again without anything saying so.
    const script = flatten(readFileSync("scripts/verify-agent-health.mjs", "utf8"));
    for (const { en, fr } of FALLBACKS) {
      expect(script, en).toContain(flatten(en));
      expect(script, fr).toContain(flatten(fr));
    }
  });
});
