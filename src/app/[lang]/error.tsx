"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { localeFromPathname, type Locale } from "@/i18n/config";
import { sectionRecoveryLink } from "@/lib/recovery-link";

/**
 * Strings live here rather than in the shared dictionary on purpose.
 *
 * getDictionary() is importable from a Client Component, but pulling it in
 * would ship both complete locale dictionaries — nav, footer, home, blog,
 * news, newsletter — into the bundle for a component that renders four lines
 * of text and only when something has already gone wrong. Every other client
 * component that needs copy does it this way (share-article.tsx), and every
 * page with copy outside the dictionary does too (stages/page.tsx).
 */
const COPY: Record<
  Locale,
  { kicker: string; title: string; body: string; retry: string; home: string; reference: string }
> = {
  en: {
    kicker: "Page Error",
    title: "Something went wrong",
    body: "This page could not be loaded. The rest of the site is unaffected — retry, or carry on from one of the links below.",
    retry: "Try again",
    home: "Go home",
    reference: "Error reference"
  },
  fr: {
    kicker: "Erreur de page",
    title: "Une erreur est survenue",
    body: "Cette page n'a pas pu être chargée. Le reste du site fonctionne normalement — réessayez, ou continuez avec l'un des liens ci-dessous.",
    retry: "Réessayer",
    home: "Aller à l'accueil",
    reference: "Référence de l'erreur"
  }
};

/**
 * Without this file every failure below /[lang] escalated to the root
 * boundary, which sits outside [lang]/layout.tsx. The reader lost the header,
 * the navigation, the language switcher and the footer along with the page
 * that actually broke, and the only way back into the site was the browser's
 * back button. Here the layout survives and only <main> is replaced.
 */
export default function LocalizedError({
  error,
  retry
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const copy = COPY[locale];
  const section = sectionRecoveryLink(pathname, locale);

  // A boundary is where an error stops existing. Next logs server-side render
  // failures itself, but an error thrown during a client render never reaches
  // the server at all, so without this it leaves no trace anywhere and a
  // reader saying "it just broke" gives us nothing to look at. The root
  // boundary logs the same way, deliberately — one reporting behaviour, not
  // two.
  useEffect(() => {
    console.error(error);
  }, [error]);

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
          {/* retry(), not reset(). Next 16.3 made retry the stable prop and
              docs/01-app/03-api-reference/03-file-conventions/error.md is
              explicit about the difference: reset() only clears the boundary's
              error state and re-renders the same children, while retry()
              re-fetches them first. Almost everything that breaks here breaks
              in data — a feed that timed out, a slug that momentarily could not
              be read — so a re-render without a re-fetch throws again
              immediately and the button looks broken. */}
          <button type="button" onClick={() => retry()} className="btn-primary">
            {copy.retry}
          </button>
          {section ? (
            <Link href={section.href} className="btn-secondary">
              {section.label}
            </Link>
          ) : null}
          <Link href={`/${locale}`} className="btn-secondary">
            {copy.home}
          </Link>
        </div>
        {/* The digest is the only handle a reader has on their own incident —
            it is what ties "it broke for me at 14:02" to a specific server log
            line. Next only sets it for server-side failures, hence the guard. */}
        {error.digest ? (
          <p className="mt-6 text-xs text-[color:var(--muted)]">
            {copy.reference}: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
