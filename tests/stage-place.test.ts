import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { placeLabel } from "../src/app/[lang]/stages/shared";
import { getOpenStages, type Stage } from "@/content/stages";
import { locales } from "@/i18n/config";

/**
 * A listing with no city, said out loud.
 *
 * city is optional -- Cohere lists its two internships as "Canada", remote,
 * with no city at all -- and the home page interpolated it raw: the visible
 * line came out "— Cohere · , Canada" and the link's accessible name ended
 * ", undefined", which is what a screen reader announces. Those two rows sit
 * mid-board today, so the page escaped it only by which five listings the
 * ordering put first, and the next import decides that.
 */
const row = (over: Partial<Stage>): Stage => ({
  id: "x",
  role: "Research Internship",
  company: "Cohere",
  country: "CA",
  kind: "stage",
  href: "https://example.com/job",
  ...over
});

describe("where a listing says it is", () => {
  it("leaves a missing city out instead of printing a hole", () => {
    expect(placeLabel(row({}), "en")).toBe("Canada");
    expect(placeLabel(row({}), "fr")).toBe("Canada");
    expect(placeLabel(row({ city: "Toronto" }), "en")).toBe("Toronto, Canada");
    expect(placeLabel(row({ city: "Casablanca", country: "MA" }), "fr")).toBe("Casablanca, Maroc");
  });

  it("never says undefined, or a comma with nothing before it, for any listing on the board", () => {
    const cityless = getOpenStages().filter((stage) => !stage.city);
    // The two Cohere rows today. If this ever reaches zero the test above is
    // the one still holding the behaviour.
    expect(cityless.length).toBeGreaterThan(0);
    for (const stage of getOpenStages()) {
      for (const locale of locales) {
        const place = placeLabel(stage, locale);
        expect(place, stage.id).not.toMatch(/undefined|^,|,\s*$/);
        expect(place.trim()).toBe(place);
      }
    }
  });

  /**
   * The home page had its own copy of this, written without the fallback. It
   * borrows the board's now, and nothing on it reads stage.city directly --
   * which is the shape that produced ", undefined" in the first place.
   */
  it("is the only way the pages that list stages write a place", () => {
    const home = readFileSync("src/app/[lang]/page.tsx", "utf8");
    expect(home).toContain("placeLabel(");
    expect(home).not.toContain("stage.city");
  });
});
