import { NextResponse } from "next/server";
import { isLocale, locales } from "@/i18n/config";
import { buildSuggestIndex } from "@/lib/suggest-index";

/**
 * The typeahead index, fetched once when a reader first focuses the search box.
 *
 * Not bundled into the header: it is a few tens of kilobytes that most visits
 * never need, and paying for it in the initial JS of every page to serve the
 * minority who search is the wrong trade. Not a request per keystroke either --
 * that would be a round trip between letters, and the whole point of a
 * typeahead is that it keeps up with typing.
 *
 * Prerendered per locale, so serving it costs nothing at request time.
 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return NextResponse.json([], { status: 404 });
  return NextResponse.json(buildSuggestIndex(locale), {
    headers: {
      // Content changes only on deploy, and the URL is stable, so revalidate
      // rather than pin it immutably: a reader on a long-lived tab should get
      // this week's internships without a hard refresh.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
