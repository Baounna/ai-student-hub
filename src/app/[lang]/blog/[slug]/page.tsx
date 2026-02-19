import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateDisclosureInline } from "@/components/affiliate-disclosure-inline";
import { ArticleToc } from "@/components/article-toc";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackToTop } from "@/components/back-to-top";
import { EditorialTrust } from "@/components/editorial-trust";
import { LatestUpdatesBlock } from "@/components/latest-updates-block";
import { Newsletter } from "@/components/newsletter";
import { PostArticleCta } from "@/components/post-article-cta";
import { ReadingProgress } from "@/components/reading-progress";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { recommendedTools, getLocalizedPost, posts, slugify } from "@/content/posts";
import { StickyPostCta } from "@/components/sticky-post-cta";
import { isLocale, type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { absoluteUrl } from "@/lib/site-url";

const ScrollCaptureCta = dynamic(() => import("@/components/scroll-capture-cta").then((mod) => mod.ScrollCaptureCta), {
  ssr: false
});

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

export async function generateMetadata({ params }: { params: { lang: string; slug: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};
  const post = getLocalizedPost(params.slug, params.lang);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/${params.lang}/blog/${params.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      images: [{ url: post.coverImage, width: 1200, height: 675, alt: post.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage]
    },
    alternates: {
      languages: {
        en: `/en/blog/${params.slug}`,
        fr: `/fr/blog/${params.slug}`
      }
    }
  };
}

export default function LocalizedBlogPostPage({ params }: { params: { lang: string; slug: string } }) {
  if (!isLocale(params.lang)) return null;
  const locale: Locale = params.lang;
  const dict = getDictionary(locale);
  const post = getLocalizedPost(params.slug, locale);

  if (!post) notFound();
  const relatedPosts = post.relatedSlugs
    .map((relatedSlug) => getLocalizedPost(relatedSlug, locale))
    .filter((related): related is NonNullable<typeof related> => Boolean(related));
  const tocItems = [
    { id: "summary", label: locale === "fr" ? "Synthese" : "Summary" },
    { id: "latest-updates", label: locale === "fr" ? "Dernieres actus" : "Latest updates" },
    ...(post.references.length ? [{ id: "references", label: "References" }] : []),
    { id: "resources", label: locale === "fr" ? "Ressources" : "Resources" },
    { id: "tools", label: locale === "fr" ? "Outils" : "Tools" },
    ...(relatedPosts.length ? [{ id: "related", label: locale === "fr" ? "Lectures" : "Related" }] : []),
    { id: "newsletter", label: "Newsletter" }
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: [absoluteUrl(post.coverImage)],
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: "AI Student Hub"
    },
    publisher: {
      "@type": "Organization",
      name: "AI Student Hub"
    },
    mainEntityOfPage: absoluteUrl(`/${locale}/blog/${post.slug}`),
    citation: post.references.map((reference) => reference.href)
  };

  return (
    <article className="page-shell max-w-6xl py-10 md:py-12">
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Breadcrumbs
        items={[
          { label: "AI Student Hub", href: `/${locale}` },
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
              <span>{post.readTime}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/${locale}/blog/category/${slugify(post.category)}`}
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs text-[color:var(--primary)]"
              >
                {post.category}
              </Link>
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/${locale}/blog/tag/${slugify(tag)}`}
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs text-[color:var(--text)]"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{locale === "fr" ? "Article en bref" : "At a glance"}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>
                {locale === "fr"
                  ? `1. ${post.references.length} source${post.references.length > 1 ? "s" : ""} fiable${post.references.length > 1 ? "s" : ""}.`
                  : `1. ${post.references.length} reliable source${post.references.length > 1 ? "s" : ""}.`}
              </li>
              <li>
                {locale === "fr"
                  ? `2. Lecture en ${post.readTime}.`
                  : `2. ${post.readTime} reading time.`}
              </li>
              <li>
                {locale === "fr"
                  ? `3. ${relatedPosts.length} lecture${relatedPosts.length > 1 ? "s" : ""} liee${relatedPosts.length > 1 ? "s" : ""} pour continuer.`
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

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8">
          <div className="media-frame group relative aspect-[16/10] rounded-2xl">
            <Image
              src={post.coverImage}
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
                  <p className={idx === 0 ? "text-[color:var(--text-strong)]" : undefined}>
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
                  {idx === 1 && (
                    <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-soft)]/55 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--primary)]">
                        {dict.blog.inPostCallout}
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--text)]">{dict.blog.inPostCalloutBody}</p>
                      <Link href={`/${locale}/resources`} className="do-link mt-3 inline-block text-sm">
                        {dict.blog.openResources}
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div id="latest-updates" className="anchor-offset">
            <LatestUpdatesBlock locale={locale} limit={8} />
          </div>

          {!!post.references.length && (
            <section id="references" className="anchor-offset reading-panel rounded-3xl p-6">
              <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">
                {locale === "fr" ? "References et sources" : "References and sources"}
              </h2>
              <ol className="mt-4 space-y-2 text-sm text-[color:var(--text)]">
                {post.references.map((reference, index) => (
                  <li key={`${reference.href}-${index}`} id={`reference-${index + 1}`} className="leading-7">
                    <span className="mr-2 text-[color:var(--muted)]">[{index + 1}]</span>
                    <a href={reference.href} target="_blank" rel="noopener noreferrer nofollow" className="do-link">
                      {reference.label[locale]}
                    </a>
                    <span className="ml-2 text-xs text-[color:var(--muted)]">({reference.source})</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section id="resources" className="anchor-offset surface rounded-2xl p-6">
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
              {locale === "fr" ? "Outils recommandés pour passer à l'action" : "Recommended tools to execute faster"}
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {recommendedTools.slice(0, 3).map((tool) => (
                <article key={tool.name} className="glass rounded-xl p-4">
                  <Image src={tool.icon} alt="" width={30} height={30} loading="lazy" className="mb-2 rounded-md" />
                  <h3 className="text-sm font-semibold text-[color:var(--text-strong)]">{tool.name}</h3>
                  <p className="mt-1 text-xs text-[color:var(--text)]">{tool.summary[locale]}</p>
                  <p className="mt-2 text-xs text-[color:var(--muted)]">{tool.benefit[locale]}</p>
                  <TrackableAnchor
                    href={tool.affiliateHref}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    event="affiliate_click"
                    meta={{ page: "blog_post_tools", tool: tool.name, slug: post.slug, locale }}
                    className="btn-secondary mt-3 inline-flex px-3 py-1.5 text-xs"
                  >
                    {locale === "fr" ? "Ouvrir l'outil" : "Open tool"}
                  </TrackableAnchor>
                </article>
              ))}
            </div>
          </section>

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
            <Newsletter locale={locale} source="post_main" />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <ArticleToc title={locale === "fr" ? "Dans cette page" : "On this page"} items={tocItems} className="mt-0" />
          <EditorialTrust locale={locale} compact />
          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Continuer apres lecture" : "Continue after reading"}
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              <Link href={`/${locale}/news`} className="btn-secondary text-center">
                {locale === "fr" ? "Actualites IA/CS" : "AI/CS news"}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-secondary text-center">
                {locale === "fr" ? "Comparatifs" : "Comparisons"}
              </Link>
              <Link href={`/${locale}/resources`} className="btn-primary text-center">
                {locale === "fr" ? "Outils recommandes" : "Recommended tools"}
              </Link>
            </div>
          </div>
          <Newsletter compact locale={locale} source="post_aside" />
        </aside>
      </div>
      <BackToTop />
      <StickyPostCta locale={locale} />
      <ScrollCaptureCta locale={locale} />
    </article>
  );
}
