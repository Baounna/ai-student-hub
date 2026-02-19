import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { getAllCategories, getAllTags, getLocalizedPosts, slugify } from "@/content/posts";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { alternateLanguages } from "@/i18n/helpers";

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
    title: dict.blog.title,
    description: dict.blog.subtitle,
    openGraph: {
      title: dict.blog.title,
      description: dict.blog.subtitle,
      url: `/${params.lang}/blog`,
      type: "website",
      images: [{ url: "/images/post-roadmap.svg", width: 1200, height: 675, alt: dict.blog.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: dict.blog.title,
      description: dict.blog.subtitle,
      images: ["/images/post-roadmap.svg"]
    },
    alternates: {
      languages: alternateLanguages("/blog")
    }
  };
}

type BlogSearchParams = {
  query?: string | string[];
};

export default function LocalizedBlogPage({
  params,
  searchParams
}: {
  params: { lang: string };
  searchParams?: BlogSearchParams;
}) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const dict = getDictionary(locale);
  const queryValue = searchParams?.query;
  const query = typeof queryValue === "string" ? queryValue.trim().toLowerCase() : "";
  const allPosts = getLocalizedPosts(locale);
  const posts = query
    ? allPosts.filter((post) =>
        [post.title, post.excerpt, post.category, ...post.tags].join(" ").toLowerCase().includes(query)
      )
    : allPosts;
  const featuredPost = posts[0];
  const streamPosts = posts.slice(1);
  const topPosts = [...allPosts].sort((a, b) => b.popularScore - a.popularScore).slice(0, 3);
  const categories = getAllCategories();
  const tags = getAllTags().slice(0, 14);
  const streamHeading = locale === "fr" ? "Articles recents" : "Latest articles";
  const weekSnapshotTitle = locale === "fr" ? "Cette semaine sur AI Student Hub" : "This week on AI Student Hub";
  const searchPlaceholder = locale === "fr" ? "Rechercher par mot-cle..." : "Search by keyword...";

  return (
    <section className="page-shell max-w-6xl py-10 md:py-16">
      <div className="do-hero overflow-hidden rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{dict.blog.latest}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">{dict.blog.title}</h1>
            <p className="body-copy mt-4 max-w-2xl text-[color:var(--text)]">{dict.blog.subtitle}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/${locale}/resources`} className="btn-primary">
                {locale === "fr" ? "Voir les ressources" : "Open resources"}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-secondary">
                {locale === "fr" ? "Comparer les outils" : "Compare tools"}
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {allPosts.length}+ {locale === "fr" ? "guides publies" : "published guides"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {locale === "fr" ? "Mise a jour hebdomadaire" : "Weekly updates"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {locale === "fr" ? "Pratique + actionnable" : "Practical and actionable"}
              </span>
            </div>
          </div>

          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{weekSnapshotTitle}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>{locale === "fr" ? "1. Nouveaux articles orientés execution." : "1. New execution-first articles."}</li>
              <li>{locale === "fr" ? "2. Comparatifs d'outils avec angle budget etudiant." : "2. Tool comparisons with student-budget angle."}</li>
              <li>{locale === "fr" ? "3. Callouts ressources dans les guides longue forme." : "3. Resource callouts embedded in long-form guides."}</li>
            </ul>
            <form action={`/${locale}/blog`} method="get" className="mt-4 flex items-center gap-2">
              <label htmlFor={`blog-search-${locale}`} className="sr-only">
                {locale === "fr" ? "Recherche blog" : "Blog search"}
              </label>
              <input
                id={`blog-search-${locale}`}
                name="query"
                defaultValue={query}
                placeholder={searchPlaceholder}
                className="h-10 min-w-0 flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)] focus:border-[color:var(--primary)]/45"
              />
              <button type="submit" className="btn-secondary h-10 shrink-0 px-4 py-0">
                {locale === "fr" ? "Chercher" : "Search"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {featuredPost && (
        <article className="card-hover glass mt-8 overflow-hidden rounded-3xl p-6 md:p-8">
          <p className="do-kicker">{locale === "fr" ? "Article principal" : "Featured article"}</p>
          <div className="mt-4 grid gap-6 md:grid-cols-[1.2fr,1fr] md:items-center">
            <div>
              <h2 className="font-display section-title font-bold text-[color:var(--text-strong)]">
                {featuredPost.title}
              </h2>
              <p className="card-copy mt-4 text-[color:var(--text)]">{featuredPost.excerpt}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href={`/${locale}/blog/category/${slugify(featuredPost.category)}`}
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]"
                >
                  {featuredPost.category}
                </Link>
                <span className="text-xs text-[color:var(--muted)]">{featuredPost.readTime}</span>
                <span className="text-xs text-[color:var(--muted)]">
                  {formatPublishedDate(featuredPost.publishedAt, locale)}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/${locale}/blog/${featuredPost.slug}`} className="btn-primary inline-block">
                  {locale === "fr" ? "Lire l'article principal" : "Read featured post"}
                </Link>
                <Link href={`/${locale}/blog/tag/${slugify(featuredPost.tags[0])}`} className="btn-secondary inline-block">
                  #{featuredPost.tags[0]}
                </Link>
              </div>
            </div>
            <div className="media-frame group relative aspect-[16/10] rounded-2xl">
              <Image
                src={featuredPost.coverImage}
                alt={featuredPost.title}
                width={1200}
                height={675}
                sizes="(max-width: 768px) 100vw, 40vw"
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
            </div>
          </div>
        </article>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">{streamHeading}</h2>

          {query && (
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--text)]">
              {locale === "fr" ? "Resultats pour: " : "Results for: "}
              <strong className="text-[color:var(--text-strong)]">{query}</strong>
              <Link href={`/${locale}/blog`} className="do-link ml-2 text-sm">
                {locale === "fr" ? "Effacer" : "Clear"}
              </Link>
            </div>
          )}

          {posts.length === 0 && (
            <article className="glass rounded-2xl p-6">
              <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">
                {locale === "fr" ? "Aucun article trouve" : "No posts found"}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--text)]">
                {locale === "fr"
                  ? "Essaie un autre mot-cle, ou explore les categories."
                  : "Try another keyword, or explore categories below."}
              </p>
            </article>
          )}

          {streamPosts.map((post) => (
            <article key={post.slug} className="card-hover group glass overflow-hidden rounded-2xl p-4 md:p-5">
              <div className="grid gap-4 md:grid-cols-[260px,1fr] md:items-start">
                <Link href={`/${locale}/blog/${post.slug}`} className="media-frame group relative aspect-[16/10] rounded-xl">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    width={1200}
                    height={675}
                    sizes="(max-width: 768px) 100vw, 260px"
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/25 to-transparent" />
                </Link>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/${locale}/blog/category/${slugify(post.category)}`}
                      className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]"
                    >
                      {post.category}
                    </Link>
                    <p className="text-xs text-[color:var(--muted)]">{post.readTime}</p>
                    <p className="text-xs text-[color:var(--muted)]">{formatPublishedDate(post.publishedAt, locale)}</p>
                  </div>
                  <h3 className="font-display section-title mt-3 font-semibold text-[color:var(--text-strong)]">
                    <Link href={`/${locale}/blog/${post.slug}`} className="hover:opacity-90">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="card-copy mt-3 text-[color:var(--text)]">{post.excerpt}</p>
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
                  <div className="mt-4">
                    <Link
                      href={`/${locale}/blog/${post.slug}`}
                      className="inline-flex items-center text-sm font-semibold text-[color:var(--primary)] hover:opacity-80"
                    >
                      {dict.blog.readPost}
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {!streamPosts.length && featuredPost ? (
            <article className="surface rounded-2xl p-5 text-sm text-[color:var(--text)]">
              {locale === "fr"
                ? "Tu as atteint la fin du flux actuel. Reviens bientot pour les prochains guides."
                : "You reached the end of the current stream. Check back soon for new guides."}
            </article>
          ) : null}
        </div>

        <aside className="space-y-4 md:sticky md:top-36 md:h-fit">
          <EditorialTrust locale={locale} />

          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Les plus lus" : "Most popular"}
            </h3>
            <div className="mt-3 space-y-3">
              {topPosts.map((post, index) => (
                <article key={post.slug} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--muted)]">
                    #{index + 1}
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-[color:var(--text-strong)]">
                    <Link href={`/${locale}/blog/${post.slug}`} className="hover:opacity-85">
                      {post.title}
                    </Link>
                  </h4>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">{post.readTime}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">Categories</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/${locale}/blog/category/${slugify(category)}`}
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs text-[color:var(--text)]"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">Tags</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
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

          <Newsletter compact locale={locale} source="blog_index_aside" />

          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Parcours rapide" : "Quick pathway"}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {locale === "fr"
                ? "Nouveau ici ? Commence par les actualites, puis resources et comparatifs."
                : "New here? Start with news, then resources and comparison guides."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/news`} className="btn-secondary">
                {locale === "fr" ? "Actualites" : "News"}
              </Link>
              <Link href={`/${locale}/resources`} className="btn-secondary">
                {locale === "fr" ? "Ressources" : "Resources"}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-primary">
                {locale === "fr" ? "Comparatifs" : "Compare"}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
