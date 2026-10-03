import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { localeFromPathname, type Locale } from "@/i18n/config";

/**
 * The root 404, and the one a mistyped URL actually reaches.
 *
 * [lang]/not-found.tsx handles notFound() thrown by a route that matched -- a
 * bad article slug, say. A path that matches no route at all never gets as far
 * as that boundary: routing fails first, so /fr/totally-not-a-route rendered
 * THIS file, in English, offering "Go home" to /en. Verified on a production
 * server before this change. A French reader who mistyped a URL was shown a
 * page in a language they may not read and two links out of their own edition
 * of the site.
 *
 * Middleware already puts the request path on x-pathname for the language
 * switcher, so the locale is readable here without a client component.
 */
const COPY: Record<Locale, { title: string; body: string; home: string; blog: string }> = {
  en: {
    title: "Page not found",
    body: "The page you asked for does not exist or has moved. The links below lead back into the site.",
    home: "Go home",
    blog: "Browse blog"
  },
  fr: {
    title: "Page introuvable",
    body: "La page demandée n'existe pas ou a été déplacée. Les liens ci-dessous vous ramènent dans le site.",
    home: "Aller à l'accueil",
    blog: "Parcourir le blog"
  }
};

/**
 * The tab title too, not just the body.
 *
 * The body of this page reads the locale from x-pathname and answers in the
 * reader's language, but the document title and description were inherited from
 * the root layout's English metadata, so a French reader's browser tab read "AI
 * + Cybersecurity Signals for Real Builders" over a page saying "Page
 * introuvable".
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = localeFromPathname((await headers()).get("x-pathname"));

  return {
    title: COPY[locale].title,
    description: COPY[locale].body,
    // A 404 is not a page to index, whichever language it answers in.
    robots: { index: false, follow: true }
  };
}

export default async function NotFound() {
  const locale = localeFromPathname((await headers()).get("x-pathname"));
  const copy = COPY[locale];

  return (
    // The skip link in the root layout points at #main-content, and this
    // boundary renders inside that layout. Without the id the link led nowhere:
    // pressing Enter on "Skip to content" did nothing at all, on the one page a
    // lost reader is most likely to be keyboarding around.
    <main
      id="main-content"
      tabIndex={-1}
      className="anchor-offset mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center"
    >
      <p className="do-kicker">404</p>
      <h1 className="font-display mt-3 text-4xl font-bold text-[color:var(--text-strong)] md:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-xl text-[color:var(--text)]">{copy.body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={`/${locale}`} className="btn-primary">
          {copy.home}
        </Link>
        <Link href={`/${locale}/blog`} className="btn-secondary">
          {copy.blog}
        </Link>
      </div>
    </main>
  );
}
