import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Newsletter } from "@/components/newsletter";
import { siteConfig } from "@/config/site";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { NavTabLink } from "@/components/ui/nav-tab-link";
import { MobileQuickNav } from "@/components/mobile-quick-nav";
import { HeaderSettings } from "@/components/ui/header-settings";
import { HeaderSearchForm } from "@/components/ui/header-search-form";
import { HeaderSearchShortcut } from "@/components/ui/header-search-shortcut";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { headers } from "next/headers";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/helpers";
import { feedPath } from "@/lib/feed-paths";
import { getSeoKeywords } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const dict = getDictionary(params.lang);

  return {
    // See the note in src/app/layout.tsx: the long brand suffix cost 28
    // characters on every page and pushed the median title to 97.
    title: {
      default: `AI and Cybersecurity News (${params.lang.toUpperCase()})`,
      template: `%s | AICyber`
    },
    description: dict.home.metaDescription,
    keywords: getSeoKeywords(params.lang, "home"),
    alternates: localizedAlternates("", params.lang)
  };
}

export default async function LocalizedLayout(props: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const params = await props.params;

  const {
    children
  } = props;

  if (!isLocale(params.lang)) notFound();

  const locale: Locale = params.lang;
  const dict = getDictionary(locale);
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;
  // Switch language without losing the page. Falls back to the other home page
  // when the path is unavailable, which is better than a dead link.
  const otherLocale: Locale = locale === "fr" ? "en" : "fr";
  const currentPath = (await headers()).get("x-pathname") || `/${locale}`;
  const otherLocaleHref = currentPath.startsWith(`/${locale}`)
    ? `/${otherLocale}${currentPath.slice(locale.length + 1)}` || `/${otherLocale}`
    : `/${otherLocale}`;

  const donateHref = `/${locale}/donate`;
  const toolsLabel = locale === "fr" ? "Outils" : "Tools";
  const desktopNavActive =
    "rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-2 text-[color:var(--text-strong)] shadow-sm";
  const desktopNavInactive =
    "rounded-xl border border-transparent px-3.5 py-2 text-[color:var(--muted)] hover:border-[color:var(--border)] hover:bg-[color:var(--surface)]/65 hover:text-[color:var(--text-strong)]";
  // tap-target: the tab strip measured 34px tall, on the nav a phone reader
  // uses most.
  const mobileNavActive =
    "tap-target rounded-xl border border-[color:var(--primary)]/35 bg-[color:var(--surface)] px-3 py-2 text-xs font-semibold whitespace-nowrap text-[color:var(--text-strong)] shadow-sm";
  const mobileNavInactive =
    "tap-target rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/55 px-3 py-2 text-xs whitespace-nowrap text-[color:var(--text)]";

  return (
    <>
      <HeaderSearchShortcut locale={locale} />
      <ScrollReveal />
      {/* Sticky from md up only. On a phone this header is five stacked rows —
          logo, scrolling nav pills, two CTAs, the theme control and the search
          field — roughly 500px, well over half of a 844px screen. Pinning that
          meant the reader scrolled content underneath it and saw a sliver of
          page between the header and the floating bottom nav. Mobile already
          has persistent navigation down there, so the top block has no reason
          to follow you; it scrolls away and gives the article the screen. */}
      {/* Opaque on purpose. These panels sit over the page, and at 86% the
          text underneath stayed legible through them — a heading and a nav
          label occupying the same pixels, which reads as a broken layout
          rather than a translucent one. backdrop-blur stays for the edge
          treatment; the background no longer lets the page show through.

          relative matters: dropping sticky on phones left the header
          position: static, and a static element ignores z-index, so z-30 did
          nothing and the settings dropdown inside it lost to the hero h1 in
          paint order. relative restores the stacking context without pinning
          anything — the header still scrolls away. */}
      {/* z-50, not z-30. `relative` makes this a stacking context, so every
          descendant is capped at the header's own layer -- and MobileQuickNav
          is a SIBLING at z-40. The search dropdown asks for z-50 and was still
          painted underneath it, so on a phone a reader tapped a suggestion they
          could see and landed on whichever nav tab was beneath. A wrong
          destination, not just a cosmetic overlap. */}
      <header className="relative md:sticky md:top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] backdrop-blur-2xl">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-6">
          <div className="mb-2 hidden items-center justify-end gap-1 text-sm md:flex">
            {/* A visible language switch. This lived only inside the settings
                panel, so the French edition — every article, translated, for an
                audience of French-speaking students — was reachable only by
                someone who thought to open a gear icon. The differentiator was
                hidden behind a preference. */}
            <Link
              href={otherLocaleHref}
              hrefLang={otherLocale}
              className="utility-link font-semibold"
              aria-label={locale === "fr" ? "Read in English" : "Lire en français"}
            >
              {otherLocale.toUpperCase()}
            </Link>
            <Link href={donateHref} className="utility-link">
              {locale === "fr" ? "Faire un don" : "Donate"}
            </Link>
            <HeaderSettings locale={locale} compact />
          </div>

          <div className="flex items-center gap-2.5 md:gap-3">
            <Link href={`/${locale}`} className="inline-flex shrink-0 items-center gap-3 rounded-xl border border-transparent px-1 py-1 hover:border-[color:var(--border)]">
              {/* The mark, bare. The favicon keeps its pine tile because a tab
                  strip can be any colour; here the page ground is known, so the
                  petals stand on their own and the square would only add a box.
                  aria-hidden because the wordmark beside it already names the
                  site -- two accessible names for one link is noise. */}
              <svg
                className="brand-orb h-6 w-6 shrink-0 md:h-7 md:w-7"
                viewBox="0 0 512 512"
                aria-hidden="true"
                focusable="false"
                fill="currentColor"
                style={{ color: "var(--primary)" }}
              >
                <path d="M256 256 Q178 202 256 96 Q334 202 256 256 Z" />
                <path d="M256 256 Q310 178 416 256 Q310 334 256 256 Z" />
                <path d="M256 256 Q334 310 256 416 Q178 310 256 256 Z" />
                <path d="M256 256 Q202 334 96 256 Q202 178 256 256 Z" />
              </svg>
              <span className="leading-tight">
                {/* Was the string "AI Cybersecurity News", hardcoded, while
                    the footer printed siteConfig.brandName ("AI and
                    Cybersecurity News") and the browser tab said "AICyber" --
                    three names for one site, none of which agreed. The wordmark
                    reads the brand like everything else now. */}
                <span className="font-display block text-base font-bold tracking-tight text-[color:var(--text-strong)] sm:text-lg xl:text-xl">
                  {siteConfig.brandName}
                </span>
                <span className="hidden text-[11px] text-[color:var(--muted)] xl:block">
                  {locale === "fr"
                    ? "Signaux IA + cybersécurité pour builders orientés exécution"
                    : "AI + Cybersecurity Signals for Real Builders"}
                </span>
              </span>
            </Link>

            <HeaderSearchForm locale={locale} />

            <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
              <TrackableAnchor
                href={leadMagnetHref}
                event="lead_magnet_click"
                meta={{ page: "header_cta", locale }}
                className="inline-flex h-11 items-center rounded-2xl border border-[color:var(--primary)] bg-[color:var(--primary)] px-5 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-[0_20px_36px_-24px_color-mix(in_srgb,var(--primary),transparent_30%)] hover:bg-[color:var(--primary-strong)]"
              >
                {dict.nav.stages}
              </TrackableAnchor>
            </div>
          </div>

          <div className="mt-3 hidden border-t border-[color:var(--border)] pt-2 md:block">
            <div className="flex items-center gap-3">
              <nav aria-label="Main navigation" className="flex items-center gap-1 text-sm font-medium">
                <NavTabLink
                  href={`/${locale}/news`}
                  label={dict.nav.news}
                  activeClassName={desktopNavActive}
                  inactiveClassName={desktopNavInactive}
                />
                <NavTabLink
                  href={`/${locale}/blog`}
                  label={dict.nav.blog}
                  activeClassName={desktopNavActive}
                  inactiveClassName={desktopNavInactive}
                />
                <NavTabLink
                  href={`/${locale}/resources`}
                  label={dict.nav.resources}
                  activeClassName={desktopNavActive}
                  inactiveClassName={desktopNavInactive}
                />
                <NavTabLink
                  href={`/${locale}/stages`}
                  label={locale === "fr" ? "Stages" : "Internships"}
                  activeClassName={desktopNavActive}
                  inactiveClassName={desktopNavInactive}
                />
                <NavTabLink
                  href={`/${locale}/compare`}
                  label={toolsLabel}
                  activeClassName={desktopNavActive}
                  inactiveClassName={desktopNavInactive}
                />
                <NavTabLink
                  href={`/${locale}/about`}
                  label={dict.nav.about}
                  activeClassName={desktopNavActive}
                  inactiveClassName={desktopNavInactive}
                />
              </nav>

              <p className="ml-auto hidden max-w-[34rem] text-right text-xs text-[color:var(--muted)] lg:block">
                {locale === "fr"
                  ? "Signaux IA + cybersécurité et guides d'exécution pour toute personne qui construit, apprend, ou travaille avec l'IA"
                  : "AI + Cybersecurity signals and execution guides for anyone who builds, learns, or works with AI"}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-[color:var(--border)] bg-[color:var(--surface)]/35 md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-2">
            <div
            // tabindex + a name, because this strip scrolls further than it
            // shows -- 103px in English, 130px in French, per the measured
            // note in globals.css -- so "Tools" and "About" sit off-screen.
            // A mouse user drags it; without this a keyboard or switch user
            // has no way to scroll the region at all. The same treatment the
            // .reading-prose pre blocks already have.
            tabIndex={0}
            role="group"
            aria-label={locale === "fr" ? "Navigation du site" : "Site navigation"}
            className="edge-fade-x flex snap-x snap-mandatory items-center gap-2 overflow-x-auto scroll-smooth pb-1">
              <NavTabLink
                href={`/${locale}/news`}
                label={dict.nav.news}
                activeClassName={mobileNavActive}
                inactiveClassName={mobileNavInactive}
                className="snap-start"
              />
              <NavTabLink
                href={`/${locale}/blog`}
                label={dict.nav.blog}
                activeClassName={mobileNavActive}
                inactiveClassName={mobileNavInactive}
                className="snap-start"
              />
              <NavTabLink
                href={`/${locale}/resources`}
                label={dict.nav.resources}
                activeClassName={mobileNavActive}
                inactiveClassName={mobileNavInactive}
                className="snap-start"
              />
              <NavTabLink
                href={`/${locale}/stages`}
                label={locale === "fr" ? "Stages" : "Internships"}
                activeClassName={mobileNavActive}
                inactiveClassName={mobileNavInactive}
                className="snap-start"
              />
              <NavTabLink
                href={`/${locale}/compare`}
                label={toolsLabel}
                activeClassName={mobileNavActive}
                inactiveClassName={mobileNavInactive}
                className="snap-start"
              />
              <NavTabLink
                href={`/${locale}/about`}
                label={dict.nav.about}
                activeClassName={mobileNavActive}
                inactiveClassName={mobileNavInactive}
                className="snap-start"
              />
            </div>
            {/* One row, not two.
                The language toggle and the settings button had a 44px row to
                themselves, right-aligned, with roughly 230px of empty space
                beside them -- on a header already taking 270px, a third of a
                360px screen, before the reader sees a single word of the page.
                They sit beside the two actions now. */}
            <div className="mt-2 flex items-center gap-2">
              <TrackableAnchor
                href={leadMagnetHref}
                event="lead_magnet_click"
                meta={{ page: "mobile_nav_cta", locale }}
                className="flex-1 rounded-xl bg-[color:var(--primary)] px-3 py-2 text-center text-xs font-semibold text-[color:var(--primary-foreground)]"
              >
                {dict.nav.stages}
              </TrackableAnchor>
              <Link
                href={donateHref}
                className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/70 px-3 py-2 text-center text-xs text-[color:var(--text)]"
              >
                {locale === "fr" ? "Don" : "Donate"}
              </Link>
              <Link
                href={otherLocaleHref}
                hrefLang={otherLocale}
                className="tap-target shrink-0 rounded-lg border border-[color:var(--border)] px-2.5 py-1 text-xs font-semibold text-[color:var(--text)]"
                aria-label={locale === "fr" ? "Read in English" : "Lire en français"}
              >
                {otherLocale.toUpperCase()}
              </Link>
              <HeaderSettings locale={locale} compact />
            </div>
            <HeaderSearchForm locale={locale} mobile />
          </div>
        </div>
      </header>
      <div className="lg:mx-auto lg:flex lg:max-w-[1600px] lg:items-start lg:justify-center lg:px-4">
        {/* tabIndex={-1} is what makes "Skip to content" actually skip. Without
            it, activating the link only moves the browser's sequential-focus
            starting point: document.activeElement stayed on <body>, so a screen
            reader's focus never left the header and the reader had to walk the
            whole nav again. A negative tabindex makes <main> a valid focus
            target without adding a tab stop. */}
        <main id="main-content" tabIndex={-1} lang={locale} className="anchor-offset pb-24 md:pb-0 lg:min-w-0 lg:flex-1">
          {children}
        </main>
      </div>
      <MobileQuickNav locale={locale} />
      <footer className="mt-24 border-t border-[color:var(--border)] bg-[color:var(--surface-strong)]">
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <section className="do-hero rounded-2xl p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-[1fr,auto] md:items-center">
              <div>
                <p className="do-kicker">{locale === "fr" ? "Passage à l'action" : "Next step"}</p>
                <h2 className="font-display mt-1 text-2xl font-semibold text-[color:var(--text-strong)]">
                  {locale === "fr" ? "Transformez votre veille en exécution concrète" : "Turn your weekly learning into execution"}
                </h2>
                <p className="mt-2 text-sm text-[color:var(--text)]">
                  {locale === "fr"
                    ? "Voyez les stages ouverts et utilisez les ressources pour livrer plus vite."
                    : "See the open internships and use curated resources to ship faster."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <TrackableAnchor href={leadMagnetHref} event="lead_magnet_click" meta={{ page: "footer_cta", locale }} className="btn-primary">
                  {dict.nav.stages}
                </TrackableAnchor>
                <Link href={`/${locale}/resources`} className="btn-secondary">
                  {dict.nav.resources}
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/*
          * Two columns at tablet width, four only once there is room.
          *
          * md: is 768px, and four columns there left 150px each after the
          * padding and gaps -- which broke four things at once on all 278
          * pages: the contact address is 190px wide and ran flush into the
          * newsletter card beside it, the footer email input shrank to 33px so
          * its placeholder rendered as the single letter "y" (and to nothing at
          * all in French), the compact Turnstile had 50px of the Cloudflare
          * panel cut off, and the French newsletter heading wrapped to six
          * lines.
          */}
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-xl font-semibold text-[color:var(--text-strong)]">{dict.footer.title}</p>
            <p className="mt-3 text-sm text-[color:var(--muted)]">{dict.footer.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] text-[color:var(--muted)]">
                {locale === "fr" ? "Stages vérifiés chaque semaine" : "Internships checked weekly"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] text-[color:var(--muted)]">
                {locale === "fr" ? "Exécution IA + cybersécurité" : "AI + cybersecurity execution"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">{dict.footer.resources}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>
                <Link href={`/${locale}/news`} className="transition hover:text-[color:var(--text-strong)]">
                  {dict.nav.news}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/blog`} className="transition hover:text-[color:var(--text-strong)]">
                  {dict.footer.tutorials}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/resources`} className="transition hover:text-[color:var(--text-strong)]">
                  {dict.footer.tools}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/compare`} className="transition hover:text-[color:var(--text-strong)]">
                  {toolsLabel}
                </Link>
              </li>
              <li>
                <TrackableAnchor
                  href={leadMagnetHref}
                  event="lead_magnet_click"
                  meta={{ page: "footer_links", locale }}
                  className="transition hover:text-[color:var(--text-strong)]"
                >
                  {dict.footer.stages}
                </TrackableAnchor>
              </li>
              <li>
                <a href={feedPath[locale]} className="transition hover:text-[color:var(--text-strong)]">
                  RSS
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">{dict.footer.contact}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>
                {/* break-all: the address is one unbreakable 190px token, so
                    in a narrow column it overran rather than wrapped. */}
                <a href={`mailto:${siteConfig.contactEmail}`} className="break-all transition hover:text-[color:var(--text-strong)]">
                  {siteConfig.contactEmail}
                </a>
              </li>
              {siteConfig.linkedinUrl ? (
              <li>
                <a
                  href={siteConfig.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[color:var(--text-strong)]"
                >
                  LinkedIn
                </a>
              </li>
              ) : null}
              <li>
                <Link href={`/${locale}/donate`} className="transition hover:text-[color:var(--text-strong)]">
                  {locale === "fr" ? "Faire un don" : "Donate"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/affiliate-disclosure`} className="transition hover:text-[color:var(--text-strong)]">
                  {locale === "fr" ? "Politique de liens" : "Link policy"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="transition hover:text-[color:var(--text-strong)]">
                  {locale === "fr" ? "Confidentialité" : "Privacy"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="transition hover:text-[color:var(--text-strong)]">
                  {locale === "fr" ? "Conditions" : "Terms"}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <Newsletter compact locale={locale} source="footer" />
          </div>
        </div>
        <div className="border-t border-[color:var(--border)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-5 text-xs text-[color:var(--muted)]">
            <p>
              Copyright {new Date().getFullYear()} {siteConfig.brandName} ({siteConfig.legalName}). {dict.footer.copyright}
            </p>
            <p>
              {locale === "fr"
                ? "Construit pour toute personne qui apprend ou construit avec l'IA et la cybersécurité."
                : "Built for anyone learning or building with AI and cybersecurity."}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
