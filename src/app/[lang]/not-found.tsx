import Link from "next/link";
import { headers } from "next/headers";
import { localeFromPathname, type Locale } from "@/i18n/config";
import { sectionRecoveryLink } from "@/lib/recovery-link";

const COPY: Record<Locale, { kicker: string; title: string; body: string; home: string; blog: string }> = {
  en: {
    kicker: "404",
    title: "Page not found",
    body: "The page you asked for does not exist or has moved. The links below lead back into the site.",
    home: "Go home",
    blog: "Browse blog"
  },
  fr: {
    kicker: "404",
    title: "Page introuvable",
    body: "La page demandée n'existe pas ou a été déplacée. Les liens ci-dessous vous ramènent dans le site.",
    home: "Aller à l'accueil",
    blog: "Parcourir le blog"
  }
};

/**
 * Six pages call notFound() under /[lang] — blog posts, categories, tags, news
 * briefs, auto briefs, comparisons — and every one of them landed on the root
 * 404, which renders outside [lang]/layout.tsx. Verified before adding this:
 * /fr/blog/<nonsense> returned the root boundary, in English, offering /en and
 * /en/blog. So a French reader who mistyped an article slug lost the shell and
 * the language in the same step, and the two links on offer walked them out of
 * their own edition of the site.
 *
 * notFound() thrown by [lang]/layout.tsx itself — an unknown locale such as
 * /zz/blog — still escalates past this boundary to the root one, which is
 * right: there is no valid locale shell to render it in.
 */
export default async function LocalizedNotFound() {
  // A Server Component, so there is no usePathname(). Middleware already puts
  // the request path on x-pathname for the layout's language switcher; this
  // reads the same header.
  const pathname = (await headers()).get("x-pathname");
  const locale = localeFromPathname(pathname);
  const copy = COPY[locale];
  const section = sectionRecoveryLink(pathname, locale);

  return (
    // A <div>, not a <main>: [lang]/layout.tsx already wraps its children in
    // one, and this renders inside it.
    <div className="page-shell py-16 text-center md:py-24">
      <div className="mx-auto max-w-2xl">
        <p className="do-kicker">{copy.kicker}</p>
        <h1 className="font-display mt-3 text-4xl font-bold text-[color:var(--text-strong)] md:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-3 text-[color:var(--text)]">{copy.body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {/* A missing article is nearly always a bad slug rather than a bad
              section, so the index the reader was already browsing is the
              likeliest thing they wanted. It takes the primary slot when there
              is one. */}
          {section ? (
            <Link href={section.href} className="btn-primary">
              {section.label}
            </Link>
          ) : null}
          <Link href={`/${locale}`} className={section ? "btn-secondary" : "btn-primary"}>
            {copy.home}
          </Link>
          {section?.href === `/${locale}/blog` ? null : (
            <Link href={`/${locale}/blog`} className="btn-secondary">
              {copy.blog}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
