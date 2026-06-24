import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  return {
    title: params.lang === "fr" ? "Conditions d'utilisation" : "Terms of Use",
    description: params.lang === "fr" ? "Conditions d'utilisation d'AI and Cybersecurity News." : "AI and Cybersecurity News terms of use.",
    alternates: localizedAlternates("/terms", params.lang)
  };
}

export default function TermsPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return null;
  const locale: Locale = params.lang;
  const fr = locale === "fr";

  return (
    <section className="page-shell max-w-5xl py-10 md:py-14">
      <header className="do-hero rounded-3xl p-7 md:p-10">
        <p className="do-kicker">{fr ? "Legal" : "Legal"}</p>
        <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
          {fr ? "Conditions d'utilisation" : "Terms of Use"}
        </h1>
        <p className="mt-4 text-sm text-[color:var(--text)]">
          {fr
            ? "Conditions encadrant l'utilisation de AI and Cybersecurity News."
            : "Terms governing use of AI and Cybersecurity News."}
        </p>
      </header>

      <div className="mt-6 space-y-4">
        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
            {fr ? "Usage du contenu" : "Content usage"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text)]">
            {fr
              ? "Le contenu est fourni a des fins educatives et informationnelles."
              : "Content is provided for educational and informational purposes."}
          </p>
        </section>

        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
            {fr ? "Responsabilite" : "Responsibility"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text)]">
            {fr
              ? "Vous etes responsable de vos decisions techniques, financieres et professionnelles."
              : "You are responsible for your own technical, financial, and career decisions."}
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text)]">
            {fr
              ? "Toute reproduction de contenu sans autorisation est interdite."
              : "Reproduction of content without permission is prohibited."}
          </p>
        </section>

        <section className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
            {fr ? "Entite legale" : "Legal entity"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text)]">
            {fr ? `Operateur: ${siteConfig.termsLegalEntity}. Contact: ` : `Operator: ${siteConfig.termsLegalEntity}. Contact: `}
            <a href={`mailto:${siteConfig.contactEmail}`} className="do-link">
              {siteConfig.contactEmail}
            </a>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/${locale}/privacy`} className="btn-secondary">
              {fr ? "Confidentialite" : "Privacy"}
            </Link>
            <Link href={`/${locale}/affiliate-disclosure`} className="btn-secondary">
              {fr ? "Affiliation" : "Disclosure"}
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
