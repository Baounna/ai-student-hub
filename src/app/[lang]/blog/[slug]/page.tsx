import type { Metadata } from "next";
import { ogImageUrl, coverImageUrl } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AffiliateDisclosureInline } from "@/components/affiliate-disclosure-inline";
import { ArticleToc } from "@/components/article-toc";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackToTop } from "@/components/back-to-top";
import { EditorialTrust } from "@/components/editorial-trust";
import { LatestUpdatesBlock } from "@/components/latest-updates-block";
import { Newsletter } from "@/components/newsletter";
import { PostArticleCta } from "@/components/post-article-cta";
import { ShareArticle } from "@/components/share-article";
import { ReadingProgress } from "@/components/reading-progress";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { siteConfig } from "@/config/site";
import { getLocalizedPost, getPostTrack, getPostsByTrack, posts, recommendedTools, slugify } from "@/content/posts";
import { StickyPostCta } from "@/components/sticky-post-cta";
import { isLocale, type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";
import { canSellProduct, getProductCheckoutUrl } from "@/lib/product";
import { jsonLd } from "@/lib/json-ld";
import { formatReadTime, readMinutes } from "@/lib/read-time";
import { ScrollCaptureCtaLazy } from "@/components/scroll-capture-cta-lazy";

export function generateStaticParams() {
  return locales.flatMap((lang) => posts.map((post) => ({ lang, slug: post.slug })));
}

function resolveLocalizedHref(href: string, locale: Locale) {
  if (!href.startsWith("/")) return href;

  if (href === "/") return `/${locale}`;

  // Prevent double locale prefixes if data already contains a locale route.
  if (/^\/(en|fr)(\/|$)/.test(href)) {
    return href;
  }

  return `/${locale}${href}`;
}

function formatPublishedDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(date));
}

function getCitationIndex(paragraphIndex: number, totalReferences: number) {
  if (!totalReferences) return undefined;
  return (paragraphIndex % totalReferences) + 1;
}

function getHostLabel(href: string) {
  try {
    const url = new URL(href);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function generateMetadata(props: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};
  const post = getLocalizedPost(params.slug, params.lang);
  if (!post) return {};

  return {
    // seoTitle only overrides the <title> tag. Everything else on this page
    // -- H1, JSON-LD headline, breadcrumb, OG image, share text -- keeps
    // post.title, so a shorter search result never changes the page.
    title: post.seoTitle || post.title,
    description: post.excerpt,
    keywords: getSeoKeywords(params.lang, "blogPost", post.keywords),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/${params.lang}/blog/${params.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      images: [{ url: ogImageUrl(post.title, post.category), width: 1200, height: 630, alt: post.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImageUrl(post.title, post.category)]
    },
    alternates: localizedAlternates(`/blog/${params.slug}`, params.lang)
  };
}

export default async function LocalizedBlogPostPage(props: { params: Promise<{ lang: string; slug: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;
  const locale: Locale = params.lang;
  const nonce = (await headers()).get("x-csp-nonce") || undefined;
  const dict = getDictionary(locale);
  const post = getLocalizedPost(params.slug, locale);

  if (!post) notFound();
  const relatedPosts = post.relatedSlugs
    .map((relatedSlug) => getLocalizedPost(relatedSlug, locale))
    .filter((related): related is NonNullable<typeof related> => Boolean(related));
  const currentTrack = getPostTrack(post);
  const bridgeTrack = currentTrack === "ai" ? "cs" : "ai";
  const bridgePosts = getPostsByTrack(bridgeTrack, locale)
    .filter((candidate) => candidate.slug !== post.slug && !relatedPosts.some((related) => related.slug === candidate.slug))
    .slice(0, 3);
  const wordCount = post.content.reduce((sum, paragraph) => sum + paragraph.split(/\s+/).filter(Boolean).length, 0);
  const readingEffortMinutes = Math.max(1, Math.round(wordCount / 220));
  const executionAssets = post.affiliateCallout.links.length + Math.min(recommendedTools.length, 3);
  const sourceDensity = wordCount ? Math.max(1, Math.round((post.references.length / wordCount) * 1000)) : 0;
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;
  const checkoutUrl = getProductCheckoutUrl();
  const hasCheckoutUrl = canSellProduct();
  const midIndex = Math.max(1, Math.floor(post.content.length * 0.45));
  const relatedTools = recommendedTools.slice(0, 3);
  const tocItems = [
    { id: "summary", label: locale === "fr" ? "Synthèse" : "Summary" },
    { id: "latest-updates", label: locale === "fr" ? "Dernières actus" : "Latest updates" },
    ...(post.references.length ? [{ id: "references", label: "References" }] : []),
    { id: "resources", label: locale === "fr" ? "Ressources" : "Resources" },
    { id: "tools", label: locale === "fr" ? "Outils" : "Tools" },
    ...(bridgePosts.length ? [{ id: "bridge", label: locale === "fr" ? "Pont IA/CS" : "AI + Cybersecurity bridge" }] : []),
    ...(relatedPosts.length ? [{ id: "related", label: locale === "fr" ? "Lectures" : "Related" }] : []),
    { id: "newsletter", label: "Newsletter" }
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: [absoluteUrl(coverImageUrl(post.slug, post.category))],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    inLanguage: locale,
    author: {
      "@type": "Person",
      name: "AI and Cybersecurity News"
    },
    publisher: {
      "@type": "Organization",
      name: "AI and Cybersecurity News",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.svg")
      }
    },
    mainEntityOfPage: absoluteUrl(`/${locale}/blog/${post.slug}`),
    keywords: post.keywords.join(", "),
    citation: post.references.map((reference) => reference.href)
  };

  return (
    <article className="page-shell max-w-6xl py-10 md:py-12">
      <ReadingProgress />
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }} />
      <Breadcrumbs
        locale={locale}
        items={[
          { label: "AI and Cybersecurity News", href: `/${locale}` },
          { label: dict.nav.blog, href: `/${locale}/blog` },
          { label: post.title }
        ]}
      />

      <header className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{post.category}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">{post.title}</h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">{post.excerpt}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[color:var(--muted)]">
              <time dateTime={post.publishedAt}>{formatPublishedDate(post.publishedAt, locale)}</time>
              <span className="hidden h-1 w-1 rounded-full bg-[color:var(--muted)] sm:block" />
              <span>{formatReadTime(post.readTime, locale)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/${locale}/blog/category/${slugify(post.category)}`}
                className="blog-chip rounded-full px-2.5 py-1 text-xs text-[color:var(--primary)]"
              >
                {post.category}
              </Link>
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/${locale}/blog/tag/${slugify(tag)}`}
                  className="blog-chip rounded-full px-2.5 py-1 text-xs text-[color:var(--text)]"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          <div className="blog-aside-card rounded-2xl p-5">
            <p className="do-kicker">{locale === "fr" ? "Article en bref" : "At a glance"}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>
                {locale === "fr"
                  ? `1. ${post.references.length} source${post.references.length > 1 ? "s" : ""} fiable${post.references.length > 1 ? "s" : ""}.`
                  : `1. ${post.references.length} reliable source${post.references.length > 1 ? "s" : ""}.`}
              </li>
              <li>
                {locale === "fr"
                  ? `2. Lecture en ${readMinutes(post.readTime)} min.`
                  : `2. ${readMinutes(post.readTime)} min reading time.`}
              </li>
              <li>
                {locale === "fr"
                  ? `3. ${relatedPosts.length} lecture${relatedPosts.length > 1 ? "s" : ""} liée${relatedPosts.length > 1 ? "s" : ""} pour continuer.`
                  : `3. ${relatedPosts.length} related deep-dive${relatedPosts.length > 1 ? "s" : ""} to continue.`}
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/blog`} className="btn-secondary">
                {locale === "fr" ? "Retour blog" : "Back to blog"}
              </Link>
              <Link href={`/${locale}/resources`} className="btn-primary">
                {locale === "fr" ? "Ressources" : "Resources"}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="post-signal-grid mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="blog-signal-card rounded-xl p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
            {locale === "fr" ? "Sources" : "Sources"}
          </p>
          <p className="blog-signal-value mt-1 text-[color:var(--text-strong)]">
            {post.references.length} {locale === "fr" ? "références" : "references"}
          </p>
        </article>
        <article className="blog-signal-card rounded-xl p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
            {locale === "fr" ? "Effort réel" : "Read effort"}
          </p>
          <p className="blog-signal-value mt-1 text-[color:var(--text-strong)]">~{readingEffortMinutes} min</p>
        </article>
        <article className="blog-signal-card rounded-xl p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
            {locale === "fr" ? "Actions directes" : "Action assets"}
          </p>
          <p className="blog-signal-value mt-1 text-[color:var(--text-strong)]">
            {executionAssets} {locale === "fr" ? "liens pratiques" : "practical links"}
          </p>
        </article>
        <article className="blog-signal-card rounded-xl p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
            {locale === "fr" ? "Densité source" : "Source density"}
          </p>
          <p className="blog-signal-value mt-1 text-[color:var(--text-strong)]">
            {sourceDensity}/1k {locale === "fr" ? "mots" : "words"}
          </p>
        </article>
      </section>

      <section className="blog-aside-card mt-5 rounded-2xl p-5">
        <p className="do-kicker">{locale === "fr" ? "Start here" : "Start here"}</p>
        <h2 className="font-display section-title mt-2 font-semibold text-[color:var(--text-strong)]">
          {locale === "fr" ? "Passez de la lecture à l'action en 3 clics" : "Move from reading to execution in 3 clicks"}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--text)]">
          {locale === "fr"
            ? "Choisissez votre prochain pas: stages, outils, ou guide carrière."
            : "Pick your next action: internships, tools, or the career guide."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <TrackableAnchor
            href={leadMagnetHref}
            event="lead_magnet_click"
            meta={{ page: "blog_post_intro", slug: post.slug, locale }}
            className="btn-primary"
          >
            {locale === "fr" ? "Stages ouverts" : "Open internships"}
          </TrackableAnchor>
          <Link href={`/${locale}/compare`} className="btn-secondary">
            {locale === "fr" ? "Lab outils" : "Tools lab"}
          </Link>
          {hasCheckoutUrl ? (
            <TrackableAnchor
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              event="product_checkout_click"
              meta={{ page: "blog_post_intro", slug: post.slug, locale, offer: "ai-career-guide" }}
              className="btn-secondary"
            >
              {locale === "fr" ? "Acheter le guide" : "Buy guide"}
            </TrackableAnchor>
          ) : (
            <Link href={`/${locale}/product/ai-career-guide`} className="btn-secondary">
              {locale === "fr" ? "Voir le guide" : "Open guide"}
            </Link>
          )}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-8">
          <div className="media-frame group relative aspect-[16/10] rounded-2xl">
            <Image
              src={coverImageUrl(post.slug, post.category)}
              alt={post.title}
              width={1200}
              height={675}
              priority
              sizes="(max-width: 1024px) 100vw, 900px"
              className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
          </div>

          <div id="summary" className="anchor-offset reading-panel rounded-3xl p-6 md:p-10">
            <div className="reading-prose space-y-6">
              {post.content.map((paragraph, idx) => (
                <div key={idx}>
                  <p className={idx === 0 ? "reading-lead text-[color:var(--text-strong)]" : undefined}>
                    {paragraph}
                    {post.references.length ? (
                      <>
                        {" "}
                        <a
                          href={`#reference-${getCitationIndex(idx, post.references.length)}`}
                          className="inline-citation"
                          aria-label={`Reference ${getCitationIndex(idx, post.references.length)}`}
                        >
                          [{getCitationIndex(idx, post.references.length)}]
                        </a>
                      </>
                    ) : null}
                  </p>
                  {idx === midIndex && (
                    <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-soft)]/55 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">
                        {locale === "fr" ? "Bloc outils partenaire" : "Partner tools block"}
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--text)]">
                        {locale === "fr"
                          ? "Sélection d'outils utiles pour appliquer ce chapitre sans perdre de temps."
                          : "Curated tools that help you execute this chapter without friction."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {relatedTools.slice(0, 2).map((tool) => (
                          <TrackableAnchor
                            key={`mid-${tool.name}`}
                            href={tool.affiliateHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            event="affiliate_click"
                            meta={{ page: "blog_post_mid_block", tool: tool.name, slug: post.slug, locale }}
                            className="btn-secondary px-3 py-1.5 text-xs"
                          >
                            {locale === "fr" ? `Tester ${tool.name}` : `Try ${tool.name}`}
                          </TrackableAnchor>
                        ))}
                      </div>
                      <Link href={`/${locale}/resources`} className="do-link mt-3 inline-block text-sm">
                        {dict.blog.openResources}
                      </Link>
                      <AffiliateDisclosureInline locale={locale} className="mt-3 text-xs text-[color:var(--muted)]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div id="latest-updates" className="anchor-offset">
            <LatestUpdatesBlock locale={locale} limit={8} />
          </div>

          {/* Directly after the body, where a reader who finished it is. */}
          <ShareArticle
            url={absoluteUrl(`/${locale}/blog/${post.slug}`)}
            title={post.title}
            locale={locale}
          />

          {!!post.references.length && (
            <section id="references" className="anchor-offset reading-panel rounded-3xl p-6">
              <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">
                {locale === "fr" ? "Références et sources" : "References and sources"}
              </h2>
              <ol className="mt-4 space-y-2 text-sm text-[color:var(--text)]">
                {post.references.map((reference, index) => (
                  <li key={`${reference.href}-${index}`} id={`reference-${index + 1}`} className="leading-7">
                    <span className="mr-2 text-[color:var(--muted)]">[{index + 1}]</span>
                    <a href={reference.href} target="_blank" rel="noopener noreferrer nofollow" className="do-link">
                      {reference.label[locale]}
                    </a>
                    {getHostLabel(reference.href) ? (
                      <span className="reference-host-pill ml-2">{getHostLabel(reference.href)}</span>
                    ) : null}
                    <span className="ml-2 text-xs text-[color:var(--muted)]">({reference.source})</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section id="resources" className="anchor-offset blog-aside-card rounded-2xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">{dict.nav.resources}</p>
            <h2 className="font-display section-title mt-2 font-semibold text-[color:var(--text-strong)]">
              {post.affiliateCallout.headline[locale]}
            </h2>
            <p className="card-copy mt-2 text-[color:var(--text)]">{post.affiliateCallout.description[locale]}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {post.affiliateCallout.links.map((link) => (
                <Link
                  key={`${link.href}-${link.label[locale]}`}
                  href={resolveLocalizedHref(link.href, locale)}
                  className="btn-secondary"
                >
                  {link.label[locale]}
                </Link>
              ))}
            </div>
            <AffiliateDisclosureInline locale={locale} className="mt-4 text-xs text-[color:var(--muted)]" />
          </section>

          <section id="tools" className="anchor-offset">
            <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Outils liés à ce sujet" : "Related tools for this topic"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {locale === "fr"
                ? "Stack orientée étudiants pour accélérer implémentation, test, et deployment de ce sujet."
                : "Student-focused stack to speed up implementation, testing, and deployment for this topic."}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {relatedTools.map((tool) => (
                <article key={tool.name} className="blog-aside-card rounded-xl p-4">
                  <Image src={tool.icon} alt="" width={30} height={30} loading="lazy" className="mb-2 rounded-md" />
                  <h3 className="text-sm font-semibold text-[color:var(--text-strong)]">{tool.name}</h3>
                  <p className="mt-1 text-xs text-[color:var(--text)]">{tool.summary[locale]}</p>
                  <p className="mt-2 text-xs text-[color:var(--muted)]">{tool.benefit[locale]}</p>
                  <TrackableAnchor
                    href={tool.affiliateHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    event="affiliate_click"
                    meta={{ page: "blog_post_related_tools", tool: tool.name, slug: post.slug, locale }}
                    className="btn-secondary mt-3 inline-flex px-3 py-1.5 text-xs"
                  >
                    {locale === "fr" ? "Ouvrir l'outil" : "Open tool"}
                  </TrackableAnchor>
                </article>
              ))}
            </div>
            <section className="mt-4 overflow-x-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]">
              <table className="min-w-[640px] w-full text-left text-sm">
                <thead className="bg-[color:var(--bg-soft)]/45 text-[color:var(--text)]">
                  <tr>
                    <th className="px-4 py-3">{locale === "fr" ? "Outil" : "Tool"}</th>
                    <th className="px-4 py-3">{locale === "fr" ? "Idéal pour étudiants" : "Best for students"}</th>
                    <th className="px-4 py-3">{locale === "fr" ? "Gain principal" : "Primary gain"}</th>
                    <th className="px-4 py-3">{locale === "fr" ? "Action" : "Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedTools.map((tool, index) => (
                    <tr key={`table-${tool.name}`} className="border-t border-[color:var(--border)]">
                      <td className="px-4 py-3 font-semibold text-[color:var(--text-strong)]">{tool.name}</td>
                      <td className="px-4 py-3 text-[color:var(--text)]">{tool.summary[locale]}</td>
                      <td className="px-4 py-3 text-[color:var(--text)]">{tool.benefit[locale]}</td>
                      <td className="px-4 py-3">
                        <TrackableAnchor
                          href={tool.affiliateHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          event="affiliate_click"
                          meta={{ page: "blog_post_tools_table", tool: tool.name, slug: post.slug, locale, rank: index + 1 }}
                          className="do-link text-sm"
                        >
                          {locale === "fr" ? "Essayer" : "Try"}
                        </TrackableAnchor>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <AffiliateDisclosureInline locale={locale} className="mt-3 text-xs text-[color:var(--muted)]" />
          </section>

          {bridgePosts.length ? (
            <section id="bridge" className="anchor-offset reading-panel rounded-2xl p-6">
              <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
                {bridgeTrack === "cs"
                  ? locale === "fr"
                    ? "Pont vers l'informatique"
                    : "Bridge into cybersecurity"
                  : locale === "fr"
                    ? "Pont vers l'IA"
                    : "Bridge into AI systems"}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--text)]">
                {bridgeTrack === "cs"
                  ? locale === "fr"
                    ? "Connectez cet article IA avec des fondamentaux système/backend pour renforcer votre fiabilité produit."
                    : "Connect this AI article with system/backend fundamentals to strengthen product reliability."
                  : locale === "fr"
                    ? "Connectez cet article CS avec des patterns IA/LLM pour transformer votre socle technique en projets différenciants."
                    : "Connect this CS article with AI/LLM patterns to turn technical depth into differentiated projects."}
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {bridgePosts.map((candidate) => (
                  <article key={candidate.slug} className="blog-chip rounded-xl p-4">
                    <p className="text-xs text-[color:var(--muted)]">{candidate.category}</p>
                    <h3 className="mt-1 text-sm font-semibold text-[color:var(--text-strong)]">{candidate.title}</h3>
                    <Link href={`/${locale}/blog/${candidate.slug}`} className="do-link mt-2 inline-block text-sm">
                      {locale === "fr" ? "Lire cet article" : "Read this article"}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <div>
            <PostArticleCta locale={locale} />
          </div>

          {!!relatedPosts.length && (
            <section id="related" className="anchor-offset">
              <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">{dict.blog.related}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {relatedPosts.map((relatedPost) => (
                  <article key={relatedPost.slug} className="card-hover glass rounded-2xl p-5">
                    <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">{relatedPost.title}</h3>
                    <p className="mt-2 text-sm text-[color:var(--text)]">{relatedPost.excerpt}</p>
                    <Link href={`/${locale}/blog/${relatedPost.slug}`} className="do-link mt-3 inline-block text-sm">
                      {dict.blog.readPost}
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div id="newsletter" className="anchor-offset">
            <Newsletter locale={locale} source="blog_post" />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <ArticleToc title={locale === "fr" ? "Dans cette page" : "On this page"} items={tocItems} className="mt-0" />
          <EditorialTrust locale={locale} compact />
          <div className="blog-aside-card rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Continuer après lecture" : "Continue after reading"}
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              <Link href={`/${locale}/news`} className="btn-secondary text-center">
                {locale === "fr" ? "Actualités IA/CS" : "AI + Cybersecurity news"}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-secondary text-center">
                {locale === "fr" ? "Lab outils" : "Tools lab"}
              </Link>
              <Link href={`/${locale}/resources`} className="btn-primary text-center">
                {locale === "fr" ? "Outils recommandés" : "Recommended tools"}
              </Link>
            </div>
          </div>
          <Newsletter compact locale={locale} source="blog_post_aside" />
        </aside>
      </div>
      <BackToTop />
      <StickyPostCta locale={locale} />
      <ScrollCaptureCtaLazy locale={locale} />
    </article>
  );
}
