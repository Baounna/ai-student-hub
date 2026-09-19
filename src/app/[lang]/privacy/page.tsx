import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  return {
    title: params.lang === "fr" ? "Politique de confidentialite" : "Privacy Policy",
    description: params.lang === "fr" ? "Politique de confidentialite d'AI and Cybersecurity News." : "AI and Cybersecurity News privacy policy.",
    alternates: localizedAlternates("/privacy", params.lang)
  };
}

export default async function PrivacyPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;
  const locale: Locale = params.lang;
  const fr = locale === "fr";

  return (
    <section className="page-shell max-w-5xl py-10 md:py-14">
      <header className="do-hero rounded-3xl p-7 md:p-10">
        <p className="do-kicker">{fr ? "Legal" : "Legal"}</p>
        <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
          {fr ? "Politique de confidentialite" : "Privacy Policy"}
        </h1>
        <p className="mt-4 text-sm text-[color:var(--text)]">
          {fr
            ? "Comment AI and Cybersecurity News collecte, utilise, et protege les informations utilisateur."
            : "How AI and Cybersecurity News collects, uses, and protects user information."}
        </p>
      </header>

      <div className="mt-6 space-y-4">
        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
            {fr ? "Donnees collectees" : "Data collected"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text)]">
            {fr
              ? "Nous collectons uniquement les donnees necessaires (email, prenom) pour envoyer la newsletter et des ressources."
              : "We only collect data needed to deliver the newsletter and resources (email, first name)."}
          </p>
        </section>

        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
            {fr ? "Utilisation des donnees" : "How data is used"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text)]">
            {fr
              ? "Nous n'utilisons pas vos donnees pour des ventes externes. Vous pouvez vous desabonner a tout moment."
              : "We do not sell your personal data. You can unsubscribe at any time."}
          </p>
        </section>

        <section className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
            {fr ? "Contact et droits" : "Contact and rights"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text)]">
            {fr ? "Pour toute demande: " : "For any request: "}
            <a href={`mailto:${siteConfig.privacyContactEmail}`} className="do-link">
              {siteConfig.privacyContactEmail}
            </a>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/${locale}/terms`} className="btn-secondary">
              {fr ? "Conditions" : "Terms"}
            </Link>
            <Link href={`/${locale}/affiliate-disclosure`} className="btn-secondary">
              {fr ? "Liens" : "Links"}
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
