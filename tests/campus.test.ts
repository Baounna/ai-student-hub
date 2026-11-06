import { describe, it, expect } from "vitest";
import {
  INSTITUTIONS,
  campusLabel,
  campusTag,
  emailDomain,
  isCampusAddress,
  recognizeCampus
} from "@/lib/campus";

describe("campus recognition", () => {
  it("names a student at an institution on the list", () => {
    const match = recognizeCampus("etudiant@uit.ac.ma");
    expect(match.kind).toBe("named");
    expect(campusLabel(match, "fr")).toBe("Université Ibn Tofaïl");
    expect(campusTag(match)).toBe("campus:uit");
  });

  it("matches a faculty subdomain without needing its own entry", () => {
    // The whole reason the match is "exact or subdomain": a faculty hands out
    // @fs.uit.ac.ma, and nobody should have to edit a list for each one.
    const match = recognizeCampus("etudiant@fs.uit.ac.ma");
    expect(match.kind).toBe("named");
    expect(campusTag(match)).toBe("campus:uit");
  });

  it("admits a .ac.ma address it cannot name, rather than refusing it", () => {
    // The named list is hand-written and will always be behind reality. A
    // student at a school missing from it has done nothing wrong.
    const match = recognizeCampus("etudiant@une-ecole-inconnue.ac.ma");
    expect(match.kind).toBe("academic");
    expect(isCampusAddress("etudiant@une-ecole-inconnue.ac.ma")).toBe(true);
    // Shown their own domain, never an invented institution name.
    expect(campusLabel(match, "fr")).toBe("une-ecole-inconnue.ac.ma");
  });

  it("gives two faculties of one university two different tags", () => {
    // Deliberate granularity: these are different students with different
    // internship needs, and the digest should be able to tell them apart.
    const a = recognizeCampus("a@ensa.inconnue.ac.ma");
    const b = recognizeCampus("b@fsjes.inconnue.ac.ma");
    expect(campusTag(a)).not.toBe(campusTag(b));
  });

  it("does not claim an institution for a personal address", () => {
    const match = recognizeCampus("someone@gmail.com");
    expect(match.kind).toBe("other");
    // null, not "campus:other" -- a tag is a claim, and there is no claim here.
    expect(campusTag(match)).toBeNull();
    expect(isCampusAddress("someone@gmail.com")).toBe(false);
  });

  it("is not fooled by a domain that merely ends in the suffix text", () => {
    // "notac.ma" ends with "ac.ma" as a string. It is not a subdomain of it.
    expect(recognizeCampus("x@notac.ma").kind).toBe("other");
    expect(recognizeCampus("x@fakeuit.ac.ma.example.com").kind).toBe("other");
  });

  it("reads the domain after the last @, not the first", () => {
    // Splitting on the first @ would read the domain as "b" and turn away a
    // student whose address is unusual but valid.
    expect(emailDomain("a@b@uit.ac.ma")).toBe("uit.ac.ma");
    expect(emailDomain("ETUDIANT@UIT.AC.MA")).toBe("uit.ac.ma");
    expect(emailDomain("etudiant@uit.ac.ma.")).toBe("uit.ac.ma");
    expect(emailDomain("no-at-sign")).toBe("");
  });

  it("survives input that is not an address at all", () => {
    expect(recognizeCampus("").kind).toBe("other");
    expect(recognizeCampus("@").kind).toBe("other");
    expect(campusTag(recognizeCampus(""))).toBeNull();
  });
});

describe("the institution list itself", () => {
  it("produces tags the email provider will accept unchanged", () => {
    // subscribeConvertKit sanitises tags to [a-z0-9_-]; a slug that needs
    // sanitising is a slug that does not match what the tests assert.
    for (const institution of INSTITUTIONS) {
      expect(institution.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("gives every institution at least one domain, and no domain twice", () => {
    // One domain claimed by two institutions means whichever is listed first
    // silently wins and the other is unreachable.
    const seen = new Map<string, string>();
    for (const institution of INSTITUTIONS) {
      expect(institution.domains.length).toBeGreaterThan(0);
      for (const domain of institution.domains) {
        expect(domain).toMatch(/^[a-z0-9.-]+$/);
        expect(domain.startsWith(".")).toBe(false);
        const owner = seen.get(domain);
        expect(owner, `${domain} is claimed by both ${owner} and ${institution.slug}`).toBeUndefined();
        seen.set(domain, institution.slug);
      }
    }
  });

  it("has no two institutions sharing a slug", () => {
    const slugs = INSTITUTIONS.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
