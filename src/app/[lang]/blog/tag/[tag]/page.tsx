import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getAllTags, getPostsByTag, slugify } from "@/content/posts";
import { getAllNewsTags, getNewsByTag } from "@/content/news";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords, coverImageUrl, ogImageUrl } from "@/lib/seo";
import { formatReadTime } from "@/lib/read-time";

export function generateStaticParams() {
  // Both sources: a tag that exists only on a news brief still needs a page,
  // because the brief links to one.
  const tags = Array.from(new Set([...getAllTags(), ...getAllNewsTags()].map((tag) => slugify(tag))));
  return locales.flatMap((lang) => tags.map((tag) => ({ lang, tag })));
}

function displayTag(slug: string) {
  return slug.replace(/-/g, " ");
}

function formatPublishedDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(date));
}

export async function generateMetadata(props: { params: Promise<{ lang: string; tag: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const tagName = displayTag(params.tag);

  const tagTitle = params.lang === "fr" ? `Articles #${tagName}` : `#${tagName} articles`;
  const tagDescription =
    params.lang === "fr"
      ? `Articles avec le tag #${tagName} sur AI and Cybersecurity News.`
      : `Articles tagged #${tagName} on AI and Cybersecurity News.`;

  return {
    title: tagTitle,
    description: tagDescription,
    keywords: getSeoKeywords(params.lang, "blog", [
      params.lang === "fr" ? `tag ${tagName} ia` : `${tagName} ai tag`,
      tagName
    ]),
    // Tag, category and donate pages were the only routes with no
    // og:image, so every share of one rendered as a bare link. The same
    // generated card every other page already uses.
    openGraph: {
      title: tagTitle,
      description: tagDescription,
      url: `/${params.lang}/blog/tag/${params.tag}`,
      type: "website",
      images: [{ url: ogImageUrl(tagTitle), width: 1200, height: 630, alt: tagTitle }]
    },
    twitter: {
      card: "summary_large_image",
      title: tagTitle,
      description: tagDescription,
      images: [ogImageUrl(tagTitle)]
    },
    alternates: localizedAlternates(`/blog/tag/${params.tag}`, params.lang)
  };
}

export default async function LocalizedTagPage(props: { params: Promise<{ lang: string; tag: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const dict = getDictionary(locale);
  const posts = getPostsByTag(params.tag, locale);
  const briefs = getNewsByTag(params.tag, locale);

  // Only a tag carried by nothing at all is a 404 now.
  if (!posts.length && !briefs.length) notFound();

  return (
    <section className="page-shell max-w-6xl py-10 md:py-16">
      <Breadcrumbs
        locale={locale}
        items={[
          { label: "AI and Cybersecurity News", href: `/${locale}` },
          { label: dict.nav.blog, href: `/${locale}/blog` },
          { label: `#${displayTag(params.tag)}` }
        ]}
      />

      <div className="do-hero rounded-3xl p-7 md:p-10">
        <p className="do-kicker">{locale === "fr" ? "Tag" : "Tag"}</p>
        <h1 className="font-display hero-title mt-3 font-bold capitalize text-[color:var(--text-strong)]">
          #{displayTag(params.tag)}
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-[color:var(--text)]">
          {locale === "fr"
            ? `${posts.length + briefs.length} publications reliées à ce sujet.`
            : `${posts.length + briefs.length} pieces connected to this topic.`}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/${locale}/blog`} className="btn-secondary">
            {locale === "fr" ? "Retour au blog" : "Back to blog"}
          </Link>
          <Link href={`/${locale}/compare`} className="btn-primary">
            {locale === "fr" ? "Voir comparatifs" : "Open comparisons"}
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {posts.map((post, index) => (
          <article key={post.slug} className="blog-stream-card card-hover overflow-hidden rounded-2xl p-4 md:p-5">
            <div className="grid gap-4 md:grid-cols-[250px,1fr] md:items-start">
              <Link href={`/${locale}/blog/${post.slug}`} className="relative overflow-hidden rounded-xl border border-[color:var(--border)]">
                {/* Same as the category page: the first cover is the LCP
                    element here, and lazy-loading it deferred the one image
                    the page is judged on. The rest stay lazy. */}
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

      {briefs.length ? (
        <section className="mt-8">
          <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
            {locale === "fr" ? "Actualités sur ce sujet" : "News on this topic"}
          </h2>
          <ul className="mt-4 divide-y divide-[color:var(--border)] rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
            {briefs.map((brief) => (
              <li key={brief.slug} className="px-4 py-3">
                <Link href={`/${locale}/news/${brief.slug}`} className="do-link text-sm font-semibold">
                  {brief.title}
                </Link>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{brief.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
