import type { Metadata } from "next";
import { tagLabel } from "@/lib/tags";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getAllCategories, getCategoriesByTrack, getCategoryTrack, getPostsByCategory, slugify } from "@/content/posts";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords, coverImageUrl, ogImageUrl } from "@/lib/seo";
import { formatReadTime } from "@/lib/read-time";
import { categoryName } from "@/lib/categories";
import { siteConfig } from "@/config/site";
import { isIndexableTaxonomy, postsInCategory } from "@/lib/taxonomy";

export function generateStaticParams() {
  return locales.flatMap((lang) => getAllCategories().map((category) => ({ lang, category: slugify(category) })));
}

/**
 * The slug is a lossy encoding of the real name — "AI Fundamentals" becomes
 * "ai-fundamentals", and title-casing that back gives "Ai Fundamentals", which
 * is what the page showed as its H1. Look the real name up instead, and only
 * fall back to prettifying the slug for a category with no posts yet.
 */
/**
 * The name to show for a category slug, in the reader's language.
 *
 * This returned the English name in both locales, so every French category page
 * put "Career/Interviews" in its H1, breadcrumb, title and description while the
 * typeahead offered "Carrière/Entretiens" for the same page. The slug stays
 * English either way, so the two locales remain a translation pair.
 */
function displayCategory(slug: string, locale: Locale) {
  const match = getAllCategories().find((category) => slugify(category) === slug);
  if (match) return categoryName(match, locale);
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPublishedDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(date));
}

export async function generateMetadata(
  props: {
    params: Promise<{ lang: string; category: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const categoryLabel = displayCategory(params.category, params.lang);

  const categoryTitle = params.lang === "fr" ? `Articles ${categoryLabel}` : `${categoryLabel} articles`;
  const categoryDescription =
    params.lang === "fr"
      ? `Articles de la catégorie ${categoryLabel} sur AI and Cybersecurity News.`
      : `${categoryLabel} category articles on AI and Cybersecurity News.`;

  return {
    title: categoryTitle,
    // Same rule as tags, by count rather than by type: a category page earns a
    // place in the index once it lists enough posts to be worth landing on, and
    // gets there on its own as the site grows. See src/lib/taxonomy.ts.
    robots: isIndexableTaxonomy(postsInCategory(params.category)) ? undefined : { index: false, follow: true },
    description: categoryDescription,
    keywords: getSeoKeywords(params.lang, "blog", [
      params.lang === "fr" ? `categorie ${categoryLabel} ia` : `${categoryLabel} ai category`,
      categoryLabel
    ]),
    // Tag, category and donate pages were the only routes with no
    // og:image, so every share of one rendered as a bare link. The same
    // generated card every other page already uses.
    openGraph: {
      title: categoryTitle,
      description: categoryDescription,
      url: `/${params.lang}/blog/category/${params.category}`,
      type: "website",
      images: [{ url: ogImageUrl(categoryTitle), width: 1200, height: 630, alt: categoryTitle }]
    },
    twitter: {
      card: "summary_large_image",
      title: categoryTitle,
      description: categoryDescription,
      images: [ogImageUrl(categoryTitle)]
    },
    alternates: localizedAlternates(`/blog/category/${params.category}`, params.lang)
  };
}

export default async function LocalizedCategoryPage(props: { params: Promise<{ lang: string; category: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const dict = getDictionary(locale);
  const posts = getPostsByCategory(params.category, locale);
  const currentCategoryLabel = posts[0]?.category || displayCategory(params.category, params.lang);
  const currentTrack = getCategoryTrack(currentCategoryLabel);
  const bridgeTrack = currentTrack === "ai" ? "cs" : "ai";
  const bridgeCategories = getCategoriesByTrack(bridgeTrack).slice(0, 4);

  if (!posts.length) notFound();

  return (
    <section className="page-shell max-w-6xl py-10 md:py-16">
      <Breadcrumbs
        locale={locale}
        items={[
          { label: siteConfig.brandName, href: `/${locale}` },
          { label: dict.nav.blog, href: `/${locale}/blog` },
          { label: displayCategory(params.category, params.lang) }
        ]}
      />

      <div className="do-hero rounded-3xl p-7 md:p-10">
        <p className="do-kicker">{locale === "fr" ? "Catégorie" : "Category"}</p>
        <h1 className="font-display hero-title mt-3 font-bold capitalize text-[color:var(--text-strong)]">
          {displayCategory(params.category, params.lang)}
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-[color:var(--text)]">
          {locale === "fr"
            ? `${posts.length} articles pour vous aider à passer de la théorie à des résultats visibles.`
            : `${posts.length} posts focused on turning theory into visible execution outcomes.`}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/${locale}/blog`} className="btn-secondary">
            {locale === "fr" ? "Retour au blog" : "Back to blog"}
          </Link>
          <Link href={`/${locale}/resources`} className="btn-primary">
            {locale === "fr" ? "Outils recommandés" : "Recommended tools"}
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {posts.map((post, index) => (
          <article key={post.slug} className="blog-stream-card card-hover overflow-hidden rounded-2xl p-4 md:p-5">
            <div className="grid gap-4 md:grid-cols-[250px,1fr] md:items-start">
              <Link href={`/${locale}/blog/${post.slug}`} className="relative overflow-hidden rounded-xl border border-[color:var(--border)]">
                {/* The first card's cover is this page's LCP element on both
                    phone and desktop — there is no hero image above it, only
                    text. It was lazy-loaded, so the browser deliberately
                    deferred the one image the score is measured on and waited
                    for layout before even requesting it. Everything below it
                    stays lazy. */}
                <Image
                  src={coverImageUrl(post.slug, post.category, locale)}
                  alt={post.title}
                  width={1200}
                  height={675}
                  sizes="(max-width: 768px) 100vw, 250px"
                  {...(index === 0 ? { priority: true } : { loading: "lazy" as const })}
                  className="h-auto w-full transition duration-500 ease-out hover:scale-[1.02]"
                />
              </Link>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="blog-chip rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]">
                    {categoryName(post.category, locale)}
                  </span>
                  <span className="text-xs text-[color:var(--muted)]">{formatReadTime(post.readTime, locale)}</span>
                  <span className="text-xs text-[color:var(--muted)]">{formatPublishedDate(post.publishedAt, locale)}</span>
                </div>
                <h2 className="font-display section-title mt-3 font-semibold text-[color:var(--text-strong)]">
                  <Link href={`/${locale}/blog/${post.slug}`} className="hover:opacity-90">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-[color:var(--text)]">{post.excerpt}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/${locale}/blog/tag/${slugify(tag)}`}
                      className="blog-chip rounded-full px-2.5 py-1 text-xs text-[color:var(--text)]"
                    >
                      #{tagLabel(tag, locale)}
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/${locale}/blog/${post.slug}`}
                  aria-label={`${dict.blog.readPost}: ${post.title}`}
                  className="do-link mt-4 inline-block text-sm"
                >
                  {dict.blog.readPost}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {bridgeCategories.length ? (
        <section className="blog-aside-card mt-6 rounded-2xl p-5">
          <p className="do-kicker">{locale === "fr" ? "Pont éditorial" : "Editorial bridge"}</p>
          <h2 className="font-display mt-2 text-xl font-semibold text-[color:var(--text-strong)]">
            {bridgeTrack === "cs"
              ? locale === "fr"
                ? "Vers les catégories informatiques"
                : "Bridge into computer science categories"
              : locale === "fr"
                ? "Vers les catégories IA"
                : "Bridge into AI categories"}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {bridgeCategories.map((category) => (
              <Link
                key={category}
                href={`/${locale}/blog/category/${slugify(category)}`}
                className="blog-chip rounded-full px-2.5 py-1 text-xs text-[color:var(--text)]"
              >
                {categoryName(category, locale)}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
