import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { Newsletter } from "@/components/newsletter";
import { siteConfig } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { isSafeHttpUrl, normalizeHttpUrl } from "@/lib/url";

const checkoutUrlRaw = (process.env.NEXT_PUBLIC_PRODUCT_CHECKOUT_URL || "").trim();
const checkoutUrl = isSafeHttpUrl(checkoutUrlRaw) ? normalizeHttpUrl(checkoutUrlRaw) : "";
const hasCheckoutUrl = Boolean(checkoutUrl);

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  const fr = params.lang === "fr";
  const title = fr ? "Guide Carriere IA" : "AI Career Guide";
  const description = fr
    ? "Guide pratique pour etudiants IA afin d'ameliorer portfolio, candidatures et entretiens."
    : "Practical student guide to improve portfolio, internship conversion, and weekly execution.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${params.lang}/product/ai-career-guide`,
      type: "website",
      images: [{ url: "/images/post-roadmap.svg", width: 1200, height: 675, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/post-roadmap.svg"]
    },
    alternates: {
      languages: {
        en: "/en/product/ai-career-guide",
        fr: "/fr/product/ai-career-guide"
      }
    }
  };
}

export default function LocalizedProductPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";
  const leadMagnetHref = fr ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;

  return (
    <div className="page-shell max-w-6xl py-10 md:py-16">
      <section className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{fr ? "Produit digital" : "Digital Product"}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {fr ? "Guide d'execution carriere IA pour etudiants" : "AI Career Execution Guide for Students"}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">
              {fr
                ? "Un guide pratique pour livrer des projets portfolio, augmenter tes reponses de stage et mieux te preparer aux entretiens."
                : "A practical guide to ship portfolio projects, increase internship responses, and improve interview preparation."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                PDF + templates
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Budget etudiant" : "Student budget"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                EN/FR
              </span>
            </div>
          </div>

          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{fr ? "Offre lancement" : "Launch offer"}</p>
            <p className="mt-2 text-4xl font-bold text-[color:var(--text-strong)]">$9 - $19</p>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr
                ? "Plan d'action concret pour passer de la theorie aux resultats."
                : "Concrete action plan to turn learning into measurable outcomes."}
            </p>
            {hasCheckoutUrl ? (
              <>
                <TrackableAnchor
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  event="product_checkout_click"
                  meta={{ page: "localized_product", locale }}
                  className="btn-primary mt-4 inline-flex"
                >
                  {fr ? "Passer au paiement" : "Proceed to checkout"}
                </TrackableAnchor>
                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  {fr
                    ? "Paiement externe securise. Acces instantane apres achat."
                    : "Secure external checkout. Instant access after purchase."}
                </p>
              </>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <TrackableAnchor
                  href={leadMagnetHref}
                  event="lead_magnet_click"
                  meta={{ page: "localized_product", locale, source: "product_fallback" }}
                  className="btn-primary"
                >
                  {fr ? "Obtenir la roadmap gratuite" : "Get free roadmap"}
                </TrackableAnchor>
                <Link href={`/${locale}/resources`} className="btn-secondary">
                  {fr ? "Voir ressources" : "See resources"}
                </Link>
                <p className="w-full text-xs text-[color:var(--muted)]">
                  {fr
                    ? "Checkout non disponible pour l'instant. Utilise la roadmap gratuite et les ressources."
                    : "Checkout is not live yet. Use the free roadmap and curated resources first."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-[color:var(--border)]">
            <Image
              src="/images/post-roadmap.svg"
              alt={fr ? "Apercu du guide" : "Guide preview"}
              width={1200}
              height={675}
              priority
              sizes="(max-width: 1024px) 100vw, 900px"
              className="h-auto w-full"
            />
          </div>

          <section className="grid gap-5 md:grid-cols-2">
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">
                {fr ? "Contenu" : "What you get"}
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--text)]">
                <li>1. {fr ? "Plan sprint 30 jours" : "30-day project sprint planner"}</li>
                <li>2. {fr ? "Templates portfolio + case study" : "Portfolio and case-study templates"}</li>
                <li>3. {fr ? "Checklist conversion candidatures" : "Internship application conversion checklist"}</li>
                <li>4. {fr ? "Tracker hebdomadaire" : "Weekly accountability tracker"}</li>
              </ul>
            </div>

            <div className="surface rounded-2xl p-6">
              <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">
                {fr ? "Pour qui" : "Who this is for"}
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[color:var(--text)]">
                <li>1. {fr ? "Etudiants avec portfolio incomplet" : "Students with incomplete portfolios"}</li>
                <li>2. {fr ? "Candidatures de stage peu performantes" : "Internship applications with low response rates"}</li>
                <li>3. {fr ? "Builders qui veulent un systeme clair" : "Builders who want a clear execution system"}</li>
              </ul>
            </div>
          </section>

          <section className="surface rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
              {fr ? "Ce que tu obtiens en plus" : "Included extras"}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>- {fr ? "Support email pour clarifier ton plan." : "Email support for clarifying your execution plan."}</li>
              <li>- {fr ? "Mise a jour du guide pendant 60 jours." : "Guide updates for 60 days."}</li>
              <li>- {fr ? "Structure orientee stage et debut de carriere." : "Structure focused on internship and early career outcomes."}</li>
            </ul>
          </section>

          <Newsletter locale={locale} source="product_page" />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <section className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {fr ? "Actions rapides" : "Quick actions"}
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              <Link href={`/${locale}/blog`} className="btn-secondary text-center">
                {fr ? "Lire le blog" : "Read blog"}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-secondary text-center">
                {fr ? "Comparer outils" : "Compare tools"}
              </Link>
              <Link href={`/${locale}/resources`} className="btn-primary text-center">
                {fr ? "Outils recommandes" : "Recommended tools"}
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
