import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * "Subscribed" has to mean the address reached the provider.
 *
 * There is no queue and no fallback store anywhere in this path: ConvertKit
 * accepts the address or it is gone. The route still reported a fourth state
 * called "queued" -- unreachable, because emailForwarded is `ok && !skipped`
 * and providerUnavailable is `skipped`, so `ok` cannot still be true by the
 * time that branch is reached.
 *
 * Dead code, except that the form's fallback for a response without the field
 * defaulted TO it, and counted it as subscribed. A 200 with no deliveryStatus
 * therefore cleared the form and told the reader they were signed up for an
 * address nobody had. With a bad API key that is every signup, and the comment
 * directly above that line is about exactly this mistake in its previous form.
 *
 * Read as source text because the route needs a request and the form needs a
 * DOM; what these pin is the shape that made the bug possible.
 */
const ROUTE = readFileSync("src/app/api/newsletter/route.ts", "utf8");
const FORM = readFileSync("src/components/newsletter-form.tsx", "utf8");

/** Comments here explain the removed state on purpose, so they are not code. */
const code = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("newsletter delivery state", () => {
  it("has no state that implies a saved address nobody holds", () => {
    expect(code(ROUTE)).not.toContain('"queued"');
    expect(code(FORM)).not.toContain('"queued"');
  });

  it("reports exactly the three states that can happen", () => {
    expect(ROUTE).toMatch(/emailForwarded \? "sent" : providerUnavailable \? "unavailable" : "failed"/);
  });

  it("fails closed when the response does not say", () => {
    // The fallback decides what an unknown outcome counts as, so it is the one
    // line in the file that must not be generous.
    expect(FORM).toMatch(/data\.deliveryStatus \|\| \(data\.forwarded \? "sent" : "failed"\)/);
    expect(FORM).toMatch(/const subscribed = delivery === "sent";/);
  });

  it("only calls it a success when the address was forwarded", () => {
    // `stored` and `subscribed` must both rest on the same fact.
    expect(ROUTE).toMatch(/const stored = emailForwarded;/);
  });

  it("keeps a wording for every state a reader can land in", () => {
    for (const copy of ["Check your inbox", "did not go through", "not open for signups yet"]) {
      expect(FORM, copy).toContain(copy);
    }
    // And none for a state that cannot happen.
    expect(FORM).not.toContain("Signup saved. You will receive upcoming updates.");
  });
});
