import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { Newsletter } from "@/components/newsletter";
import { siteConfig } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords, ogImageUrl, coverImageUrl } from "@/lib/seo";
import { isSafeHttpUrl, normalizeHttpUrl } from "@/lib/url";

const checkoutUrlRaw = (process.env.NEXT_PUBLIC_PRODUCT_CHECKOUT_URL || "").trim();
const checkoutUrl = isSafeHttpUrl(checkoutUrlRaw) ? normalizeHttpUrl(checkoutUrlRaw) : "";
const hasCheckoutUrl = Boolean(checkoutUrl);

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const fr = params.lang === "fr";
  const title = fr ? "Guide Carriere IA" : "AI Career Guide";
  const description = fr
    ? "Guide pratique pour etudiants IA afin d'ameliorer portfolio, candidatures et entretiens."
    : "Practical student guide to improve portfolio, internship conversion, and weekly execution.";

  return {
    title,
    description,
    keywords: getSeoKeywords(params.lang, "product", [
      fr ? "guide carriere ia etudiant pdf" : "ai student career guide pdf",
      fr ? "roadmap stage ia" : "ai internship roadmap",
      fr ? "guide execution ia informatique 30 jours" : "30 day ai and cs execution guide",
      fr ? "plan portfolio etudiant" : "student portfolio action plan"
    ]),
    openGraph: {
      title,
      description,
      url: `/${params.lang}/product/ai-career-guide`,
      type: "website",
      images: [{ url: ogImageUrl(title), width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl(title)]
    },
    alternates: localizedAlternates("/product/ai-career-guide", params.lang)
  };
}

export default async function LocalizedProductPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
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
                ? "Un guide pratique pour livrer des projets portfolio, augmenter tes reponses de stage, et clarifier ton plan execution sur 14-30 jours."
                : "A practical guide to ship portfolio projects, increase internship responses, and execute a clear 14-30 day plan."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                PDF + templates
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Budget-friendly" : "Budget-friendly"}
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
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              {fr
                ? "Ideal pour etudiants qui veulent un systeme simple sans coach payant."
                : "Ideal for students who need a simple system without expensive coaching."}
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
              src={coverImageUrl("ai-career-guide", "Career/Interviews")}
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

          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: fr ? "Jour 1-7" : "Day 1-7",
                body: fr ? "Choix stack, plan sprint, et debut du projet portfolio." : "Pick stack, setup sprint plan, and start your portfolio project."
              },
              {
                title: fr ? "Jour 8-14" : "Day 8-14",
                body: fr ? "Livraison d'une version utilisable + documentation claire." : "Ship a usable version and document it with clear proof."
              },
              {
                title: fr ? "Jour 15-30" : "Day 15-30",
                body: fr ? "Optimisation candidatures, storytelling entretien, et iteration." : "Optimize applications, interview story, and iteration loop."
              }
            ].map((item) => (
              <article key={item.title} className="glass rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--primary)]">{item.title}</p>
                <p className="mt-2 text-sm text-[color:var(--text)]">{item.body}</p>
              </article>
            ))}
          </section>

          <section className="surface rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
              {fr ? "FAQ + objections" : "FAQ + objections"}
            </h2>
            <div className="mt-4 space-y-4 text-sm text-[color:var(--text)]">
              <article>
                <p className="font-semibold text-[color:var(--text-strong)]">
                  {fr ? "Je suis debutant, ce guide est-il adapte ?" : "I am a beginner. Is this guide still useful?"}
                </p>
                <p className="mt-1">
                  {fr
                    ? "Oui. Le guide commence par un plan d'execution simple puis monte en niveau progressivement."
                    : "Yes. It starts with a simple execution plan and increases difficulty progressively."}
                </p>
              </article>
              <article>
                <p className="font-semibold text-[color:var(--text-strong)]">
                  {fr ? "Je n'ai pas un gros budget outil." : "I do not have a high tool budget."}
                </p>
                <p className="mt-1">
                  {fr
                    ? "La methode est construite pour un budget-friendly realiste avec priorite sur options low-cost."
                    : "The framework is built for realistic, budget-friendly decisions with low-cost-first options."}
                </p>
              </article>
              <article>
                <p className="font-semibold text-[color:var(--text-strong)]">
                  {fr ? "Et si je ne suis pas pret a acheter ?" : "What if I am not ready to buy yet?"}
                </p>
                <p className="mt-1">
                  {fr
                    ? "Commence par la roadmap gratuite puis reviens apres ton premier mini sprint."
                    : "Start with the free roadmap, then return after your first mini sprint."}
                </p>
              </article>
            </div>
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
                {fr ? "Lab outils" : "Tools lab"}
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
