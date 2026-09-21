import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import {
  type EditorialTrack,
  getAllCategories,
  getAllTags,
  getLocalizedPosts,
  getPostTrack,
  getTrackCounts,
  slugify
} from "@/content/posts";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords, ogImageUrl, coverImageUrl } from "@/lib/seo";
import { sanitizeSearchQuery } from "@/lib/input";
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
    // seoTitle for the search result; dict.blog.title stays the H1.
    title: dict.blog.seoTitle,
    description: dict.blog.subtitle,
    keywords: getSeoKeywords(params.lang, "blog", [
      params.lang === "fr" ? "outils ia et informatique etudiant" : "best ai and cs tools for students",
      params.lang === "fr" ? "guide execution portfolio etudiant" : "student portfolio execution guide",
      params.lang === "fr" ? "stages ia et informatique" : "ai and cs internships for students"
    ]),
    openGraph: {
      title: dict.blog.title,
      description: dict.blog.subtitle,
      url: `/${params.lang}/blog`,
      type: "website",
      images: [{ url: ogImageUrl(dict.blog.title), width: 1200, height: 630, alt: dict.blog.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: dict.blog.title,
      description: dict.blog.subtitle,
      images: [ogImageUrl(dict.blog.title)]
    },
    alternates: localizedAlternates("/blog", params.lang)
  };
}

type BlogSearchParams = {
  query?: string | string[];
  q?: string | string[];
  track?: string | string[];
};

export default async function LocalizedBlogPage(
  props: {
    params: Promise<{ lang: string }>;
    searchParams?: Promise<BlogSearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const dict = getDictionary(locale);
  const queryValue = searchParams?.query;
  const qValue = searchParams?.q;
  const queryRaw = sanitizeSearchQuery(typeof queryValue === "string" ? queryValue : typeof qValue === "string" ? qValue : "");
  const query = queryRaw.toLowerCase();
  const trackValue = searchParams?.track;
  const parsedTrack = typeof trackValue === "string" ? trackValue.trim().toLowerCase() : "";
  const trackFilter: EditorialTrack | "all" =
    parsedTrack === "ai" || parsedTrack === "cs" || parsedTrack === "career" ? parsedTrack : "all";
  const allPosts = getLocalizedPosts(locale);
  const trackScopedPosts = trackFilter === "all" ? allPosts : allPosts.filter((post) => getPostTrack(post) === trackFilter);
  const posts = query
    ? trackScopedPosts.filter((post) =>
        [post.title, post.excerpt, post.category, ...post.tags].join(" ").toLowerCase().includes(query)
      )
    : trackScopedPosts;
  const featuredPost = posts[0];
  const streamPosts = posts.slice(1);
  const topPosts = [...allPosts].sort((a, b) => b.popularScore - a.popularScore).slice(0, 3);
  const trackCounts = getTrackCounts(locale);
  const categories = getAllCategories();
  const tags = getAllTags().slice(0, 14);
  const highlightCategories = categories.slice(0, 5);
  const totalReadMinutes = allPosts.reduce((sum, post) => sum + (Number.parseInt(post.readTime, 10) || 0), 0);
  const averageReadMinutes = allPosts.length ? Math.max(1, Math.round(totalReadMinutes / allPosts.length)) : 0;
  const totalReferences = allPosts.reduce((sum, post) => sum + post.references.length, 0);
  const sourceLabel = locale === "fr" ? "sources citées" : "cited sources";
  const streamHeading =
    trackFilter === "ai"
      ? locale === "fr"
        ? "Articles IA"
        : "AI articles"
      : trackFilter === "cs"
        ? locale === "fr"
          ? "Articles informatique"
          : "Computer science articles"
        : trackFilter === "career"
          ? locale === "fr"
            ? "Articles carrière"
            : "Career articles"
          : locale === "fr"
            ? "Articles récents IA + cybersécurité"
            : "Latest AI + Cybersecurity articles";
  const weekSnapshotTitle = locale === "fr" ? "Cette semaine sur AI and Cybersecurity News" : "This week on AI and Cybersecurity News";
  const searchPlaceholder = locale === "fr" ? "Rechercher par mot-clé..." : "Search by keyword...";
  const trackFilterOptions: Array<{ key: EditorialTrack | "all"; label: string; count: number }> = [
    {
      key: "all",
      label: locale === "fr" ? "Tout IA + CS" : "All AI + Cybersecurity",
      count: allPosts.length
    },
    {
      key: "ai",
      label: "AI",
      count: trackCounts.ai
    },
    {
      key: "cs",
      label: locale === "fr" ? "Informatique" : "Computer Science",
      count: trackCounts.cs
    },
    {
      key: "career",
      label: locale === "fr" ? "Carrière" : "Career",
      count: trackCounts.career
    }
  ];

  const buildTrackHref = (key: EditorialTrack | "all") => {
    const params = new URLSearchParams();
    if (queryRaw) params.set("query", queryRaw);
    if (key !== "all") params.set("track", key);
    const suffix = params.toString();
    return suffix ? `/${locale}/blog?${suffix}` : `/${locale}/blog`;
  };
  const clearQueryHref = trackFilter === "all" ? `/${locale}/blog` : `/${locale}/blog?track=${trackFilter}`;

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
                {locale === "fr" ? "Ouvrir le lab outils" : "Open tools lab"}
              </Link>
              <Link href={`/${locale}/product/ai-career-guide`} className="btn-secondary">
                {locale === "fr" ? "Guide carrière" : "Career guide"}
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {allPosts.length}+ {locale === "fr" ? "guides publiés" : "published guides"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {locale === "fr" ? "Mise à jour hebdomadaire" : "Weekly updates"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {locale === "fr" ? "Pratique + actionnable" : "Practical and actionable"}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <article className="blog-signal-card rounded-xl p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {locale === "fr" ? "Confort lecture" : "Read comfort"}
                </p>
                <p className="blog-signal-value mt-1 text-[color:var(--text-strong)]">
                  ~{averageReadMinutes} min
                </p>
              </article>
              <article className="blog-signal-card rounded-xl p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {locale === "fr" ? "Fiabilité" : "Evidence"}
                </p>
                <p className="blog-signal-value mt-1 text-[color:var(--text-strong)]">
                  {totalReferences}+ {sourceLabel}
                </p>
              </article>
              <article className="blog-signal-card rounded-xl p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {locale === "fr" ? "Intentions" : "User intent"}
                </p>
                <p className="blog-signal-value mt-1 text-[color:var(--text-strong)]">
                  {locale === "fr" ? "News, outils, comparatifs" : "News, tools, comparisons"}
                </p>
              </article>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--primary)]">
                {locale === "fr" ? "Split IA + cybersécurité" : "AI + Cybersecurity split"}
              </p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                AI: {trackCounts.ai} • {locale === "fr" ? "Informatique" : "Computer Science"}: {trackCounts.cs} •{" "}
                {locale === "fr" ? "Carrière" : "Career"}: {trackCounts.career}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {trackFilterOptions.map((option) => {
                  const isActive = option.key === trackFilter;
                  return (
                    <Link
                      key={option.key}
                      href={buildTrackHref(option.key)}
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        isActive
                          ? "blog-chip border-[color:var(--primary)] bg-[color:var(--bg-soft)]/60 text-[color:var(--text-strong)]"
                          : "blog-chip text-[color:var(--text)]"
                      }`}
                    >
                      {option.label} ({option.count})
                    </Link>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {highlightCategories.map((category) => (
                  <Link
                    key={category}
                    href={`/${locale}/blog/category/${slugify(category)}`}
                    className="blog-chip rounded-full px-2.5 py-1 text-xs text-[color:var(--text)] hover:border-[color:var(--primary)]/35"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{weekSnapshotTitle}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>
                {locale === "fr"
                  ? "1. Flux séparés IA et informatique pour lecture plus rapide."
                  : "1. Split AI and CS streams for faster navigation."}
              </li>
              <li>
                {locale === "fr"
                  ? "2. Comparatifs outils avec angle budget-friendly."
                  : "2. Tool comparisons with a budget-friendly positioning."}
              </li>
              <li>
                {locale === "fr"
                  ? "3. Callouts ressources et CTA produits dans les guides longue forme."
                  : "3. Resource and product CTA callouts inside long-form guides."}
              </li>
            </ul>
            <form action={`/${locale}/blog`} method="get" className="mt-4 flex items-center gap-2">
              <label htmlFor={`blog-search-${locale}`} className="sr-only">
                {locale === "fr" ? "Recherche blog" : "Blog search"}
              </label>
              <input
                id={`blog-search-${locale}`}
                name="query"
                defaultValue={queryRaw}
                placeholder={searchPlaceholder}
                maxLength={120}
                className="field-input h-10 min-w-0 flex-1 px-3"
              />
              {trackFilter !== "all" ? <input type="hidden" name="track" value={trackFilter} /> : null}
              <button type="submit" className="btn-secondary h-10 shrink-0 px-4 py-0">
                {locale === "fr" ? "Chercher" : "Search"}
              </button>
              {queryRaw ? (
                <Link href={clearQueryHref} className="btn-secondary h-10 shrink-0 px-3 py-0 text-xs">
                  {locale === "fr" ? "Effacer" : "Clear"}
                </Link>
              ) : null}
            </form>
          </div>
        </div>
      </div>

      {featuredPost && (
        <article className="blog-stream-card card-hover mt-8 overflow-hidden rounded-3xl p-6 md:p-8">
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
                  className="blog-chip rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]"
                >
                  {featuredPost.category}
                </Link>
                <span className="text-xs text-[color:var(--muted)]">{formatReadTime(featuredPost.readTime, locale)}</span>
                <span className="text-xs text-[color:var(--muted)]">
                  {formatPublishedDate(featuredPost.publishedAt, locale)}
                </span>
                <span className="blog-chip rounded-full px-2 py-0.5 text-[11px] text-[color:var(--muted)]">
                  {featuredPost.references.length} {locale === "fr" ? "sources" : "sources"}
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
                src={coverImageUrl(featuredPost.slug, featuredPost.category)}
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
        <div className="space-y-5">
          <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">{streamHeading}</h2>

          {queryRaw && (
            <div className="blog-aside-card rounded-xl p-4 text-sm text-[color:var(--text)]">
              {locale === "fr" ? "Résultats pour: " : "Results for: "}
              <strong className="text-[color:var(--text-strong)]">{queryRaw}</strong>
              <Link href={`/${locale}/blog`} className="do-link ml-2 text-sm">
                {locale === "fr" ? "Effacer" : "Clear"}
              </Link>
            </div>
          )}

          {posts.length === 0 && (
            <article className="blog-aside-card rounded-2xl p-6">
              <h2 className="font-display text-2xl font-semibold text-[color:var(--text-strong)]">
                {locale === "fr" ? "Aucun article trouvé" : "No posts found"}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--text)]">
                {locale === "fr"
                  ? "Essayez un autre mot-clé, ou explorez les catégories."
                  : "Try another keyword, or explore categories below."}
              </p>
            </article>
          )}

          {streamPosts.map((post) => (
            <article key={post.slug} className="blog-stream-card card-hover group overflow-hidden rounded-2xl p-4 md:p-5">
              <div className="grid gap-4 md:grid-cols-[260px,1fr] md:items-start">
                <Link href={`/${locale}/blog/${post.slug}`} className="media-frame group relative aspect-[16/10] rounded-xl">
                  <Image
                    src={coverImageUrl(post.slug, post.category)}
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
                      className="blog-chip rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--primary)]"
                    >
                      {post.category}
                    </Link>
                    <p className="text-xs text-[color:var(--muted)]">{formatReadTime(post.readTime, locale)}</p>
                    <p className="text-xs text-[color:var(--muted)]">{formatPublishedDate(post.publishedAt, locale)}</p>
                    <span className="blog-chip rounded-full px-2 py-0.5 text-[11px] text-[color:var(--muted)]">
                      {post.references.length} {locale === "fr" ? "sources" : "sources"}
                    </span>
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
                        className="blog-chip rounded-full px-2.5 py-1 text-xs text-[color:var(--text)]"
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
            <article className="blog-aside-card rounded-2xl p-5 text-sm text-[color:var(--text)]">
              {locale === "fr"
                ? "Vous avez atteint la fin du flux actuel. Revenez bientôt pour les prochains guides."
                : "You reached the end of the current stream. Check back soon for new guides."}
            </article>
          ) : null}
        </div>

        <aside className="space-y-4 md:sticky md:top-36 md:h-fit">
          <EditorialTrust locale={locale} />

          <div className="blog-aside-card rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Les plus lus" : "Most popular"}
            </h3>
            <div className="mt-3 space-y-3">
              {topPosts.map((post, index) => (
                <article key={post.slug} className="blog-chip rounded-xl p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--muted)]">
                    #{index + 1}
                  </p>
                  <h4 className="mt-1 text-sm font-semibold text-[color:var(--text-strong)]">
                    <Link href={`/${locale}/blog/${post.slug}`} className="hover:opacity-85">
                      {post.title}
                    </Link>
                  </h4>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">{formatReadTime(post.readTime, locale)}</p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    {post.references.length} {locale === "fr" ? "sources citées" : "cited sources"}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="blog-aside-card rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">Categories</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/${locale}/blog/category/${slugify(category)}`}
                  className="blog-chip rounded-full px-2.5 py-1 text-xs text-[color:var(--text)]"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>

          <div className="blog-aside-card rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">Tags</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
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

          <Newsletter compact locale={locale} source="blog_index_aside" />

          <div className="blog-aside-card rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {locale === "fr" ? "Parcours rapide" : "Quick pathway"}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {locale === "fr"
                ? "Nouveau ici ? Commencez par les actualités, puis resources et comparatifs."
                : "New here? Start with news, then resources and comparison guides."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/news`} className="btn-secondary">
                {locale === "fr" ? "Actualités" : "News"}
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
