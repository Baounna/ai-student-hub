import type { Metadata } from "next";
import Link from "next/link";
import { Newsletter } from "@/components/newsletter";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords, ogImageUrl } from "@/lib/seo";

/**
 * This page used to sell a guide nobody has written.
 *
 * It carried a "Launch offer" of $9-$19, a "What you get" list of four
 * deliverables, "Included extras" promising email support and sixty days of
 * updates, a day-by-day breakdown of its contents, and an FAQ answering "I am
 * a beginner, is this guide still useful?" in the present tense. The only
 * caveat was "Checkout is not live yet", which a reader takes to mean the
 * product exists and the payment link is pending.
 *
 * The rest of this site spent a long day removing a free roadmap that had
 * never been written. This was the same untruth with a price on it, and it
 * survived that cleanup because nothing here says the word "roadmap".
 *
 * The route stays because twenty-eight internal links point at it and because
 * the guide may genuinely get written. What it says now is what is true: it
 * does not exist, nothing is for sale, no date is promised, and here is the
 * work that does exist and is free.
 */
export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const fr = params.lang === "fr";
  const title = fr ? "Guide Carrière IA" : "AI Career Guide";
  const description = fr
    ? "Ce guide n'est pas encore écrit. Voici ce qui existe déjà, et gratuitement."
    : "This guide is not written yet. Here is what already exists, free.";

  return {
    title,
    description,
    keywords: getSeoKeywords(params.lang, "product", [
      fr ? "preparation stage ia" : "ai internship preparation",
      fr ? "plan portfolio etudiant" : "student portfolio action plan"
    ]),
    openGraph: {
      title,
      description,
      url: `/${params.lang}/product/ai-career-guide`,
      type: "website",
      images: [{ url: ogImageUrl(title), width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl(title)]
    },
    alternates: localizedAlternates("/product/ai-career-guide", params.lang)
  };
}

export default async function LocalizedProductPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";

  const alternatives = fr
    ? [
        { href: `/${locale}/stages`, label: "Les stages ouverts", body: "Stages, alternances et PFE vérifiés un par un, remis à jour chaque semaine." },
        { href: `/${locale}/blog`, label: "Les guides", body: "Articles techniques sur l'IA et la cybersécurité, avec des exemples exécutables." },
        { href: `/${locale}/compare`, label: "Le lab outils", body: "Comparatifs d'outils avec leurs vrais compromis, pensés pour un budget étudiant." }
      ]
    : [
        { href: `/${locale}/stages`, label: "Open internships", body: "Internships, apprenticeships and final-year projects, each link checked by hand, updated weekly." },
        { href: `/${locale}/blog`, label: "The guides", body: "Technical articles on AI and cybersecurity, with examples you can actually run." },
        { href: `/${locale}/compare`, label: "The tools lab", body: "Tool comparisons with their real trade-offs, written for a student budget." }
      ];

  return (
    <div className="page-shell max-w-4xl py-10 md:py-16">
      <section className="do-hero rounded-3xl p-7 md:p-10">
        <p className="do-kicker">{fr ? "Pas encore écrit" : "Not written yet"}</p>
        <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
          {fr ? "Guide d'exécution carrière IA" : "AI Career Execution Guide"}
        </h1>
        <p className="body-copy mt-4 max-w-2xl text-[color:var(--text)]">
          {fr
            ? "Ce guide n'existe pas. Il n'y a rien à acheter, aucun prix, et aucune date annoncée. Cette page portait une offre de lancement et une liste de son contenu pour un document que personne n'a écrit : c'était faux, et c'est retiré."
            : "This guide does not exist. There is nothing to buy, no price, and no date promised. This page used to carry a launch offer and a list of its contents for a document nobody had written. That was untrue, and it is gone."}
        </p>
        <p className="mt-4 max-w-2xl text-sm text-[color:var(--muted)]">
          {fr
            ? "Si elle est écrite un jour, elle sera annoncée dans la lettre hebdomadaire. En attendant, tout le travail publié ici est gratuit."
            : "If it ever gets written, the weekly email is where that would be announced. Everything published here is free in the meantime."}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display section-title font-semibold text-[color:var(--text-strong)]">
          {fr ? "Ce qui existe vraiment" : "What actually exists"}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {alternatives.map((item) => (
            <Link key={item.href} href={item.href} className="surface rounded-2xl p-5 transition hover:border-[color:var(--primary)]">
              <p className="font-semibold text-[color:var(--text-strong)]">{item.label}</p>
              <p className="mt-2 text-sm text-[color:var(--text)]">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-10">
        <Newsletter locale={locale} source="product_page" />
      </div>
    </div>
  );
}
