import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  return {
    title: params.lang === "fr" ? "Divulgation d'affiliation" : "Affiliate Disclosure",
    description: params.lang === "fr" ? "Informations sur les liens d'affiliation." : "Information about affiliate links.",
    alternates: localizedAlternates("/affiliate-disclosure", params.lang)
  };
}

export default function AffiliateDisclosurePage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return null;
  const locale: Locale = params.lang;
  const fr = locale === "fr";

  return (
    <section className="page-shell max-w-5xl py-10 md:py-14">
      <header className="do-hero rounded-3xl p-7 md:p-10">
        <p className="do-kicker">{fr ? "Legal" : "Legal"}</p>
        <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
          {fr ? "Divulgation d'affiliation" : "Affiliate Disclosure"}
        </h1>
        <p className="mt-4 text-sm text-[color:var(--text)]">
          {fr
            ? "Transparence sur les liens partenaires utilises sur AI and Cybersecurity News."
            : "Transparency about partner links used across AI and Cybersecurity News."}
        </p>
      </header>

      <div className="mt-6 space-y-4">
        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
            {fr ? "Politique d'affiliation" : "Affiliate policy"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text)]">{siteConfig.affiliateDisclosureText[locale]}</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text)]">
            {fr
              ? "Nous recommandons uniquement des outils pertinents pour les etudiants."
              : "We only recommend tools relevant to student outcomes."}
          </p>
        </section>

        <section className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
            {fr ? "Editeur" : "Publisher"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text)]">
            {fr ? `Editeur: ${siteConfig.legalName}. Contact: ` : `Publisher: ${siteConfig.legalName}. Contact: `}
            <a href={`mailto:${siteConfig.contactEmail}`} className="do-link">
              {siteConfig.contactEmail}
            </a>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/${locale}/resources`} className="btn-secondary">
              {fr ? "Ressources" : "Resources"}
            </Link>
            <Link href={`/${locale}/terms`} className="btn-secondary">
              {fr ? "Conditions" : "Terms"}
            </Link>
            <Link href={`/${locale}/privacy`} className="btn-secondary">
              {fr ? "Confidentialite" : "Privacy"}
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
