import type { Metadata } from "next";
import Script from "next/script";
import { siteConfig } from "@/config/site";
import { getGa4MeasurementId, isGa4Enabled } from "@/lib/runtime-config";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
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

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: "AI Student Hub",
  category: "education",
  creator: "AI Student Hub",
  publisher: "AI Student Hub",
  authors: [{ name: "AI Student Hub", url: getSiteUrl() }],
  title: {
    default: "AI Student Hub | AI Engineering Blog for Students",
    template: "%s | AI Student Hub"
  },
  description:
    "Project-first AI tutorials, portfolio frameworks, and internship-ready engineering systems for students.",
  keywords: [
    "AI engineering blog",
    "AI projects for students",
    "machine learning internships",
    "student AI portfolio",
    "AI and computer science news",
    "AI tools comparison for students"
  ],
  openGraph: {
    title: "AI Student Hub | AI Engineering Blog for Students",
    description:
      "Project-first AI tutorials, portfolio frameworks, and internship-ready engineering systems for students.",
    type: "website",
    url: "/",
    siteName: "AI Student Hub"
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Student Hub | AI Engineering Blog for Students",
    description:
      "Project-first AI tutorials, portfolio frameworks, and internship-ready engineering systems for students."
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
    name: "AI Student Hub",
    url: getSiteUrl(),
    inLanguage: ["en", "fr"]
  };

  return (
    <html
      lang="en"
      data-theme="dark"
      data-text-size="medium"
      data-content-width="standard"
      data-appearance-panel="visible"
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Script id="theme-init" strategy="beforeInteractive">
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

              const storedAppearancePanel = localStorage.getItem('appearance_panel');
              const appearancePanel = storedAppearancePanel === 'hidden' ? 'hidden' : 'visible';
              document.documentElement.setAttribute('data-appearance-panel', appearancePanel);
            } catch (_) {
              document.documentElement.setAttribute('data-theme', 'dark');
              document.documentElement.setAttribute('data-text-size', 'medium');
              document.documentElement.setAttribute('data-content-width', 'standard');
              document.documentElement.setAttribute('data-appearance-panel', 'visible');
            }
          })();`}
        </Script>
        {ga4Enabled ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
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
