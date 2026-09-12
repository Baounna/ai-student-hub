import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { siteConfig } from "@/config/site";
import { getGa4MeasurementId, isGa4Enabled } from "@/lib/runtime-config";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import { assertProductionRuntimeConfig } from "@/lib/env-validation";
import "./globals.css";

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
  applicationName: "AI and Cybersecurity News",
  category: "education",
  creator: "AI and Cybersecurity News",
  publisher: "AI and Cybersecurity News",
  authors: [{ name: "AI and Cybersecurity News", url: getSiteUrl() }],
  title: {
    default: "AI and Cybersecurity News | AI + Cybersecurity Signals for Real Builders",
    template: "%s | AI and Cybersecurity News"
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
    "student AI roadmap",
    "AI and cybersecurity news",
    "AI tools comparison"
  ],
  openGraph: {
    title: "AI and Cybersecurity News | AI + Cybersecurity Signals for Real Builders",
    description:
      "AI + Cybersecurity Signals for Real Builders. Trusted updates, practical tools, and execution guides for anyone who builds, learns, or works with AI.",
    type: "website",
    url: "/",
    siteName: "AI and Cybersecurity News"
  },
  twitter: {
    card: "summary_large_image",
    title: "AI and Cybersecurity News | AI + Cybersecurity Signals for Real Builders",
    description:
      "AI + Cybersecurity Signals for Real Builders. Trusted updates, practical tools, and execution guides for anyone who builds, learns, or works with AI."
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg"
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-csp-nonce") || undefined;
  const ga4Enabled = isGa4Enabled();
  const ga4MeasurementId = getGa4MeasurementId();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
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
    sameAs: siteConfig.linkedinUrl ? [siteConfig.linkedinUrl] : undefined
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AI and Cybersecurity News",
    url: getSiteUrl(),
    inLanguage: ["en", "fr"]
  };

  return (
    <html
      lang="en"
      data-theme="dark"
      data-text-size="medium"
      data-content-width="standard"
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Script id="theme-init" strategy="beforeInteractive" nonce={nonce}>
          {`(() => {
            try {
              const storedThemePreference = localStorage.getItem('appearance_theme_preference');
              const resolvedAutoTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
              const storedTheme = localStorage.getItem('theme');
              const theme = storedThemePreference === 'auto'
                ? resolvedAutoTheme
                : storedThemePreference === 'light' || storedThemePreference === 'dark'
                  ? storedThemePreference
                  : storedTheme === 'light'
                    ? 'light'
                    : 'dark';
              document.documentElement.setAttribute('data-theme', theme);

              const storedTextSize = localStorage.getItem('appearance_text_size');
              const textSize = storedTextSize === 'small' || storedTextSize === 'large' ? storedTextSize : 'medium';
              document.documentElement.setAttribute('data-text-size', textSize);

              const storedWidth = localStorage.getItem('appearance_content_width');
              const contentWidth = storedWidth === 'wide' ? 'wide' : 'standard';
              document.documentElement.setAttribute('data-content-width', contentWidth);
            } catch (_) {
              document.documentElement.setAttribute('data-theme', 'dark');
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
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
