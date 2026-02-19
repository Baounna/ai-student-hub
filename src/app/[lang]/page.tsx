import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AffiliateDisclosureInline } from "@/components/affiliate-disclosure-inline";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { getAutoNews } from "@/content/auto-news";
import { getLatestNews, getLocalizedNews } from "@/content/news";
import { siteConfig } from "@/config/site";
import { getAllCategories, getPopularPosts, recommendedTools, slugify } from "@/content/posts";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { alternateLanguages } from "@/i18n/helpers";
import { absoluteUrl } from "@/lib/site-url";
import { isSafeHttpUrl, normalizeHttpUrl } from "@/lib/url";

function formatPublishedDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(date));
}

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  const dict = getDictionary(params.lang);

  return {
    title: dict.home.headline,
    description: dict.home.subheadline,
    openGraph: {
      title: dict.home.headline,
      description: dict.home.subheadline,
      url: `/${params.lang}`,
      siteName: "AI Student Hub",
      type: "website",
      images: [{ url: "/images/post-portfolio.svg", width: 1200, height: 675, alt: "AI Student Hub" }]
    },
    twitter: {
      card: "summary_large_image",
      title: dict.home.headline,
      description: dict.home.subheadline,
      images: ["/images/post-portfolio.svg"]
    },
    alternates: {
      languages: alternateLanguages("")
    }
  };
}

export default function LocalizedHomePage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const dict = getDictionary(locale);
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;

  const popularPosts = getPopularPosts(locale, 3);
  const featuredPost = popularPosts[0];
  const sidePosts = popularPosts.slice(1);
  const categories = getAllCategories();
  const latestNews = getLatestNews(locale, 4);
  const allNews = getLocalizedNews(locale);
  const autoUpdates = getAutoNews(locale, 6);
  const socialStats =
    siteConfig.socialProofStats.length > 0
      ? siteConfig.socialProofStats
      : locale === "fr"
        ? ["+1000 etudiants servis (objectif 2026)", "+30 ressources pratiques publiees", "Mises a jour hebdomadaires IA + CS"]
        : ["1000+ students supported (2026 target)", "30+ practical resources published", "Weekly AI + CS updates"];

  const didYouKnowItems =
    locale === "fr"
      ? [
          "Le Web a ete propose en 1989 par Tim Berners-Lee pour partager la recherche scientifique.",
          "Le langage C, créé dans les années 1970, influence encore la plupart des langages modernes.",
          "Git (2005) est devenu l'outil standard pour la collaboration en ingenierie logicielle.",
          "Un portfolio deploye augmente souvent plus le signal carrière qu'un grand nombre de certificats."
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
            title: "Commencer par l'actualite",
            body: "Briefs rapides sur les signaux IA/CS de la semaine.",
            href: `/${locale}/news`,
            cta: "Voir les briefs"
          },
          {
            title: "Passer a l'execution",
            body: "Guides pratiques pour livrer des projets portfolio.",
            href: `/${locale}/blog`,
            cta: "Lire le blog"
          },
          {
            title: "Choisir les bons outils",
            body: "Comparatifs orientés budget etudiant et vitesse.",
            href: `/${locale}/compare`,
            cta: "Ouvrir comparatifs"
          }
        ]
      : [
          {
            title: "Start with weekly signals",
            body: "Fast AI/CS briefs focused on what changed this week.",
            href: `/${locale}/news`,
            cta: "Open briefs"
          },
          {
            title: "Move into execution",
            body: "Practical guides to ship portfolio-grade projects.",
            href: `/${locale}/blog`,
            cta: "Read the blog"
          },
          {
            title: "Pick tools with confidence",
            body: "Student-budget comparisons with clear tradeoffs.",
            href: `/${locale}/compare`,
            cta: "Open comparisons"
          }
        ];

  const checkoutUrlRaw = (process.env.NEXT_PUBLIC_PRODUCT_CHECKOUT_URL || "").trim();
  const checkoutUrl = isSafeHttpUrl(checkoutUrlRaw) ? normalizeHttpUrl(checkoutUrlRaw) : "";
  const hasCheckoutUrl = Boolean(checkoutUrl);

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
      label: locale === "fr" ? "arXiv (recherche IA)" : "arXiv (AI research)",
      href: "https://arxiv.org/",
      source: "arXiv"
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
    name: "AI Student Hub",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />

      <section className="wiki-panel overflow-hidden rounded-md">
        <div className="wiki-head hero-title px-6 py-3 text-center font-bold">
          {locale === "fr" ? "Bienvenue sur AI Student Hub" : "Welcome to AI Student Hub"}
        </div>
        <div className="body-copy px-6 py-4 text-center text-[color:var(--text)]">
          <p>
            {locale === "fr"
              ? "L'encyclopedie pratique de l'IA et de l'informatique orientee execution pour les etudiants."
              : "The practical AI and computer science encyclopedia for execution-focused students."}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <TrackableAnchor href={leadMagnetHref} event="lead_magnet_click" meta={{ page: "home_header", locale }} className="btn-primary">
              {dict.home.ctaPrimary}
            </TrackableAnchor>
            <Link href={`/${locale}/news`} className="btn-secondary">
              {locale === "fr" ? "Actualites IA/CS" : "AI/CS news"}
            </Link>
            <Link href={`/${locale}/compare`} className="btn-secondary">
              {locale === "fr" ? "Comparer outils" : "Compare tools"}
            </Link>
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {allNews.length} {locale === "fr" ? "briefs d'actualite" : "news briefs"} • {popularPosts.length}{" "}
            {locale === "fr" ? "articles principaux" : "core articles"} • {categories.length}{" "}
            {locale === "fr" ? "domaines" : "domains"} • {recommendedTools.length}{" "}
            {locale === "fr" ? "outils recommandes" : "recommended tools"}
          </p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        {quickStartCards.map((card) => (
          <article key={card.title} className="wiki-panel rounded-md p-4">
            <p className="do-kicker">{locale === "fr" ? "Parcours rapide" : "Quick pathway"}</p>
            <h2 className="font-display mt-2 text-lg font-semibold text-[color:var(--text-strong)] md:text-xl">{card.title}</h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">{card.body}</p>
            <Link href={card.href} className="do-link mt-3 inline-block text-sm">
              {card.cta}
            </Link>
          </article>
        ))}
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
                    src={featuredPost.coverImage}
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
                    {featuredPost.category} • {featuredPost.readTime}
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
                  {locale === "fr" ? "Recemment en vedette:" : "Recently featured:"}
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
                {locale === "fr" ? "Toutes les actualites" : "All news"}
              </Link>{" "}
              •{" "}
              <Link href={`/${locale}/blog`} className="do-link">
                {locale === "fr" ? "Toutes les analyses" : "All analysis posts"}
              </Link>{" "}
              •{" "}
              <Link href={`/${locale}/compare`} className="do-link">
                {locale === "fr" ? "Comparatifs techniques" : "Technical comparisons"}
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <section className="wiki-panel overflow-hidden rounded-md">
          <div className="wiki-head wiki-head-blue px-4 py-2 text-xl md:text-2xl">
            {locale === "fr" ? "Signaux web automatiques (AI/CS)" : "Automatic web signals (AI/CS)"}
          </div>
          <div className="p-4">
            <p className="text-sm text-[color:var(--text)]">
              {locale === "fr"
                ? "Selection automatique depuis des sources fiables. Utilise ces signaux pour choisir ton prochain article."
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
            {locale === "fr" ? "Plan revenu starter ($10/mois)" : "Starter revenue plan ($10/month)"}
          </div>
          <div className="space-y-3 p-4 text-sm text-[color:var(--text)]">
            <p>
              {locale === "fr"
                ? "Objectif realiste: premier palier revenu avec execution legere et constante."
                : "Realistic target: first revenue milestone with light but consistent execution."}
            </p>
            <ul className="space-y-2">
              <li>
                {locale === "fr"
                  ? "1. Publie 1 article utile/semaine base sur les signaux auto."
                  : "1. Publish 1 useful article/week based on auto signals."}
              </li>
              <li>
                {locale === "fr"
                  ? "2. Mets 2 CTA naturels vers outils/comparatifs dans chaque article."
                  : "2. Add 2 natural tool/comparison CTAs in each article."}
              </li>
              <li>
                {locale === "fr"
                  ? "3. Capture emails puis renvoie vers guide $9-$19."
                  : "3. Capture emails, then route to your $9-$19 guide."}
              </li>
            </ul>
            <div className="rounded border border-[color:var(--wiki-panel-border)] bg-[color:var(--surface)] p-3 text-xs text-[color:var(--muted)]">
              {locale === "fr"
                ? "Modele: 300 visites/mois x 4% clic affiliation x 8% conversion x ~$10 commission = ~$9.6/mois."
                : "Model: 300 visits/mo x 4% affiliate CTR x 8% conversion x ~$10 commission = ~$9.6/mo."}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/${locale}/resources`} className="btn-secondary">
                {locale === "fr" ? "Outils recommandes" : "Recommended tools"}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-secondary">
                {locale === "fr" ? "Comparatifs" : "Comparisons"}
              </Link>
              {hasCheckoutUrl ? (
                <TrackableAnchor
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  event="product_checkout_click"
                  meta={{ page: "home_revenue_plan", locale, offer: "ai-career-guide" }}
                  className="btn-primary"
                >
                  {locale === "fr" ? "Acheter le guide" : "Buy the guide"}
                </TrackableAnchor>
              ) : (
                <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary">
                  {locale === "fr" ? "Voir le guide" : "Open student guide"}
                </Link>
              )}
            </div>
            <TrackableAnchor href={leadMagnetHref} event="lead_magnet_click" meta={{ page: "home_revenue_plan", locale }} className="do-link">
              {locale === "fr" ? "Recuperer la roadmap gratuite" : "Get the free roadmap"}
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
            {locale === "fr" ? "Boite a outils etudiante" : "Student toolbox"}
          </div>
          <div className="space-y-3 p-4">
            {recommendedTools.map((tool, index) => (
              <article key={tool.name} className="card-hover rounded border border-[color:var(--wiki-panel-border)] bg-[color:var(--surface)] p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
                  #{index + 1} • {tool.category[locale]}
                </p>
                <p className="text-sm font-semibold text-[color:var(--text-strong)]">{tool.name}</p>
                <p className="mt-1 text-sm text-[color:var(--text)]">{tool.summary[locale]}</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">{tool.benefit[locale]}</p>
                <TrackableAnchor
                  href={tool.affiliateHref}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
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
            {locale === "fr" ? "Suivre les actualites IA/CS" : "Follow AI/CS news"}
          </Link>
          <span>•</span>
          <Link href={`/${locale}/blog`} className="do-link">
            {locale === "fr" ? "Explorer les articles" : "Explore articles"}
          </Link>
          <span>•</span>
          <Link href={`/${locale}/compare`} className="do-link">
            {locale === "fr" ? "Comparer les plateformes" : "Compare platforms"}
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
          {locale === "fr" ? "References de connaissance" : "Knowledge references"}
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
