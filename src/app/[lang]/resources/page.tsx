import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { AffiliateDisclosureInline } from "@/components/affiliate-disclosure-inline";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { ToolLogo } from "@/components/ui/tool-logo";
import { recommendedTools, studentStudyTools } from "@/content/posts";
import { siteConfig } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords, ogImageUrl } from "@/lib/seo";
import { isSafeHttpUrl, normalizeHttpUrl } from "@/lib/url";
import { jsonLd } from "@/lib/json-ld";

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};
  const dict = getDictionary(params.lang);

  return {
    // seoTitle for the search result; dict.resources.title stays the H1.
    title: dict.resources.seoTitle,
    description: dict.resources.subtitle,
    keywords: getSeoKeywords(params.lang, "resources"),
    openGraph: {
      title: dict.resources.title,
      description: dict.resources.subtitle,
      url: `/${params.lang}/resources`,
      type: "website",
      images: [{ url: ogImageUrl(dict.resources.title), width: 1200, height: 630, alt: dict.resources.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: dict.resources.title,
      description: dict.resources.subtitle,
      images: [ogImageUrl(dict.resources.title)]
    },
    alternates: localizedAlternates("/resources", params.lang)
  };
}

export default async function LocalizedResourcesPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const nonce = (await headers()).get("x-csp-nonce") || undefined;
  const dict = getDictionary(locale);
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;
  const checkoutUrlRaw = (process.env.NEXT_PUBLIC_PRODUCT_CHECKOUT_URL || "").trim();
  const checkoutUrl = isSafeHttpUrl(checkoutUrlRaw) ? normalizeHttpUrl(checkoutUrlRaw) : "";
  const hasCheckoutUrl = Boolean(checkoutUrl);
  const toolsCount = recommendedTools.length;
  const stackCards = [
    {
      title: locale === "fr" ? "Stack Starter" : "Starter Stack",
      summary:
        locale === "fr"
          ? "Minimum viable stack pour lancer ton premier projet deploye."
          : "Minimum viable stack to ship your first deployed AI project.",
      items: [
        recommendedTools[0]?.name ?? "Cloud Deploy Stack",
        recommendedTools[1]?.name ?? "AI Learning Platform"
      ]
    },
    {
      title: locale === "fr" ? "Stack Portfolio" : "Portfolio Stack",
      summary:
        locale === "fr"
          ? "Concue pour livrer vite, documenter proprement et candidater."
          : "Designed for faster shipping, clean docs, and better applications.",
      items: [
        recommendedTools[0]?.name ?? "Cloud Deploy Stack",
        recommendedTools[2]?.name ?? "Student Productivity Workspace"
      ]
    },
    {
      title: locale === "fr" ? "Stack Interview-Ready" : "Interview-Ready Stack",
      summary:
        locale === "fr"
          ? "Equilibre entre execution technique et signal carrière."
          : "Balanced for technical execution and stronger career signal.",
      items: recommendedTools.map((tool) => tool.name)
    }
  ];
  const faqItems =
    locale === "fr"
      ? [
          {
            q: "Comment choisir un outil quand mon budget est limite ?",
            a: "Commence par l'option qui te permet de deployer vite avec un cout previsible. Priorise vitesse + fiabilite avant les fonctionnalites avancees."
          },
          {
            q: "Combien d'outils dois-je utiliser au debut ?",
            a: "Deux ou trois maximum. Un outil de deploiement, un outil d'apprentissage, et un outil d'organisation suffisent pour un premier sprint."
          },
          {
            q: "Comment savoir si un outil ameliore vraiment mon profil ?",
            a: "Mesure le resultat: demo en ligne, documentation claire, et meilleure qualite de candidature apres 30 jours."
          }
        ]
      : [
          {
            q: "How should I choose tools with a limited budget?",
            a: "Start with the option that helps you deploy fast with predictable spend. Prioritize speed and reliability before advanced features."
          },
          {
            q: "How many tools should I use at the beginning?",
            a: "Two or three max. One deployment tool, one learning tool, and one planning tool are enough for your first sprint."
          },
          {
            q: "How do I know a tool is improving my career signal?",
            a: "Measure outcomes: live demo shipped, clearer documentation, and stronger application quality after 30 days."
          }
        ];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a
      }
    }))
  };

  return (
    <div className="page-shell max-w-6xl py-10 md:py-16">
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />
      <div className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{dict.nav.resources}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {dict.resources.title}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">{dict.resources.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {locale === "fr" ? "Mise a jour mensuelle" : "Updated monthly"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {locale === "fr" ? "Budget etudiant" : "Student-budget first"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {locale === "fr" ? "Aucun lien remunere" : "No paid links"}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/compare`} className="btn-primary">
                {locale === "fr" ? "Ouvrir le lab outils" : "Open tools lab"}
              </Link>
              <Link href={`/${locale}/product/ai-career-guide`} className="btn-secondary">
                {locale === "fr" ? "Guide carriere" : "Career guide"}
              </Link>
            </div>
          </div>

          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{locale === "fr" ? "Selection des outils" : "Tool selection method"}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>
                {locale === "fr"
                  ? "1. Priorite aux outils qui reduisent temps de delivery."
                  : "1. Prioritize tools that reduce shipping time."}
              </li>
              <li>
                {locale === "fr"
                  ? "2. Conserver un budget realiste et budget-friendly."
                  : "2. Keep spending within realistic, budget-friendly limits."}
              </li>
              <li>
                {locale === "fr"
                  ? "3. Maximiser le signal portfolio pour recrutement."
                  : "3. Maximize portfolio signal for hiring outcomes."}
              </li>
            </ul>
            <p className="mt-4 text-xs text-[color:var(--muted)]">
              {toolsCount} {locale === "fr" ? "outils actifs dans la shortlist" : "active tools in the shortlist"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-8">
          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: locale === "fr" ? "Temps de deploiement" : "Time-to-deploy",
                body:
                  locale === "fr"
                    ? "On privilegie les outils qui reduisent le temps entre idee et demo en ligne."
                    : "We prioritize tools that shorten the path from idea to live demo."
              },
              {
                title: locale === "fr" ? "Cout etudiant" : "Student cost control",
                body:
                  locale === "fr"
                    ? "Chaque recommandation est evaluee par rapport a un budget realiste."
                    : "Every recommendation is reviewed against realistic, budget-friendly constraints."
              },
              {
                title: locale === "fr" ? "Signal carrière" : "Career signal",
                body:
                  locale === "fr"
                    ? "Les outils doivent aider a produire un portfolio lisible par les recruteurs."
                    : "Tools must improve your portfolio quality and interview leverage."
              }
            ].map((item) => (
              <article key={item.title} className="glass rounded-2xl p-5">
                <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">{item.title}</h2>
                <p className="card-copy mt-2 text-[color:var(--text)]">{item.body}</p>
              </article>
            ))}
          </section>

          <section className="surface rounded-2xl p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="do-kicker">{locale === "fr" ? "Outils revision" : "Study stack"}</p>
                <h2 className="font-display section-title mt-1 font-semibold text-[color:var(--text-strong)]">
                  {locale === "fr"
                    ? "NotebookLM, Antigravity et outils utiles pour etudiants"
                    : "NotebookLM, Antigravity, and high-utility student tools"}
                </h2>
              </div>
              <Link href={`/${locale}/compare`} className="btn-secondary">
                {locale === "fr" ? "Voir Tools" : "Open tools"}
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {studentStudyTools.slice(0, 4).map((tool) => (
                <article key={tool.name} className="blog-chip rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <ToolLogo
                      src={tool.icon}
                      alt={`${tool.name} logo`}
                      size={40}
                      className="h-10 w-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-1.5"
                    />
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--primary)]">{tool.category[locale]}</p>
                      <h3 className="mt-1 text-base font-semibold text-[color:var(--text-strong)]">{tool.name}</h3>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--text)]">{tool.summary[locale]}</p>
                  <a href={tool.href} target="_blank" rel="noopener noreferrer" className="do-link mt-2 inline-block text-sm">
                    {locale === "fr" ? "Lien officiel" : "Official link"}
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="surface rounded-2xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Plan d'apprentissage 30 jours" : "30-day learning plan"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {locale === "fr"
                ? "Plan simple pour structurer ton apprentissage, tes mini-projets et ta documentation."
                : "Simple plan to structure your learning, mini projects, and documentation."}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>
                {locale === "fr"
                  ? "1. Choisis un sujet utile par semaine et publie un recap clair."
                  : "1. Pick one useful topic each week and publish a clear recap."}
              </li>
              <li>
                {locale === "fr"
                  ? "2. Ajoute un exemple pratique ou une mini-demo pour chaque sujet."
                  : "2. Add one practical example or mini demo for each topic."}
              </li>
              <li>
                {locale === "fr"
                  ? "3. Mets a jour tes notes et references pour consolider tes acquis."
                  : "3. Update your notes and references to consolidate your progress."}
              </li>
            </ul>
            <p className="mt-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-xs text-[color:var(--muted)]">
              {locale === "fr"
                ? "Repere: suis le nombre de projets finalises, la clarte de ton portfolio, et ta regularite."
                : "Reference: track completed projects, portfolio clarity, and weekly consistency."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <TrackableAnchor href={leadMagnetHref} event="lead_magnet_click" meta={{ page: "resources_execution_sprint", locale }} className="btn-secondary">
                {locale === "fr" ? "Stages ouverts" : "Open internships"}
              </TrackableAnchor>
              <Link href={`/${locale}/compare`} className="btn-secondary">
                {locale === "fr" ? "Ouvrir le lab outils" : "Open tools lab"}
              </Link>
              {hasCheckoutUrl ? (
                <TrackableAnchor
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  event="product_checkout_click"
                  meta={{ page: "resources_execution_sprint", locale, offer: "ai-career-guide" }}
                  className="btn-primary"
                >
                  {locale === "fr" ? "Acheter le guide" : "Buy student guide"}
                </TrackableAnchor>
              ) : (
                <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary">
                  {locale === "fr" ? "Voir le guide" : "Open student guide"}
                </Link>
              )}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recommendedTools.map((tool) => (
              <article key={tool.name} className="card-hover glass flex min-h-[22rem] flex-col rounded-2xl p-6">
                <Image src={tool.icon} alt="" width={36} height={36} loading="lazy" className="mb-3 rounded-md" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">{tool.category[locale]}</p>
                <h2 className="font-display mt-2 text-xl font-semibold text-[color:var(--text-strong)]">{tool.name}</h2>
                <p className="card-copy mt-3 text-[color:var(--text)]">{tool.summary[locale]}</p>
                <p className="mt-3 text-xs text-[color:var(--muted)]">{tool.benefit[locale]}</p>
                <TrackableAnchor
                  href={tool.affiliateHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  event="affiliate_click"
                  meta={{ page: "resources", tool: tool.name, locale }}
                  className="btn-primary mt-auto inline-block"
                >
                  {locale === "fr" ? "Essayer" : "Try tool"}
                </TrackableAnchor>
              </article>
            ))}
          </section>

          {siteConfig.affiliatePartners.length ? (
            <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
              <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">
                {locale === "fr" ? "Liens partenaires" : "Partner links"}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--text)]">
                {locale === "fr"
                  ? "Ressources partenaires utilisees dans le blog, le lab outils et cette page."
                  : "Partner resources referenced across the blog, tools lab, and this page."}
              </p>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {siteConfig.affiliatePartners.map((partner) => (
                  <TrackableAnchor
                    key={partner.url}
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    event="affiliate_click"
                    meta={{ page: "resources_partners", partner: partner.name, placement: partner.placement, locale }}
                    className="inline-flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm text-[color:var(--text)] hover:border-[color:var(--primary)]/35"
                  >
                    <span>{partner.name}</span>
                    <span className="text-xs text-[color:var(--muted)]">{partner.placement}</span>
                  </TrackableAnchor>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">
                {locale === "fr" ? "Stacks recommandees" : "Recommended stacks"}
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {stackCards.map((stack) => (
                <article key={stack.title} className="surface rounded-2xl p-5">
                  <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">{stack.title}</h3>
                  <p className="mt-2 text-sm text-[color:var(--text)]">{stack.summary}</p>
                  <ul className="mt-3 space-y-1 text-sm text-[color:var(--text)]">
                    {stack.items.map((tool) => (
                      <li key={tool}>- {tool}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="surface rounded-2xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Comparer avant d'acheter" : "Compare before buying"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {locale === "fr"
                ? "Utilise le template du lab outils pour choisir la meilleure option selon ton budget étudiant."
                : "Use the tools-lab template to choose the best option by budget constraints and deployment speed."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/${locale}/news`} className="btn-secondary">
                {locale === "fr" ? "Actualites IA/CS" : "AI + Cybersecurity news"}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-primary">
                {locale === "fr" ? "Ouvrir le lab outils" : "Open tools lab"}
              </Link>
              <Link href={`/${locale}/product/ai-career-guide`} className="btn-secondary">
                {locale === "fr" ? "Guide carriere ($9-$19)" : "Career guide ($9-$19)"}
              </Link>
            </div>
          </section>

          <section className="reading-panel rounded-2xl p-6">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "FAQ etudiant" : "Student FAQ"}
            </h2>
            <div className="mt-4 space-y-3">
              {faqItems.map((item) => (
                <article key={item.q} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <h3 className="text-sm font-semibold text-[color:var(--text-strong)]">{item.q}</h3>
                  <p className="mt-2 text-sm text-[color:var(--text)]">{item.a}</p>
                </article>
              ))}
            </div>
          </section>

          <AffiliateDisclosureInline locale={locale} />

          <div>
            <Newsletter locale={locale} source="resources_main" />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <EditorialTrust locale={locale} compact />
          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Chemin rapide" : "Quick path"}
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              <Link href={`/${locale}/news`} className="btn-secondary text-center">
                {locale === "fr" ? "Actualites" : "News"}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-secondary text-center">
                {locale === "fr" ? "Lab outils" : "Tools lab"}
              </Link>
              <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary text-center">
                {locale === "fr" ? "Guide carriere" : "Career guide"}
              </Link>
            </div>
          </div>
          <Newsletter compact locale={locale} source="resources_aside" />
        </aside>
      </div>
    </div>
  );
}
