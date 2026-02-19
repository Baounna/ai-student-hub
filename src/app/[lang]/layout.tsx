import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Newsletter } from "@/components/newsletter";
import { siteConfig } from "@/config/site";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { NavTabLink } from "@/components/ui/nav-tab-link";
import { MobileQuickNav } from "@/components/mobile-quick-nav";
import { AppearancePanel } from "@/components/ui/appearance-panel";
import { AuthLinks } from "@/components/ui/auth-links";
import { HeaderSearchShortcut } from "@/components/ui/header-search-shortcut";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { alternateLanguages } from "@/i18n/helpers";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  const dict = getDictionary(params.lang);

  return {
    title: {
      default: `AI Student Hub (${params.lang.toUpperCase()})`,
      template: `%s | AI Student Hub`
    },
    description: dict.home.subheadline,
    alternates: {
      languages: alternateLanguages("")
    }
  };
}

export default function LocalizedLayout({ children, params }: { children: React.ReactNode; params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();

  const locale: Locale = params.lang;
  const dict = getDictionary(locale);
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;
  const donateHref = `/${locale}/donate`;
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
      <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--surface-strong)]/86 backdrop-blur-2xl">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-6">
          <div className="mb-2 hidden items-center justify-end gap-1 text-sm md:flex">
            <Link href={donateHref} className="utility-link">
              {locale === "fr" ? "Faire un don" : "Donate"}
            </Link>
            <AuthLinks locale={locale} />
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/${locale}`} className="inline-flex shrink-0 items-center gap-3 rounded-xl border border-transparent px-1 py-1 hover:border-[color:var(--border)]">
              <span className="inline-block h-3.5 w-3.5 rounded-full bg-[color:var(--primary)] shadow-[0_0_0_6px_color-mix(in_srgb,var(--primary),transparent_86%)]" />
              <span className="leading-tight">
                <span className="font-display block text-xl font-bold tracking-tight text-[color:var(--text-strong)]">
                  AI Student Hub
                </span>
                <span className="hidden text-[11px] text-[color:var(--muted)] xl:block">
                  {locale === "fr" ? "Base de connaissances IA orientee execution" : "Execution-first AI knowledge base"}
                </span>
              </span>
            </Link>

            <form action={`/${locale}/blog`} method="get" className="hidden min-w-0 flex-1 items-stretch lg:flex lg:max-w-2xl">
              <label htmlFor={`header-search-${locale}`} className="sr-only">
                {locale === "fr" ? "Rechercher" : "Search"}
              </label>
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--muted)]">
                  <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4">
                    <path
                      d="M8.75 3.5a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Zm-6.75 5.25a6.75 6.75 0 1 1 11.93 4.33l3.49 3.49a.75.75 0 1 1-1.06 1.06l-3.49-3.49A6.75 6.75 0 0 1 2 8.75Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <input
                  id={`header-search-${locale}`}
                  name="query"
                  type="search"
                  placeholder={locale === "fr" ? "Rechercher IA, MLOps, stages..." : "Search AI, MLOps, internships..."}
                  className="h-11 w-full rounded-l-2xl border border-[color:var(--border)] bg-[color:var(--surface)] pl-10 pr-11 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)] focus:border-[color:var(--primary)]/42"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-[color:var(--border)] px-1.5 py-0.5 text-[10px] text-[color:var(--muted)] xl:inline-flex">
                  /
                </span>
              </div>
              <button type="submit" className="btn-secondary h-11 rounded-r-2xl border-l-0 px-6 py-0">
                {locale === "fr" ? "Rechercher" : "Search"}
              </button>
            </form>

            <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
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
                  label={locale === "fr" ? "Comparer" : "Compare"}
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

              <p className="ml-auto hidden text-xs text-[color:var(--muted)] lg:block">
                {locale === "fr"
                  ? "Actualites IA/CS + guides execution pour etudiants"
                  : "AI/CS news and execution guides for students"}
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
                label={locale === "fr" ? "Comparer" : "Compare"}
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
            <div className="mt-2 grid grid-cols-[1.5fr,1fr,1fr] gap-2">
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
              <Link
                href={`/${locale}/account`}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/70 px-3 py-2 text-center text-xs text-[color:var(--text)]"
              >
                {locale === "fr" ? "Compte" : "Account"}
              </Link>
            </div>
          </div>
        </div>
      </header>
      <div className="xl:mx-auto xl:grid xl:max-w-[1600px] xl:grid-cols-[minmax(0,1fr)_14rem] xl:items-start xl:gap-6 xl:px-4">
        <main id="main-content" lang={locale} className="pb-24 md:pb-0">
          {children}
        </main>
        <aside className="hidden xl:block xl:self-start xl:pt-4">
          <div className="sticky top-[160px] pb-10">
            <AppearancePanel locale={locale} />
          </div>
        </aside>
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
                {locale === "fr" ? "Execution IA/CS" : "AI/CS execution"}
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
                  {locale === "fr" ? "Comparatifs" : "Compare"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/growth-sprint`} className="transition hover:opacity-70">
                  {locale === "fr" ? "Sprint 14 jours" : "14-day sprint"}
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
              Copyright {new Date().getFullYear()} AI Student Hub ({siteConfig.legalName}). {dict.footer.copyright}
            </p>
            <p>{locale === "fr" ? "Construit pour etudiants IA/CS." : "Built for AI/CS students."}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
