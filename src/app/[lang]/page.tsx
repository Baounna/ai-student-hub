import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { AffiliateDisclosureInline } from "@/components/affiliate-disclosure-inline";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { getAutoNews } from "@/content/auto-news";
import { getLatestNews, getLocalizedNews } from "@/content/news";
import { countryLabel, getOpenStages, kindLabel } from "@/content/stages";
import { siteConfig } from "@/config/site";
import {
  getAllCategories,
  getCategoriesByTrack,
  getPopularPosts,
  getPostsByTrack,
  getTrackCounts,
  getTrackLabel,
  recommendedTools,
  slugify
} from "@/content/posts";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords, ogImageUrl, coverImageUrl } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";
import { canSellProduct, getProductCheckoutUrl } from "@/lib/product";
import { jsonLd } from "@/lib/json-ld";
import { formatReadTime } from "@/lib/read-time";

function formatPublishedDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(date));
}

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const dict = getDictionary(params.lang);

  return {
    title: dict.home.headline,
    description: dict.home.subheadline,
    keywords: getSeoKeywords(params.lang, "home"),
    openGraph: {
      title: dict.home.headline,
      description: dict.home.subheadline,
      url: `/${params.lang}`,
      siteName: "AI and Cybersecurity News",
      type: "website",
      images: [{ url: ogImageUrl("AI and Cybersecurity News"), width: 1200, height: 630, alt: "AI and Cybersecurity News" }]
    },
    twitter: {
      card: "summary_large_image",
      title: dict.home.headline,
      description: dict.home.subheadline,
      images: [ogImageUrl("AI and Cybersecurity News")]
    },
    alternates: localizedAlternates("", params.lang)
  };
}

export default async function LocalizedHomePage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const nonce = (await headers()).get("x-csp-nonce") || undefined;
  const dict = getDictionary(locale);
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;

  const popularPosts = getPopularPosts(locale, 3);
  const featuredPost = popularPosts[0];
  const sidePosts = popularPosts.slice(1);
  const categories = getAllCategories();
  const trackCounts = getTrackCounts(locale);
  const aiCategories = getCategoriesByTrack("ai");
  const csCategories = getCategoriesByTrack("cs");
  const aiFocusPosts = getPostsByTrack("ai", locale).slice(0, 3);
  const csFocusPosts = getPostsByTrack("cs", locale).slice(0, 3);
  const latestNews = getLatestNews(locale, 4);
  const allNews = getLocalizedNews(locale);
  const autoUpdates = getAutoNews(locale, 6);
  const socialStats =
    siteConfig.socialProofStats.length > 0
      ? siteConfig.socialProofStats
      : locale === "fr"
        ? ["Base de connaissance IA/CS pour builders et apprenants", "Ressources pratiques mises à jour régulièrement", "Mises à jour hebdomadaires IA + CS"]
        : ["AI + Cybersecurity knowledge base for builders and learners", "Practical resources updated regularly", "Weekly AI + Cybersecurity updates"];

  const didYouKnowItems =
    locale === "fr"
      ? [
          "Le Web a été proposé en 1989 par Tim Berners-Lee pour partager la recherche scientifique.",
          "Le langage C, créé dans les années 1970, influence encore la plupart des langages modernes.",
          "Git (2005) est devenu l'outil standard pour la collaboration en ingénierie logicielle.",
          "Un portfolio déployé augmente souvent plus le signal carrière qu'un grand nombre de certificats."
        ]
      : [
          "The Web was proposed in 1989 by Tim Berners-Lee to share scientific research.",
          "The C language, created in the 1970s, still influences most modern programming languages.",
          "Git (2005) became the standard collaboration workflow for software engineering teams.",
          "A deployed portfolio often creates stronger career signal than a stack of certificates."
        ];

  const milestoneItems =
    locale === "fr"
      ? [
          { year: "1969", event: "ARPANET envoie ses premiers messages entre universités." },
          { year: "1971", event: "Le premier e-mail moderne est envoyé sur un réseau informatique." },
          { year: "1991", event: "Publication publique du World Wide Web." },
          { year: "2012+", event: "Accélération de l'apprentissage profond avec GPU et datasets massifs." }
        ]
      : [
          { year: "1969", event: "ARPANET sends its first messages between universities." },
          { year: "1971", event: "The first modern email is sent across a computer network." },
          { year: "1991", event: "The World Wide Web is released publicly." },
          { year: "2012+", event: "Deep learning acceleration grows with GPUs and large-scale datasets." }
        ];

  const quickStartCards =
    locale === "fr"
      ? [
          {
            title: "1) Apprendre",
            body: "Lis des guides IA + cybersécurité axés projets, stage, et exécution.",
            href: `/${locale}/blog`,
            cta: "Ouvrir le blog"
          },
          {
            title: "2) Choisir les outils",
            body: "Choisissez une stack avec comparatifs clairs, budget-friendly, et compromis réels.",
            href: `/${locale}/compare`,
            cta: "Ouvrir le lab outils"
          },
          {
            title: "3) Passer à l'action",
            body: "Ouvrez la liste des stages ouverts, puis le guide carrière.",
            href: `/${locale}/product/ai-career-guide`,
            cta: "Lancer l'exécution"
          }
        ]
      : [
          {
            title: "1) Learn",
            body: "Read project-first AI + cybersecurity guides for internship outcomes.",
            href: `/${locale}/blog`,
            cta: "Open blog"
          },
          {
            title: "2) Pick tools",
            body: "Choose a stack with clear tradeoffs, budget-friendly fit, and speed-to-ship logic.",
            href: `/${locale}/compare`,
            cta: "Open tools lab"
          },
          {
            title: "3) Execute",
            body: "Move from planning to applying with the open internship list and the career guide.",
            href: `/${locale}/product/ai-career-guide`,
            cta: "Start execution"
          }
        ];

  // Dated entries first (getOpenStages already orders them that way), so the
  // five shown are the ones with a real cutoff rather than an arbitrary slice.
  const openStages = getOpenStages();
  const openStagesCount = openStages.length;
  const featuredStages = openStages.slice(0, 5);

  const audiencePaths =
    locale === "fr"
      ? [
          {
            label: "Pour tous",
            title: "News + outils + briefs",
            body: "Suivez les updates officielles IA/CS, ouvrez les outils utiles, puis appliquez les briefs pratiques.",
            links: [
              { href: `/${locale}/news`, text: "Actualités" },
              { href: `/${locale}/compare`, text: "Outils" },
              { href: `/${locale}/blog`, text: "Briefs & guides" }
            ]
          },
          {
            label: "Pour étudiants",
            title: "Stages + carrière + guides budget-friendly",
            body: "Parcours dédié pour stages, portfolio, et exécution avec contraintes budget.",
            links: [
              { href: leadMagnetHref, text: "Stages ouverts", external: true },
              { href: `/${locale}/product/ai-career-guide`, text: "Guide carrière" },
              { href: `/${locale}/resources`, text: "Guides budget-friendly" }
            ]
          }
        ]
      : [
          {
            label: "For Everyone",
            title: "News + tools + practical briefs",
            body: "Track official AI + Cybersecurity updates, open practical tools, and execute with concise briefs.",
            links: [
              { href: `/${locale}/news`, text: "News" },
              { href: `/${locale}/compare`, text: "Tools" },
              { href: `/${locale}/blog`, text: "Briefs & guides" }
            ]
          },
          {
            label: "For Students",
            title: "Internships + career + budget-friendly guides",
            body: "Dedicated path for internships, portfolio outcomes, and budget-aware execution.",
            links: [
              { href: leadMagnetHref, text: "Open internships", external: true },
              { href: `/${locale}/product/ai-career-guide`, text: "Career guide" },
              { href: `/${locale}/resources`, text: "Budget-friendly guides" }
            ]
          }
        ];

  const splitEntryCards = [
    {
      key: "ai",
      title: locale === "fr" ? "Piste IA" : "AI Track",
      summary:
        locale === "fr"
          ? "Modèles, ML engineering, LLM systems, et exécution portfolio."
          : "Models, ML engineering, LLM systems, and portfolio execution.",
      count: trackCounts.ai,
      categories: aiCategories.slice(0, 3),
      href: `/${locale}/blog?track=ai`
    },
    {
      key: "cs",
      title: locale === "fr" ? "Piste informatique" : "Computer Science Track",
      summary:
        locale === "fr"
          ? "Algorithmes, backend, cloud, sécurité, et performance pour projets réels."
          : "Algorithms, backend, cloud, security, and performance for real projects.",
      count: trackCounts.cs,
      categories: csCategories.slice(0, 3),
      href: `/${locale}/blog?track=cs`
    }
  ];
  const checkoutUrl = getProductCheckoutUrl();
  const hasCheckoutUrl = canSellProduct();

  const knowledgeReferences = [
    {
      label: locale === "fr" ? "NIST AI Risk Management Framework" : "NIST AI Risk Management Framework",
      href: "https://www.nist.gov/itl/ai-risk-management-framework",
      source: "NIST"
    },
    {
      label: locale === "fr" ? "ACM Computing Curricula" : "ACM Computing Curricula",
      href: "https://www.acm.org/education/curricula-recommendations",
      source: "ACM"
    },
    {
      label: locale === "fr" ? "OpenAI Newsroom" : "OpenAI Newsroom",
      href: "https://openai.com/news/",
      source: "OpenAI"
    },
    {
      label: locale === "fr" ? "Guide MLOps Google Cloud" : "Google Cloud MLOps guide",
      href: "https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning",
      source: "Google Cloud"
    }
  ];

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AI and Cybersecurity News",
    url: absoluteUrl(`/${locale}`),
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: absoluteUrl(`/${locale}/blog?query={search_term_string}`),
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="page-shell max-w-6xl py-8 md:py-10">
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema) }} />

      <section className="wiki-panel overflow-hidden rounded-md">
        {/* The page's h1. It was a plain div, so the homepage — the page search
            engines weigh most — shipped with no top-level heading at all. */}
        <h1 className="wiki-head hero-title px-6 py-3 text-center font-bold">
          {locale === "fr"
            ? "Actualités IA + cybersécurité et guides d'exécution pour tous"
            : "AI + Cybersecurity news and execution guides for anyone who builds, learns, or works with AI"}
        </h1>
        <div className="body-copy px-6 py-4 text-center text-[color:var(--text)]">
          <p>
            {locale === "fr"
              ? "Base de connaissance orientée résultats: suivre les updates, choisir les bons outils, puis livrer des projets concrets."
              : "Execution-first knowledge base: follow updates, pick the right tools, and ship practical projects faster."}
          </p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {locale === "fr"
              ? "Objectif: convertir information IA + cybersécurité en exécution mesurable. Parcours étudiant dédié disponible."
              : "Goal: convert AI + Cybersecurity information into measurable execution. A dedicated student path stays available."}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <TrackableAnchor href={leadMagnetHref} event="lead_magnet_click" meta={{ page: "home_header", locale }} className="btn-primary">
              {dict.home.ctaPrimary}
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
                meta={{ page: "home_header", locale, offer: "ai-career-guide" }}
                className="btn-secondary"
              >
                {locale === "fr" ? "Acheter le guide exécution" : "Buy execution guide"}
              </TrackableAnchor>
            ) : (
              <Link href={`/${locale}/product/ai-career-guide`} className="btn-secondary">
                {locale === "fr" ? "Voir le guide carrière" : "Open the career guide"}
              </Link>
            )}
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {allNews.length} {locale === "fr" ? "briefs d'actualité" : "news briefs"} • {popularPosts.length}{" "}
            {locale === "fr" ? "articles principaux" : "core articles"} • {categories.length}{" "}
            {locale === "fr" ? "domaines" : "domains"} • {recommendedTools.length}{" "}
            {locale === "fr" ? "outils recommandés" : "recommended tools"}
          </p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">
            {getTrackLabel("ai", locale)}: {trackCounts.ai} • {getTrackLabel("cs", locale)}: {trackCounts.cs} •{" "}
            {getTrackLabel("career", locale)}: {trackCounts.career}
          </p>
        </div>
      </section>

      {/* The homepage linked to the internship list ten times and showed none
          of it. Everything above this point is a claim about what the site
          does; this is the only thing that is what the site does, so it comes
          before the positioning rather than after it. Five entries, because the
          point is to be concrete, not to reproduce the page. */}
      {featuredStages.length ? (
        <section className="mt-4 rounded-md border border-[color:var(--wiki-panel-border)] bg-[color:var(--surface)]">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[color:var(--border)] px-4 py-3">
            <h2 className="font-display text-lg font-semibold text-[color:var(--text-strong)] md:text-xl">
              {locale === "fr" ? "Stages ouverts en ce moment" : "Internships open right now"}
            </h2>
            <span className="text-xs text-[color:var(--muted)]">
              {locale === "fr"
                ? `${openStagesCount} offres verifiees une par une`
                : `${openStagesCount} openings, each link checked by hand`}
            </span>
          </div>
          <ul className="divide-y divide-[color:var(--border)]">
            {featuredStages.map((stage) => (
              <li key={stage.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-4 py-3">
                <a
                  href={stage.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="do-link text-sm font-semibold"
                  aria-label={
                    locale === "fr"
                      ? `Voir l'offre : ${stage.role} chez ${stage.company}, ${stage.city}`
                      : `View the offer: ${stage.role} at ${stage.company}, ${stage.city}`
                  }
                >
                  {stage.role}
                </a>
                <span className="text-sm text-[color:var(--muted)]">
                  — {stage.company} · {stage.city}, {countryLabel(stage.country, locale)} · {kindLabel(stage.kind, locale)}
                </span>
                {/* The rust accent existed in the palette and was used once in
                    the whole codebase. A published closing date is the one thing
                    on this page that is actually urgent, so it earns it. */}
                {stage.deadline ? (
                  <span className="text-xs font-semibold text-[color:var(--signal)]">
                    {locale === "fr" ? "avant le " : "by "}
                    {stage.deadline}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="px-4 py-3">
            <Link href={`/${locale}/stages`} className="do-link text-sm">
              {locale === "fr"
                ? `Voir les ${openStagesCount} offres`
                : `See all ${openStagesCount} openings`}
            </Link>
          </div>
        </section>
      ) : null}

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        {quickStartCards.map((card) => (
          <article key={card.title} className="wiki-panel rounded-md p-4">
            <p className="do-kicker">{locale === "fr" ? "Start here" : "Start here"}</p>
            <h2 className="font-display mt-2 text-lg font-semibold text-[color:var(--text-strong)] md:text-xl">{card.title}</h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">{card.body}</p>
            <Link href={card.href} className="do-link mt-3 inline-block text-sm">
              {card.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2">
        {audiencePaths.map((path) => (
          <article key={path.label} className="wiki-panel rounded-md p-5">
            <p className="do-kicker">{path.label}</p>
            <h2 className="font-display mt-2 text-xl font-semibold text-[color:var(--text-strong)]">{path.title}</h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">{path.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {path.links.map((link) =>
                link.external ? (
                  <TrackableAnchor
                    key={`${path.label}-${link.text}`}
                    href={link.href}
                    event="lead_magnet_click"
                    meta={{ page: "home_audience_paths", locale, audience: path.label }}
                    className="btn-primary px-3 py-1.5 text-xs"
                  >
                    {link.text}
                  </TrackableAnchor>
                ) : (
                  <Link key={`${path.label}-${link.text}`} href={link.href} className="btn-secondary px-3 py-1.5 text-xs">
                    {link.text}
                  </Link>
                )
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <article className="wiki-panel rounded-md p-4">
                    <h2 className="font-display mt-2 text-lg font-semibold text-[color:var(--text-strong)]">
            {locale === "fr" ? "Méthodologie transparente" : "Transparent methodology"}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--text)]">
            {locale === "fr"
              ? "Chaque article suit la même structure: signal, impact pratique, action concrète, références."
              : "Each article follows the same structure: signal, practical impact, concrete action, and references."}
          </p>
        </article>
        <article className="wiki-panel rounded-md p-4">
          <p className="do-kicker">{locale === "fr" ? "Sources" : "Sources"}</p>
          <h2 className="font-display mt-2 text-lg font-semibold text-[color:var(--text-strong)]">
            {locale === "fr" ? "Références officielles" : "Official references"}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--text)]">
            {locale === "fr"
              ? "Nous utilisons prioritairement des sources institutionnelles, docs officielles, et pages prix éditeur."
              : "We prioritize institutional sources, official documentation, and first-party pricing pages."}
          </p>
        </article>
        <article className="wiki-panel rounded-md p-4">
          <p className="do-kicker">{locale === "fr" ? "Outcome" : "Outcome"}</p>
          <h2 className="font-display mt-2 text-lg font-semibold text-[color:var(--text-strong)]">
            {locale === "fr" ? "Orienté résultats" : "Outcome-first"}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--text)]">
            {locale === "fr"
              ? "Le contenu vise portfolio déployé, candidatures plus fortes, et exécution hebdomadaire constante."
              : "Content is optimized for shipped portfolio projects, stronger applications, and weekly execution consistency."}
          </p>
        </article>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2">
        {splitEntryCards.map((card) => (
          <article key={card.key} className="wiki-panel rounded-md p-5">
                        <h2 className="font-display mt-2 text-xl font-semibold text-[color:var(--text-strong)]">{card.title}</h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">{card.summary}</p>
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              {card.count} {locale === "fr" ? "articles dans ce flux" : "posts in this stream"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {card.categories.map((category) => (
                <Link
                  key={`${card.key}-${category}`}
                  href={`/${locale}/blog/category/${slugify(category)}`}
                  className="rounded-full border border-[color:var(--wiki-panel-border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs text-[color:var(--text)]"
                >
                  {category}
                </Link>
              ))}
            </div>
            <Link href={card.href} className="do-link mt-3 inline-block text-sm">
              {locale === "fr" ? "Ouvrir ce flux" : "Open this stream"}
            </Link>
          </article>
        ))}
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <article className="wiki-panel rounded-md p-5">
          <p className="do-kicker">{locale === "fr" ? "Sélection IA" : "AI Focus"}</p>
          <div className="mt-2 space-y-2 text-sm text-[color:var(--text)]">
            {aiFocusPosts.map((post) => (
              <p key={post.slug}>
                <Link href={`/${locale}/blog/${post.slug}`} className="do-link">
                  {post.title}
                </Link>
              </p>
            ))}
          </div>
        </article>
        <article className="wiki-panel rounded-md p-5">
          <p className="do-kicker">{locale === "fr" ? "Sélection informatique" : "CS Focus"}</p>
          <div className="mt-2 space-y-2 text-sm text-[color:var(--text)]">
            {csFocusPosts.map((post) => (
              <p key={post.slug}>
                <Link href={`/${locale}/blog/${post.slug}`} className="do-link">
                  {post.title}
                </Link>
              </p>
            ))}
          </div>
        </article>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <section className="wiki-panel overflow-hidden rounded-md">
          <div className="wiki-head wiki-head-green px-4 py-2 text-xl md:text-2xl">
            {locale === "fr" ? "Depuis l'article vedette" : "From today's featured article"}
          </div>
          {featuredPost ? (
            <div className="p-4">
              <div className="grid gap-4 md:grid-cols-[240px,1fr]">
                <div className="media-frame card-hover group aspect-[4/3]">
                  <Image
                    src={coverImageUrl(featuredPost.slug, featuredPost.category)}
                    alt={featuredPost.title}
                    width={1200}
                    height={675}
                    sizes="(max-width: 768px) 100vw, 220px"
                    priority
                    className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div>
                  <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">{featuredPost.title}</h2>
                  <p className="card-copy mt-3 text-[color:var(--text)]">{featuredPost.excerpt}</p>
                  <p className="mt-3 text-sm text-[color:var(--muted)]">
                    {featuredPost.category} • {formatReadTime(featuredPost.readTime, locale)}
                  </p>
                  <div className="mt-4">
                    <Link href={`/${locale}/blog/${featuredPost.slug}`} className="do-link text-lg">
                      {locale === "fr" ? "Article complet..." : "Full article..."}
                    </Link>
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-[color:var(--wiki-panel-border)] pt-3 text-sm">
                <span className="font-semibold text-[color:var(--text-strong)]">
                  {locale === "fr" ? "Récemment en vedette:" : "Recently featured:"}
                </span>{" "}
                <span className="text-[color:var(--text)]">
                  {sidePosts.map((post, idx) => (
                    <span key={post.slug}>
                      <Link href={`/${locale}/blog/${post.slug}`} className="do-link">
                        {post.title}
                      </Link>
                      {idx < sidePosts.length - 1 ? " • " : ""}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          ) : null}
        </section>

        <section className="wiki-panel overflow-hidden rounded-md">
          <div className="wiki-head wiki-head-blue px-4 py-2 text-xl md:text-2xl">
            {locale === "fr" ? "Dans l'actualité informatique" : "In computing news"}
          </div>
          <div className="p-4">
            <ul className="list-disc space-y-2 pl-5 card-copy text-[color:var(--text)]">
              {latestNews.map((item) => (
                <li key={item.slug}>
                  <Link href={`/${locale}/news/${item.slug}`} className="do-link">
                    {item.title}
                  </Link>{" "}
                  - {item.summary}
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-[color:var(--wiki-panel-border)] pt-3 text-sm">
              <span className="font-semibold text-[color:var(--text-strong)]">{locale === "fr" ? "Voir aussi:" : "See also:"}</span>{" "}
              <Link href={`/${locale}/news`} className="do-link">
                {locale === "fr" ? "Toutes les actualités" : "All news"}
              </Link>{" "}
              •{" "}
              <Link href={`/${locale}/blog`} className="do-link">
                {locale === "fr" ? "Toutes les analyses" : "All analysis posts"}
              </Link>{" "}
              •{" "}
              <Link href={`/${locale}/compare`} className="do-link">
                {locale === "fr" ? "Lab outils technique" : "Technical tools lab"}
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <section className="wiki-panel overflow-hidden rounded-md">
          <div className="wiki-head wiki-head-blue px-4 py-2 text-xl md:text-2xl">
            {locale === "fr" ? "Signaux web automatiques (AI + Cybersecurity)" : "Automatic web signals (AI + Cybersecurity)"}
          </div>
          <div className="p-4">
            <p className="text-sm text-[color:var(--text)]">
              {locale === "fr"
                ? "Sélection automatique depuis des sources fiables. Utilisez ces signaux pour choisir votre prochain article."
                : "Auto-selected from trusted sources. Use these signals to choose your next article."}
            </p>
            {autoUpdates.length ? (
              <ol className="mt-4 space-y-3">
                {autoUpdates.map((item, index) => (
                  <li key={item.slug} className="rounded border border-[color:var(--wiki-panel-border)] bg-[color:var(--surface)] p-3">
                    <p className="text-xs text-[color:var(--muted)]">
                      [{index + 1}] {item.source} • {formatPublishedDate(item.publishedAt, locale)}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-[color:var(--text-strong)]">{item.title}</h3>
                    <p className="mt-1 text-sm text-[color:var(--text)]">{item.summary}</p>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="do-link mt-2 inline-block text-sm"
                    >
                      {locale === "fr" ? "Source officielle" : "Official source"}
                    </a>
                  </li>
                ))}
              </ol>
            ) : (
              <article className="mt-4 rounded border border-[color:var(--wiki-panel-border)] bg-[color:var(--surface)] p-3">
                <p className="text-sm text-[color:var(--text)]">
                  {locale === "fr"
                    ? "Les sources externes n'ont pas encore fourni de nouvel item."
                    : "External sources have not provided new items yet."}
                </p>
              </article>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/news/live`} className="btn-secondary">
                {locale === "fr" ? "Ouvrir le flux live" : "Open live stream"}
              </Link>
              <Link href={`/${locale}/news`} className="btn-secondary">
                {locale === "fr" ? "Tous les briefs" : "All briefs"}
              </Link>
            </div>
          </div>
        </section>

        <section className="wiki-panel overflow-hidden rounded-md">
          <div className="wiki-head wiki-head-purple px-4 py-2 text-xl md:text-2xl">
            {locale === "fr" ? "Plan d'étude hebdomadaire" : "Weekly learning plan"}
          </div>
          <div className="space-y-3 p-4 text-sm text-[color:var(--text)]">
            <p>
              {locale === "fr"
                ? "Progression simple: une boucle claire pour apprendre, construire, et documenter chaque semaine."
                : "Simple progression loop: learn, build, and document every week."}
            </p>
            <ul className="space-y-2">
              <li>
                {locale === "fr"
                  ? "1. Choisissez un signal IA/CS important de la semaine."
                  : "1. Pick one important AI + Cybersecurity update from this week."}
              </li>
              <li>
                {locale === "fr"
                  ? "2. Construisez une mini démo ou un mini exercice pratique."
                  : "2. Build a mini demo or practical exercise from it."}
              </li>
              <li>
                {locale === "fr"
                  ? "3. Documentez ce que vous avez appris et partagez les références."
                  : "3. Document what you learned and share references."}
              </li>
            </ul>
            <div className="rounded border border-[color:var(--wiki-panel-border)] bg-[color:var(--surface)] p-3 text-xs text-[color:var(--muted)]">
              {locale === "fr"
                ? "Repère: suivez votre nombre de projets finalisés, la qualité de documentation, et la constance."
                : "Reference: track completed projects, documentation quality, and consistency."}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/${locale}/resources`} className="btn-secondary">
                {locale === "fr" ? "Outils recommandés" : "Recommended tools"}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-secondary">
                {locale === "fr" ? "Lab outils" : "Tools lab"}
              </Link>
              {hasCheckoutUrl ? (
                <TrackableAnchor
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  event="product_checkout_click"
                  meta={{ page: "home_execution_plan", locale, offer: "ai-career-guide" }}
                  className="btn-primary"
                >
                  {locale === "fr" ? "Acheter le guide" : "Buy the guide"}
                </TrackableAnchor>
              ) : (
                <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary">
                  {locale === "fr" ? "Voir le guide carrière" : "Open the career guide"}
                </Link>
              )}
            </div>
            <TrackableAnchor href={leadMagnetHref} event="lead_magnet_click" meta={{ page: "home_execution_plan", locale }} className="do-link">
              {locale === "fr" ? siteConfig.leadMagnet.frLabel : siteConfig.leadMagnet.enLabel}
            </TrackableAnchor>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <section className="wiki-panel overflow-hidden rounded-md">
          <div className="wiki-head wiki-head-green px-4 py-2 text-xl md:text-2xl">
            {locale === "fr" ? "Le saviez-vous..." : "Did you know..."}
          </div>
          <div className="p-4">
            <ul className="list-disc space-y-2 pl-5 card-copy text-[color:var(--text)]">
              {didYouKnowItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="wiki-panel overflow-hidden rounded-md">
          <div className="wiki-head wiki-head-blue px-4 py-2 text-xl md:text-2xl">
            {locale === "fr" ? "Jalons de l'informatique" : "Milestones in computing"}
          </div>
          <div className="p-4">
            <ul className="space-y-3 text-[15px] leading-7 text-[color:var(--text)]">
              {milestoneItems.map((item) => (
                <li key={`${item.year}-${item.event}`}>
                  <span className="font-semibold text-[color:var(--text-strong)]">{item.year}</span> - {item.event}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="wiki-panel overflow-hidden rounded-md">
          <div className="wiki-head wiki-head-purple px-4 py-2 text-xl md:text-2xl">
            {locale === "fr" ? "Portails informatique" : "Computer science portals"}
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/${locale}/blog/category/${slugify(category)}`}
                className="rounded border border-[color:var(--wiki-panel-border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] hover:border-[color:var(--primary)]/40 hover:text-[color:var(--text-strong)]"
              >
                {category}
              </Link>
            ))}
          </div>
        </section>

        <section className="wiki-panel overflow-hidden rounded-md">
          <div className="wiki-head wiki-head-purple px-4 py-2 text-xl md:text-2xl">
            {locale === "fr" ? "Boîte à outils pratique" : "Practical toolbox"}
          </div>
          <div className="space-y-3 p-4">
            {recommendedTools.map((tool, index) => (
              <article key={tool.name} className="card-hover rounded border border-[color:var(--wiki-panel-border)] bg-[color:var(--surface)] p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
                  #{index + 1} • {tool.category[locale]}
                </p>
                <p className="text-sm font-semibold text-[color:var(--text-strong)]">{tool.name}</p>
                <p className="mt-1 break-words text-sm text-[color:var(--text)]">{tool.summary[locale]}</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">{tool.benefit[locale]}</p>
                <TrackableAnchor
                  href={tool.affiliateHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  event="affiliate_click"
                  meta={{ page: "home_wiki", tool: tool.name, locale }}
                  className="btn-secondary mt-3 inline-flex px-3 py-1.5 text-xs"
                >
                  {locale === "fr" ? "Ouvrir l'outil" : "Open tool"}
                </TrackableAnchor>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="wiki-panel mt-4 rounded-md p-4">
        <AffiliateDisclosureInline locale={locale} />
      </section>

      <section className="wiki-panel mt-4 overflow-hidden rounded-md">
        <div className="wiki-head px-4 py-2 text-xl">
          {locale === "fr" ? "Contribuer et progresser" : "Contribute and progress"}
        </div>
        <div className="flex flex-wrap items-center gap-3 p-4 text-sm text-[color:var(--text)]">
          <TrackableAnchor href={leadMagnetHref} event="lead_magnet_click" meta={{ page: "home_wiki", locale }} className="do-link">
            {dict.home.ctaPrimary}
          </TrackableAnchor>
          <span>•</span>
          <Link href={`/${locale}/news`} className="do-link">
            {locale === "fr" ? "Suivre les actualités IA/CS" : "Follow AI + Cybersecurity news"}
          </Link>
          <span>•</span>
          <Link href={`/${locale}/blog`} className="do-link">
            {locale === "fr" ? "Explorer les articles" : "Explore articles"}
          </Link>
          <span>•</span>
          <Link href={`/${locale}/compare`} className="do-link">
            {locale === "fr" ? "Lab outils et plateformes" : "Tools and platform lab"}
          </Link>
        </div>
      </section>

      <section className="wiki-panel mt-4 overflow-hidden rounded-md">
        <div className="wiki-head wiki-head-purple px-4 py-2 text-xl">
          {locale === "fr" ? "Preuves sociales" : "Social proof"}
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {socialStats.map((line) => (
            <article key={line} className="rounded border border-[color:var(--wiki-panel-border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)]">
              {line}
            </article>
          ))}
        </div>
        {siteConfig.testimonials.length ? (
          <div className="grid gap-3 border-t border-[color:var(--wiki-panel-border)] p-4 md:grid-cols-3">
            {siteConfig.testimonials.map((testimonial) => (
              <article key={`${testimonial.name}-${testimonial.role[locale]}`} className="rounded border border-[color:var(--wiki-panel-border)] bg-[color:var(--surface)] p-3">
                <p className="text-sm text-[color:var(--text)]">&ldquo;{testimonial.quote[locale]}&rdquo;</p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--text-strong)]">{testimonial.name}</p>
                <p className="text-xs text-[color:var(--muted)]">{testimonial.role[locale]}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="wiki-panel mt-4 overflow-hidden rounded-md">
        <div className="wiki-head px-4 py-2 text-xl">
          {locale === "fr" ? "Références de connaissance" : "Knowledge references"}
        </div>
        <ol className="space-y-2 p-4 text-sm text-[color:var(--text)]">
          {knowledgeReferences.map((reference, index) => (
            <li key={reference.href} className="leading-7">
              <span className="mr-2 text-[color:var(--muted)]">[{index + 1}]</span>
              <a href={reference.href} target="_blank" rel="noopener noreferrer nofollow" className="do-link">
                {reference.label}
              </a>
              <span className="ml-2 text-xs text-[color:var(--muted)]">({reference.source})</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-4">
        <EditorialTrust locale={locale} />
      </div>

      <section id="newsletter" className="mt-10">
        <Newsletter locale={locale} source="home" />
      </section>
    </div>
  );
}
