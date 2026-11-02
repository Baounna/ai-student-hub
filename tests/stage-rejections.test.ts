import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
// @ts-expect-error - plain .mjs script, no types
import { isRejected } from "../scripts/find-stages.mjs";

const file = JSON.parse(readFileSync("docs/agent/stage-rejections.json", "utf8"));

/*
 * The finder compared candidates only against the board, so anything a person
 * opened, read and rejected was offered again the next run, and the run after
 * that. Seven were on 30 October. Re-judging the same seven every week is how
 * a review list stops being read carefully.
 */
describe("remembering what a person already rejected", () => {
  it("skips a role that is not AI or cybersecurity, permanently", () => {
    const hse = file.items.find((i: { role: string }) => i.role.includes("HSE"));
    expect(isRejected({ href: hse.href }, file)).toBe(true);
  });

  it("matches the posting even when the link gains a query string", () => {
    // Greenhouse and Ashby both serve the same job with and without ?gh_jid /
    // ?src, and comparing raw strings let one posting back through.
    const first = file.items[0];
    expect(isRejected({ href: `${first.href}?src=rss` }, file)).toBe(true);
    expect(isRejected({ href: `${first.href}#apply` }, file)).toBe(true);
  });

  it("offers a candidate nobody has judged", () => {
    expect(isRejected({ href: "https://example.com/jobs/never-seen" }, file)).toBe(false);
  });

  it("does not crash on a candidate with no link", () => {
    expect(isRejected({}, file)).toBe(false);
    expect(isRejected({ href: "" }, file)).toBe(false);
  });

  it("works when there is no rejection file at all", () => {
    expect(isRejected({ href: "https://example.com/x" }, undefined)).toBe(false);
    expect(isRejected({ href: "https://example.com/x" }, { items: [] })).toBe(false);
  });

  /*
   * The point of storing the reason rather than just the link. These three were
   * good roles; only the board was missing a page for their country. If that
   * changes they are wanted, and a rejection that outlived its reason would
   * hide them forever.
   */
  it("keeps hiding a country-not-served role while its country has no page", () => {
    const belgrade = file.items.find((i: { country?: string }) => i.country === "RS");
    expect(isRejected({ href: belgrade.href }, file, new Set(["FR", "DE", "US"]))).toBe(true);
  });

  it("offers it again the day its country is served", () => {
    const belgrade = file.items.find((i: { country?: string }) => i.country === "RS");
    expect(isRejected({ href: belgrade.href }, file, new Set(["FR", "RS"]))).toBe(false);
  });

  /*
   * A typo in a reason string must not silently swallow a candidate: the
   * listing would simply never appear and nothing would say why.
   */
  it("offers a candidate whose rejection reason is not one it understands", () => {
    const odd = { items: [{ href: "https://example.com/j/1", reason: "noo-longer-open" }] };
    expect(isRejected({ href: "https://example.com/j/1" }, odd)).toBe(false);
  });

  it("every stored rejection carries a reason the code acts on", () => {
    const known = new Set(["off-topic", "country-not-served"]);
    for (const item of file.items) {
      expect(known, `${item.role} has reason "${item.reason}"`).toContain(item.reason);
      expect(item.detail, `${item.role} has no detail`).toBeTruthy();
      if (item.reason === "country-not-served") expect(item.country).toBeTruthy();
    }
  });
});
