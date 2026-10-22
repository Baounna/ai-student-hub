import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { ReactNode } from "react";
import { isValidElement } from "react";
import { locales, type Locale } from "@/i18n/config";

/**
 * The privacy policy said flatly that the site does not use Google Analytics,
 * and called its analytics cookieless in the legal-basis paragraph. Both were
 * sentences, while the root layout injects googletagmanager.com/gtag/js the
 * moment ANALYTICS_MODE=ga4 and a valid GA4_MEASUREMENT_ID are set in the
 * Vercel dashboard. Production sets neither, so the claim was true by luck --
 * the same luck tests/paid-links.test.ts was written for, one dashboard click
 * from a legal page denying a tracker that is running on every page of it.
 *
 * So the page is rendered under both conditions and read.
 */
function textOf(node: ReactNode): string[] {
  if (node === null || node === undefined || typeof node === "boolean") return [];
  if (typeof node === "string") return [node];
  if (typeof node === "number") return [String(node)];
  if (Array.isArray(node)) return node.flatMap(textOf);
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return textOf(props.children ?? null);
  }
  return [];
}

async function policyText(lang: Locale): Promise<string> {
  vi.resetModules();
  const mod = await import("../src/app/[lang]/privacy/page");
  const page = mod.default as (props: { params: Promise<{ lang: string }> }) => Promise<ReactNode>;
  return textOf(await page({ params: Promise.resolve({ lang }) })).join(" ");
}

const DENIES_GA = {
  en: /does not use Google Analytics/i,
  fr: /n'utilise pas Google Analytics/i
};

const NAMES_GA = {
  en: /Google Analytics[^.]*loaded on every page/i,
  fr: /Google Analytics est en revanche chargé sur chaque page/i
};

describe("the privacy policy's analytics claim", () => {
  beforeEach(() => {
    vi.stubEnv("ANALYTICS_MODE", "");
    vi.stubEnv("GA4_MEASUREMENT_ID", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("denies Google Analytics only while there is none", async () => {
    for (const locale of locales) {
      const text = await policyText(locale);
      expect(text).toMatch(DENIES_GA[locale]);
      expect(text).not.toMatch(NAMES_GA[locale]);
    }
  });

  it("stops denying it, in both languages, the moment the variables are set", async () => {
    vi.stubEnv("ANALYTICS_MODE", "ga4");
    vi.stubEnv("GA4_MEASUREMENT_ID", "G-ABC1234567");
    for (const locale of locales) {
      const text = await policyText(locale);
      expect(text).not.toMatch(DENIES_GA[locale]);
      // Silence is not disclosure: the page has to name what is running.
      expect(text).toMatch(NAMES_GA[locale]);
      // And the legal basis cannot still call the measurement cookieless when
      // gtag is setting cookies on every page.
      expect(text).toMatch(locale === "fr" ? /dépose des cookies/i : /does set cookies/i);
    }
  });

  it("keeps denying it for a measurement id that can never report", async () => {
    // The placeholder in .env.example. isGa4Enabled refuses it, the layout
    // loads nothing, and the policy must say so rather than warning about a
    // tracker that is not there.
    vi.stubEnv("ANALYTICS_MODE", "ga4");
    vi.stubEnv("GA4_MEASUREMENT_ID", "G-REPLACE1234");
    expect(await policyText("en")).toMatch(DENIES_GA.en);
  });
});
