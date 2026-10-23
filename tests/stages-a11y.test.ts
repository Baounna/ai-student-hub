import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { stagesCopy } from "../src/app/[lang]/stages/shared";
import { locales } from "@/i18n/config";
import { getStages } from "@/content/stages";

const BOARD = readFileSync("src/app/[lang]/stages/page.tsx", "utf8");
const COUNTRY = readFileSync("src/app/[lang]/stages/[country]/page.tsx", "utf8");
const ROW = readFileSync("src/app/[lang]/stages/shared.tsx", "utf8");
const ANNOUNCER = readFileSync("node_modules/next/dist/client/components/app-router-announcer.js", "utf8");

/**
 * Clicking a filter has to say something.
 *
 * Every chip on the board is a <Link>, so a click is a soft navigation, and
 * the only thing Next announces on one is a change of document.title. The
 * route's generateMetadata returns the same seoTitle for every filter state by
 * design, so the announcer has nothing to say; focus stays on the chip, which
 * does not move. "Showing 8 of 94" was the only report of what happened and it
 * was rendered only when a filter was active -- a live region inserted into
 * the DOM at the same moment it has something to say, which is not reliably
 * announced, because the screen reader has to already be watching it. That is
 * the failure written up on newsletter-form.tsx.
 *
 * So the whole thing was silent: 94 rows became 8 and nothing was said.
 */
describe("the filter result, announced", () => {
  it("renders the count's live region whether or not a filter is active", () => {
    const start = BOARD.indexOf('<span role="status" aria-live="polite">');
    expect(start, "the live region is gone").toBeGreaterThan(-1);
    // The region itself must not be inside the isFiltered branch: its text
    // changes, it does not appear. An empty string when unfiltered is the
    // point.
    expect(BOARD.slice(start, start + 220)).toMatch(/isFiltered \? copy\.filterShowing\([^)]*\) : ""/);
  });

  it("keeps the clear-filters link out of the live region", () => {
    // A link's own label is not news, and inside the region it would be read
    // out again on every single filter click.
    const region = BOARD.slice(
      BOARD.indexOf('<span role="status" aria-live="polite">'),
      BOARD.indexOf("</span>", BOARD.indexOf('<span role="status" aria-live="polite">'))
    );
    expect(region).not.toContain("filterClear");
    expect(BOARD).toContain("copy.filterClear");
  });

  it("is still needed, because the installed announcer only watches the title", () => {
    // If a future Next announces route changes some other way, this fails and
    // the live region can be reconsidered rather than kept out of habit.
    expect(ANNOUNCER).toContain("previousTitle.current !== currentTitle");
    // And the route really does serve one title for every filter state.
    expect(BOARD).toMatch(/title: copy\.seoTitle/);
  });

  it("gives the keyword form the landmark role a search form gets", () => {
    // A <form> is an unnamed group to assistive technology unless told
    // otherwise, so the one way to narrow 94 rows by keyword was missing from
    // the list of landmarks a screen reader offers to jump to.
    expect(BOARD).toMatch(/method="get" role="search"/);
  });

  it("makes the staleness warning reachable by heading navigation", () => {
    // It was a bolded <p>. It looked like a heading to everyone who could see
    // it, which is the gap WCAG 1.3.1 describes.
    for (const source of [BOARD, COUNTRY]) {
      expect(source).toMatch(/<h2 className="font-semibold text-\[color:var\(--text-strong\)\]">\{copy\.staleTitle\}/);
    }
  });
});

/**
 * The country boards are the pages a stranger lands on from a search, and they
 * were the version of the board that explained nothing and admitted nothing.
 */
describe("the country boards", () => {
  it("carry the method note, like the board they were split out of", () => {
    expect(COUNTRY).toContain("copy.methodTitle");
    expect(COUNTRY).toContain("copy.methodBody");
  });

  it("carry the staleness warning too", () => {
    expect(COUNTRY).toContain("isStagesListStale");
    expect(COUNTRY).toContain("copy.staleBody");
  });
});

/**
 * A row at 360px was a wall of small grey text: the deadline slot said "Open
 * until filled - no closing date given" on 92 of the 94 listings, and the
 * source, the feed origin and the check date were three separate spans that
 * each wrapped onto a line of their own.
 */
describe("the listing row", () => {
  it("shows a deadline only where the employer published one", () => {
    const stages = getStages();
    const dated = stages.filter((stage) => stage.deadline);
    // Two today. If the data ever becomes mostly dated, the slot stops being
    // the repetition this change was about.
    expect(dated.length).toBeGreaterThan(0);
    expect(dated.length).toBeLessThan(stages.length / 2);
    // The "no closing date given" line is gone from the row, in both languages.
    expect(ROW).not.toMatch(/copy\.rolling/);
    for (const locale of locales) {
      expect(Object.keys(stagesCopy[locale])).not.toContain("rolling");
    }
  });

  it("says once, in the method note, what the rows no longer repeat", () => {
    // The claim did not disappear with the line: it is the closing sentence of
    // the note, which now renders on the country pages as well.
    expect(stagesCopy.en.methodBody).toMatch(/Deadlines are shown only where the employer published one/);
    expect(stagesCopy.fr.methodBody).toMatch(/dates limites ne sont affichées que lorsque l'employeur en publie une/i);
  });

  it("still shows a check date or the admission that there is none", () => {
    // Four pages promise "every entry either shows its check date or says we
    // could not verify it". Merging the metadata into one line must not have
    // dropped either half.
    expect(ROW).toContain("{stage.unverifiable ? (");
    expect(ROW).toContain("copy.notVerified");
    expect(ROW).toContain("copy.checked");
    const trust = readFileSync("src/components/editorial-trust.tsx", "utf8");
    expect(trust).toMatch(/either shows its check date or says we could not verify it/);
  });

  it("puts the recency signal on that line rather than beside it", () => {
    // The comment in shared.tsx argued for this and the implementation then
    // added a separate span anyway.
    expect(ROW).toContain("const recent = !closed && isRecentlyAdded(stage);");
    expect(ROW).toContain("copy.recentBadge");
  });

  it("clamps the title on phones only", () => {
    // Three roles run past 100 characters and one runs to 199. The apply
    // link's accessible name still carries the role in full.
    expect(ROW).toMatch(/line-clamp-3[^"]*sm:line-clamp-none/);
    expect(ROW).toContain("copy.applyLabel(stage.role, stage.company, place)");
  });
});

/**
 * At 360px the content box is 332px. Thirteen country chips at 44px each
 * wrapped to five rows before Type, Added and the search form added theirs.
 */
describe("the filter chrome on a phone", () => {
  it("shows a few countries and puts the rest behind a disclosure", () => {
    expect(BOARD).toMatch(/const COUNTRY_CHIPS_SHOWN = \d+/);
    const shown = Number(BOARD.match(/const COUNTRY_CHIPS_SHOWN = (\d+)/)?.[1]);
    expect(shown).toBeGreaterThan(2);
    expect(shown).toBeLessThan(7);
    expect(BOARD).toContain("<details open={tailCountries.includes(countryFilter)}");
  });

  it("keeps the disclosure's own state in the URL", () => {
    // A soft navigation remounts this page, so a <details> the reader opened
    // by hand would close on every filter click. Derived from the active
    // country instead, which is also what makes the whole view shareable.
    expect(BOARD).toContain("tailCountries.includes(countryFilter)");
    // And the chips inside are still real links, not client state.
    const disclosure = BOARD.slice(BOARD.indexOf("<details"), BOARD.indexOf("</details>"));
    expect(disclosure).toContain("href={filterHref({ country: code })}");
    expect(disclosure).toContain('aria-current={countryFilter === code ? "true" : undefined}');
  });

  it("moves the scope line down beside the method note", () => {
    // 198 characters of 12px uppercase monospace, which is five lines at
    // 332px, and it sat third in the hero above every filter.
    const header = BOARD.slice(BOARD.indexOf("<header"), BOARD.indexOf("</header>"));
    expect(header).not.toContain("copy.scope");
    const method = BOARD.slice(BOARD.indexOf("copy.methodTitle"));
    expect(method).toContain("copy.scope");
  });
});

describe("the floating and off-screen controls", () => {
  it("takes the hidden back-to-top button out of the tab order", () => {
    // pointer-events-none and opacity-0 hide a control from a mouse and from
    // eyes and from nobody else, so every article, brief and comparison page
    // had a focusable "Back to top" nobody could see. Its three siblings all
    // carry inert.
    const button = readFileSync("src/components/back-to-top.tsx", "utf8");
    expect(button).toContain("inert={!visible}");
    expect(button).toContain("aria-hidden={!visible}");
  });

  it("gives the dismiss control a hit area", () => {
    // text-xs with no padding measured 20.4px tall, under the 24x24 floor of
    // WCAG 2.2 Target Size (Minimum), and it is the control a reader presses
    // to make the banner go away.
    const cta = readFileSync("src/components/scroll-capture-cta.tsx", "utf8");
    expect(cta).toMatch(/className="tap-target[^"]*text-xs[^"]*underline"/);
  });

  it("lets a keyboard scroll the comparison table", () => {
    // 760px of table inside a 332px box, with nothing focusable in the columns
    // that sit off the right edge.
    const compare = readFileSync("src/app/[lang]/compare/[slug]/page.tsx", "utf8");
    const scroller = compare.slice(compare.indexOf('id="comparison-table"'));
    expect(scroller.slice(0, 500)).toContain("tabIndex={0}");
    expect(scroller.slice(0, 500)).toMatch(/role="group"/);
    expect(scroller.slice(0, 500)).toContain("aria-label=");
    expect(scroller.slice(0, 500)).toContain("edge-fade-x");
  });

  it("localises the one landmark label that was hardcoded English", () => {
    // On all 122 French pages, announced through a French synthesiser. Every
    // item inside the bar was already localised.
    const nav = readFileSync("src/components/mobile-quick-nav.tsx", "utf8");
    expect(nav).not.toContain('aria-label="Mobile quick navigation"');
    expect(nav).toMatch(/aria-label=\{locale === "fr" \? "[^"]+" : "Mobile quick navigation"\}/);
  });
});
