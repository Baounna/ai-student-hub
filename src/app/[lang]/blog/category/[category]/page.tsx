import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getAllCategories, getPostsByCategory, slugify } from "@/content/posts";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords } from "@/lib/seo";

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

export async function generateMetadata({
  params
}: {
  params: { lang: string; category: string };
}): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  const dict = getDictionary(params.lang);
  const categoryName = displayCategory(params.category);

  return {
    title: `${dict.blog.title} - ${categoryName}`,
    description:
      params.lang === "fr"
        ? `Articles de la categorie ${categoryName} sur AI Student Hub.`
        : `${categoryName} category articles on AI Student Hub.`,
    keywords: getSeoKeywords(params.lang, "blog", [
      params.lang === "fr" ? `categorie ${categoryName} ia` : `${categoryName} ai category`,
      categoryName
    ]),
    alternates: localizedAlternates(`/blog/category/${params.category}`, params.lang)
  };
}

export default function LocalizedCategoryPage({ params }: { params: { lang: string; category: string } }) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const dict = getDictionary(locale);
  const posts = getPostsByCategory(params.category, locale);

  if (!posts.length) notFound();

  return (
    <section className="page-shell max-w-6xl py-10 md:py-16">
      <Breadcrumbs
        items={[
          { label: "AI Student Hub", href: `/${locale}` },
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
          <article key={post.slug} className="card-hover glass overflow-hidden rounded-2xl p-4 md:p-5">
            <div className="grid gap-4 md:grid-cols-[250px,1fr] md:items-start">
              <Link href={`/${locale}/blog/${post.slug}`} className="relative overflow-hidden rounded-xl border border-[color:var(--border)]">
                <Image
                  src={post.coverImage}
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
                  <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]">
                    {post.category}
                  </span>
                  <span className="text-xs text-[color:var(--muted)]">{post.readTime}</span>
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
                      className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs text-[color:var(--text)]"
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
    </section>
  );
}
