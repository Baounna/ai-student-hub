import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { campusTag, recognizeCampus } from "@/lib/campus";

/**
 * The institution a subscriber is filed under must come from their address.
 *
 * This is the one place in the campus feature where a mistake would be worth
 * something to somebody: a tag read from the request body is a claim the server
 * repeats without checking, so anyone could post `campus: "um6p"` with a
 * throwaway address and land inside that institution's segment. The derivation
 * therefore happens in the route, from the email, and the payload type has no
 * campus field at all for a future edit to start trusting.
 *
 * Read as source text for the same reason tests/newsletter-delivery-state.test.ts
 * is: the route needs a Request and a live provider. What this pins is the shape
 * that keeps the mistake impossible rather than merely absent today.
 */
const ROUTE = readFileSync("src/app/api/newsletter/route.ts", "utf8");

/** Comments here discuss the rejected design on purpose, so they are not code. */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("campus tagging", () => {
  it("derives the institution from the address", () => {
    expect(code(ROUTE)).toMatch(/recognizeCampus\(email\)/);
  });

  it("never reads an institution from the request body", () => {
    const body = code(ROUTE);
    // Neither the payload type nor any read of it may carry one.
    expect(body).not.toMatch(/campus\??\s*:\s*string/);
    expect(body).not.toMatch(/body\.campus/);
    expect(body).not.toMatch(/recognizeCampus\((?!email\))/);
  });

  it("passes the derived tag to the provider", () => {
    expect(code(ROUTE)).toMatch(/extraTags:\s*campusLabelTag\s*\?/);
  });

  it("reports an institution only when the address was actually stored", () => {
    // A segment cannot be claimed for a subscription that did not happen: the
    // page would confirm a filing that exists nowhere.
    expect(code(ROUTE)).toMatch(/campus:\s*emailForwarded && campus\.kind !== "other"/);
  });

  it("tags a university address and leaves a personal one untagged", () => {
    // The end-to-end property the route's wiring exists to produce.
    expect(campusTag(recognizeCampus("etudiant@uit.ac.ma"))).toBe("campus:uit");
    expect(campusTag(recognizeCampus("etudiant@gmail.com"))).toBeNull();
  });
});
