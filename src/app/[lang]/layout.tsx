import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Newsletter } from "@/components/newsletter";
import { siteConfig } from "@/config/site";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { NavTabLink } from "@/components/ui/nav-tab-link";
import { MobileQuickNav } from "@/components/mobile-quick-nav";
import { AuthLinks } from "@/components/ui/auth-links";
import { HeaderSettings } from "@/components/ui/header-settings";
import { HeaderSearchForm } from "@/components/ui/header-search-form";
import { HeaderSearchShortcut } from "@/components/ui/header-search-shortcut";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const dict = getDictionary(params.lang);

  return {
    title: {
      default: `AI and Cybersecurity News (${params.lang.toUpperCase()})`,
      template: `%s | AI and Cybersecurity News`
    },
    description: dict.home.subheadline,
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
  const donateHref = `/${locale}/donate`;
  const toolsLabel = locale === "fr" ? "Outils" : "Tools";
  const desktopNavActive =
    "rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-2 text-[color:var(--text-strong)] shadow-sm";
  const desktopNavInactive =
    "rounded-xl border border-transparent px-3.5 py-2 text-[color:var(--muted)] hover:border-[color:var(--border)] hover:bg-[color:var(--surface)]/65 hover:text-[color:var(--text-strong)]";
  const mobileNavActive =
    "rounded-xl border border-[color:var(--primary)]/35 bg-[color:var(--surface)] px-3 py-2 text-xs font-semibold whitespace-nowrap text-[color:var(--text-strong)] shadow-sm";
  const mobileNavInactive =
    "rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/55 px-3 py-2 text-xs whitespace-nowrap text-[color:var(--text)]";

  return (
    <>
      <HeaderSearchShortcut locale={locale} />
      <ScrollReveal />
      <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--surface-strong)]/86 backdrop-blur-2xl">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-6">
          <div className="mb-2 hidden items-center justify-end gap-1 text-sm md:flex">
            <Link href={donateHref} className="utility-link">
              {locale === "fr" ? "Faire un don" : "Donate"}
            </Link>
            <AuthLinks locale={locale} />
            <HeaderSettings locale={locale} compact />
          </div>

          <div className="flex items-center gap-2.5 md:gap-3">
            <Link href={`/${locale}`} className="inline-flex shrink-0 items-center gap-3 rounded-xl border border-transparent px-1 py-1 hover:border-[color:var(--border)]">
              <span className="brand-orb inline-block h-3.5 w-3.5 rounded-full bg-[color:var(--primary)] shadow-[0_0_0_6px_color-mix(in_srgb,var(--primary),transparent_86%)]" />
              <span className="leading-tight">
                <span className="font-display block text-base font-bold tracking-tight text-[color:var(--text-strong)] sm:text-lg xl:text-xl">
                  AI Cybersecurity News
                </span>
                <span className="hidden text-[11px] text-[color:var(--muted)] xl:block">
                  {locale === "fr"
                    ? "Signaux IA + cybersecurite pour builders orientes execution"
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
                {dict.nav.roadmap}
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
                  ? "Signaux IA + cybersecurite et guides d'execution pour toute personne qui construit, apprend, ou travaille avec l'IA"
                  : "AI + Cybersecurity signals and execution guides for anyone who builds, learns, or works with AI"}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-[color:var(--border)] bg-[color:var(--surface)]/35 md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-2">
            <div className="flex snap-x snap-mandatory items-center gap-2 overflow-x-auto scroll-smooth pb-1">
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
            <div className="mt-2 grid grid-cols-2 gap-2">
              <TrackableAnchor
                href={leadMagnetHref}
                event="lead_magnet_click"
                meta={{ page: "mobile_nav_cta", locale }}
                className="rounded-xl bg-[color:var(--primary)] px-3 py-2 text-center text-xs font-semibold text-[color:var(--primary-foreground)]"
              >
                {dict.nav.roadmap}
              </TrackableAnchor>
              <Link
                href={donateHref}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/70 px-3 py-2 text-center text-xs text-[color:var(--text)]"
              >
                {locale === "fr" ? "Don" : "Donate"}
              </Link>
            </div>
            <div className="mt-2 flex justify-end">
              <HeaderSettings locale={locale} compact />
            </div>
            <HeaderSearchForm locale={locale} mobile />
          </div>
        </div>
      </header>
      <div className="lg:mx-auto lg:flex lg:max-w-[1600px] lg:items-start lg:justify-center lg:px-4">
        <main id="main-content" lang={locale} className="pb-24 md:pb-0 lg:min-w-0 lg:flex-1">
          {children}
        </main>
      </div>
      <MobileQuickNav locale={locale} />
      <footer className="mt-24 border-t border-[color:var(--border)] bg-[color:var(--surface-strong)]">
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <section className="do-hero rounded-2xl p-5 md:p-6">
            <div className="grid gap-4 md:grid-cols-[1fr,auto] md:items-center">
              <div>
                <p className="do-kicker">{locale === "fr" ? "Passage a l'action" : "Next step"}</p>
                <h2 className="font-display mt-1 text-2xl font-semibold text-[color:var(--text-strong)]">
                  {locale === "fr" ? "Transforme ta veille en execution concrete" : "Turn your weekly learning into execution"}
                </h2>
                <p className="mt-2 text-sm text-[color:var(--text)]">
                  {locale === "fr"
                    ? "Recois la roadmap gratuite et utilise les resources pour shipper plus vite."
                    : "Get the free roadmap and use curated resources to ship faster."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <TrackableAnchor href={leadMagnetHref} event="lead_magnet_click" meta={{ page: "footer_cta", locale }} className="btn-primary">
                  {dict.nav.roadmap}
                </TrackableAnchor>
                <Link href={`/${locale}/resources`} className="btn-secondary">
                  {dict.nav.resources}
                </Link>
              </div>
            </div>
          </section>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-4">
          <div>
            <p className="font-display text-xl font-semibold text-[color:var(--text-strong)]">{dict.footer.title}</p>
            <p className="mt-3 text-sm text-[color:var(--muted)]">{dict.footer.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] text-[color:var(--muted)]">
                {locale === "fr" ? "Briefs hebdomadaires" : "Weekly briefs"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] text-[color:var(--muted)]">
                {locale === "fr" ? "Execution IA + cybersecurite" : "AI + cybersecurity execution"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">{dict.footer.resources}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>
                <Link href={`/${locale}/news`} className="transition hover:opacity-70">
                  {dict.nav.news}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/blog`} className="transition hover:opacity-70">
                  {dict.footer.tutorials}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/resources`} className="transition hover:opacity-70">
                  {dict.footer.tools}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/compare`} className="transition hover:opacity-70">
                  {toolsLabel}
                </Link>
              </li>
              <li>
                <TrackableAnchor
                  href={leadMagnetHref}
                  event="lead_magnet_click"
                  meta={{ page: "footer_links", locale }}
                  className="transition hover:opacity-70"
                >
                  {dict.footer.roadmap}
                </TrackableAnchor>
              </li>
              <li>
                <a href="/feed.xml" className="transition hover:opacity-70">
                  RSS Feed
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">{dict.footer.contact}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>
                <a href={`mailto:${siteConfig.contactEmail}`} className="transition hover:opacity-70">
                  {siteConfig.contactEmail}
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:opacity-70"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <Link href={`/${locale}/donate`} className="transition hover:opacity-70">
                  {locale === "fr" ? "Faire un don" : "Donate"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/affiliate-disclosure`} className="transition hover:opacity-70">
                  {locale === "fr" ? "Divulgation d'affiliation" : "Affiliate Disclosure"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="transition hover:opacity-70">
                  {locale === "fr" ? "Confidentialite" : "Privacy"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="transition hover:opacity-70">
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
                ? "Construit pour toute personne qui apprend ou construit avec l'IA et la cybersecurite."
                : "Built for anyone learning or building with AI and cybersecurity."}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
