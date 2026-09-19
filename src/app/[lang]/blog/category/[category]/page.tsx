import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getAllCategories, getCategoriesByTrack, getCategoryTrack, getPostsByCategory, slugify } from "@/content/posts";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords, coverImageUrl } from "@/lib/seo";
import { formatReadTime } from "@/lib/read-time";

export function generateStaticParams() {
  return locales.flatMap((lang) => getAllCategories().map((category) => ({ lang, category: slugify(category) })));
}

function displayCategory(slug: string) {
  return slug.replace(/-/g, " ");
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

  const dict = getDictionary(params.lang);
  const categoryName = displayCategory(params.category);

  return {
    title: `${dict.blog.title} - ${categoryName}`,
    description:
      params.lang === "fr"
        ? `Articles de la categorie ${categoryName} sur AI and Cybersecurity News.`
        : `${categoryName} category articles on AI and Cybersecurity News.`,
    keywords: getSeoKeywords(params.lang, "blog", [
      params.lang === "fr" ? `categorie ${categoryName} ia` : `${categoryName} ai category`,
      categoryName
    ]),
    alternates: localizedAlternates(`/blog/category/${params.category}`, params.lang)
  };
}

export default async function LocalizedCategoryPage(props: { params: Promise<{ lang: string; category: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const dict = getDictionary(locale);
  const posts = getPostsByCategory(params.category, locale);
  const currentCategoryLabel = posts[0]?.category || displayCategory(params.category);
  const currentTrack = getCategoryTrack(currentCategoryLabel);
  const bridgeTrack = currentTrack === "ai" ? "cs" : "ai";
  const bridgeCategories = getCategoriesByTrack(bridgeTrack).slice(0, 4);

  if (!posts.length) notFound();

  return (
    <section className="page-shell max-w-6xl py-10 md:py-16">
      <Breadcrumbs
        items={[
          { label: "AI and Cybersecurity News", href: `/${locale}` },
          { label: dict.nav.blog, href: `/${locale}/blog` },
          { label: displayCategory(params.category) }
        ]}
      />

      <div className="do-hero rounded-3xl p-7 md:p-10">
        <p className="do-kicker">{locale === "fr" ? "Categorie" : "Category"}</p>
        <h1 className="font-display hero-title mt-3 font-bold capitalize text-[color:var(--text-strong)]">
          {displayCategory(params.category)}
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-[color:var(--text)]">
          {locale === "fr"
            ? `${posts.length} articles pour t'aider a passer de la theorie a des resultats visibles.`
            : `${posts.length} posts focused on turning theory into visible execution outcomes.`}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/${locale}/blog`} className="btn-secondary">
            {locale === "fr" ? "Retour au blog" : "Back to blog"}
          </Link>
          <Link href={`/${locale}/resources`} className="btn-primary">
            {locale === "fr" ? "Outils recommandes" : "Recommended tools"}
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {posts.map((post) => (
          <article key={post.slug} className="blog-stream-card card-hover overflow-hidden rounded-2xl p-4 md:p-5">
            <div className="grid gap-4 md:grid-cols-[250px,1fr] md:items-start">
              <Link href={`/${locale}/blog/${post.slug}`} className="relative overflow-hidden rounded-xl border border-[color:var(--border)]">
                <Image
                  src={coverImageUrl(post.slug, post.category)}
                  alt={post.title}
                  width={1200}
                  height={675}
                  sizes="(max-width: 768px) 100vw, 250px"
                  loading="lazy"
                  className="h-auto w-full transition duration-500 ease-out hover:scale-[1.02]"
                />
              </Link>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="blog-chip rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]">
                    {post.category}
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
                      #{tag}
                    </Link>
                  ))}
                </div>
                <Link href={`/${locale}/blog/${post.slug}`} className="do-link mt-4 inline-block text-sm">
                  {dict.blog.readPost}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {bridgeCategories.length ? (
        <section className="blog-aside-card mt-6 rounded-2xl p-5">
          <p className="do-kicker">{locale === "fr" ? "Pont editorial" : "Editorial bridge"}</p>
          <h2 className="font-display mt-2 text-xl font-semibold text-[color:var(--text-strong)]">
            {bridgeTrack === "cs"
              ? locale === "fr"
                ? "Relier vers les categories informatique"
                : "Bridge into cybersecurity categories"
              : locale === "fr"
                ? "Relier vers les categories IA"
                : "Bridge into AI categories"}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {bridgeCategories.map((category) => (
              <Link
                key={category}
                href={`/${locale}/blog/category/${slugify(category)}`}
                className="blog-chip rounded-full px-2.5 py-1 text-xs text-[color:var(--text)]"
              >
                {category}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
