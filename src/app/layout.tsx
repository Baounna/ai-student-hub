import type { Metadata } from "next";
import Script from "next/script";
import { Newsreader, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import { headers } from "next/headers";
import { siteConfig } from "@/config/site";
import { getGa4MeasurementId, isGa4Enabled } from "@/lib/runtime-config";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import { assertProductionRuntimeConfig } from "@/lib/env-validation";
import { AppearanceSync } from "@/components/appearance-sync";
import { jsonLd } from "@/lib/json-ld";
import { schemaIds } from "@/lib/schema";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Self-hosted by next/font so every visitor gets the same typography.
// Previously the CSS named IBM Plex Sans and Sora but nothing loaded them,
// so each OS silently substituted its own fallback.
// Newsreader and Public Sans are variable fonts. Naming four static weights
// each shipped four separate files per unicode range; omitting weight ships one
// file that covers the whole axis, so the browser stops fetching a new download
// every time a heading changes weight. IBM Plex Mono has no variable cut on
// Google Fonts, so it stays static — trimmed to the one weight anything asks
// for, since the extra two were downloads nothing on the site could render.
const display = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display"
});

const body = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body"
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-meta"
});

const fontVariables = `${display.variable} ${body.variable} ${mono.variable}`;

function getMetadataVerification(): Metadata["verification"] | undefined {
  const google = (process.env.GOOGLE_SITE_VERIFICATION || "").trim();
  const bing = (process.env.BING_SITE_VERIFICATION || "").trim();
  const yandex = (process.env.YANDEX_SITE_VERIFICATION || "").trim();
  const baidu = (process.env.BAIDU_SITE_VERIFICATION || "").trim();

  const verification: Metadata["verification"] = {};

  if (google) verification.google = google;
  if (yandex) verification.yandex = yandex;

  const other: Record<string, string | string[]> = {};
  if (bing) other["msvalidate.01"] = bing;
  if (baidu) other["baidu-site-verification"] = baidu;
  if (Object.keys(other).length) verification.other = other;

  return Object.keys(verification).length ? verification : undefined;
}

const metadataVerification = getMetadataVerification();
assertProductionRuntimeConfig();

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: siteConfig.brandName,
  category: "education",
  creator: siteConfig.brandName,
  publisher: siteConfig.brandName,
  authors: [{ name: siteConfig.authorName || siteConfig.brandName, url: getSiteUrl() }],
  // The suffix used to be " | AI and Cybersecurity News" — 28 characters on
  // every one of 245 pages, against a budget Google truncates at roughly 60.
  // On the home page it named the brand twice. A short mark keeps the
  // attribution a reader wants without spending half the title on it.
  title: {
    default: "AI + Cybersecurity Signals for Real Builders",
    template: "%s | AICyber"
  },
  description:
    "AI + Cybersecurity Signals for Real Builders. Trusted updates, practical tools, and execution guides for anyone who builds, learns, or works with AI.",
  keywords: [
    "AI news",
    "AI tools",
    "AI updates",
    "machine learning releases",
    "cybersecurity news",
    "developer tools",
    "AI + Cybersecurity execution guides",
    "budget-friendly AI tools",
    "student AI and cybersecurity internships",
    "AI and cybersecurity news",
    "AI tools comparison"
  ],
  openGraph: {
    title: "AI and Cybersecurity News | AI + Cybersecurity Signals for Real Builders",
    description:
      "AI + Cybersecurity Signals for Real Builders. Trusted updates, practical tools, and execution guides for anyone who builds, learns, or works with AI.",
    type: "website",
    url: "/",
    siteName: siteConfig.brandName
  },
  twitter: {
    card: "summary_large_image",
    title: "AI and Cybersecurity News | AI + Cybersecurity Signals for Real Builders",
    description:
      "AI + Cybersecurity Signals for Real Builders. Trusted updates, practical tools, and execution guides for anyone who builds, learns, or works with AI."
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" }
    ],
    shortcut: "/icon.svg",
    // Both of these 404'd. iOS uses apple-touch-icon when a reader adds the
    // site to a home screen, and with none it screenshots the page instead.
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml"
    }
  },
  verification: metadataVerification
};

/**
 * The document language, read from the path.
 *
 * This was hardcoded to "en", so all 122 French pages announced themselves as
 * English. A screen reader then pronounces French with English phonetics, and
 * the declaration contradicts the hreflang set on the very same page. The root
 * layout cannot see route params — [lang] is nested below it — so it reads the
 * pathname middleware already passes through.
 */
function documentLanguage(pathname: string | null) {
  const segment = (pathname || "").split("/").filter(Boolean)[0];
  return segment === "fr" ? "fr" : "en";
}

/**
 * This await makes every page dynamic, and that is deliberate. It looks like
 * the obvious thing to delete for cacheability, so here is why it has to stay.
 *
 * Next injects the CSP nonce into its own inline scripts by reading the
 * Content-Security-Policy out of the *request* headers, which only exists at
 * request time. Three inline scripts ship on every page and all three are
 * executable JavaScript, not data: the theme-init beforeInteractive script,
 * the Next bootstrap, and the 81 KB RSC flight payload. Under our
 * script-src 'self' 'nonce-...' — no unsafe-inline, enforced by
 * scripts/verify-security.mjs — an inline script without a matching nonce is
 * blocked outright.
 *
 * So if these pages were allowed to prerender, Next would emit those three
 * scripts with no nonce while middleware still stamped a fresh nonce into the
 * response CSP, and nothing would hydrate. Static rendering and a nonce CSP
 * are mutually exclusive here by construction. The nonce is what makes the
 * pages uncacheable; headers() is only how it arrives.
 *
 * The ways out were all measured and rejected: 'unsafe-inline' is a real
 * weakening and the security check fails the build on it; hash-based CSP
 * cannot work because the flight payload differs per page and per build;
 * PPR does not help, since the prerendered shell carries the same bootstrap;
 * and caching one response reuses its nonce, which defeats the point of
 * having one. If render cost ever becomes the actual problem, reduce
 * per-request work rather than chasing cache hits.
 */
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-csp-nonce") || undefined;
  const lang = documentLanguage(requestHeaders.get("x-pathname"));
  const ga4Enabled = isGa4Enabled();
  const ga4MeasurementId = getGa4MeasurementId();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    // The one @id every article's publisher and author point at. Without it each
    // page described this organization twice with nothing tying the two
    // descriptions together.
    "@id": schemaIds.organization(),
    name: siteConfig.brandName,
    url: getSiteUrl(),
    logo: absoluteUrl("/icon.svg"),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: siteConfig.contactEmail
      }
    ],
    // Only ever a real profile URL — profileUrl() rejects bare hosts, so this
    // is omitted rather than claiming the publisher is linkedin.com.
    sameAs: siteConfig.linkedinUrl ? [siteConfig.linkedinUrl] : undefined,
    founder: siteConfig.authorName
      ? {
          "@type": "Person",
          name: siteConfig.authorName,
          ...(siteConfig.linkedinUrl ? { sameAs: [siteConfig.linkedinUrl] } : {})
        }
      : undefined
  };
  /**
   * One WebSite node for the whole site.
   *
   * The home page declared a second one -- same name, url of /en rather than
   * the origin, no @id on either -- so /en and /fr each shipped two WebSite
   * entities that nothing tied together. That is a duplicate-entity smell and
   * it is the kind of thing that costs a sitelinks searchbox. The SearchAction
   * it carried was the only part the layout lacked, and it is site-wide, so it
   * lives here now with a target in the reader's own language.
   */
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": schemaIds.website(),
    name: siteConfig.brandName,
    url: getSiteUrl(),
    inLanguage: ["en", "fr"],
    publisher: { "@id": schemaIds.organization() },
    potentialAction: {
      "@type": "SearchAction",
      target: `${getSiteUrl()}/${lang}/blog?query={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };


  return (
    <html
      lang={lang}
      className={fontVariables}
      data-theme="light"
      data-text-size="medium"
      data-content-width="standard"
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema) }}
        />
        <Script id="theme-init" strategy="beforeInteractive" nonce={nonce}>
          {`(() => {
            try {
              const storedThemePreference = localStorage.getItem('appearance_theme_preference');
              const resolvedAutoTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              const storedTheme = localStorage.getItem('theme');
              const theme = storedThemePreference === 'auto'
                ? resolvedAutoTheme
                : storedThemePreference === 'light' || storedThemePreference === 'dark'
                  ? storedThemePreference
                  : storedTheme === 'dark'
                    ? 'dark'
                    : 'light';
              document.documentElement.setAttribute('data-theme', theme);

              const storedTextSize = localStorage.getItem('appearance_text_size');
              const textSize = storedTextSize === 'small' || storedTextSize === 'large' ? storedTextSize : 'medium';
              document.documentElement.setAttribute('data-text-size', textSize);

              const storedWidth = localStorage.getItem('appearance_content_width');
              const contentWidth = storedWidth === 'wide' ? 'wide' : 'standard';
              document.documentElement.setAttribute('data-content-width', contentWidth);
            } catch (_) {
              document.documentElement.setAttribute('data-theme', 'light');
              document.documentElement.setAttribute('data-text-size', 'medium');
              document.documentElement.setAttribute('data-content-width', 'standard');
            }
          })();`}
        </Script>
        {ga4Enabled ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`}
              strategy="afterInteractive"
              nonce={nonce}
            />
            <Script id="ga4-init" strategy="afterInteractive" nonce={nonce}>
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga4MeasurementId}', { anonymize_ip: true });`}
            </Script>
          </>
        ) : null}
      </head>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[color:var(--surface-strong)] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[color:var(--text-strong)]"
        >
          {/* The root layout is locale-agnostic, so this was hardcoded English
              and the very first tab stop on every /fr page was untranslated --
              WCAG 3.1.2, on the one control a keyboard user meets first. The
              document language is already derived from the path a few lines up
              for the html lang attribute; reuse it. */}
          {lang === "fr" ? "Aller au contenu" : "Skip to content"}
        </a>
        {/* Applies the stored theme on responses where the beforeInteractive
            script above is never served -- a 404 is one. See
            applyStoredAppearance. A no-op on every other page. */}
        <AppearanceSync />
        {children}
        {/* Until now nothing measured whether any of this was read. The script
            and its beacons are same-origin (/_vercel/insights/*), so the
            nonce-based CSP already allows them under 'self' — no policy change,
            and nothing to silently fail. */}
        <Analytics />
      </body>
    </html>
  );
}
