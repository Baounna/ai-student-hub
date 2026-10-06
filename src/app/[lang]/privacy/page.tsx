import type { Metadata } from "next";
import { ogImageUrl } from "@/lib/seo";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const title = params.lang === "fr" ? "Politique de confidentialité" : "Privacy Policy";
  const description = params.lang === "fr" ? "Politique de confidentialité d'AI and Cybersecurity News." : "AI and Cybersecurity News privacy policy.";

  return {
    title,
    description,
    alternates: localizedAlternates("/privacy", params.lang),
    // Without its own openGraph, this page inherited the root layout's -- url
    // included -- so sharing it produced a preview claiming to be the site's
    // home page. Next merges metadata per top-level field, so the whole object
    // comes from the parent or none of it does.
    openGraph: {
      title,
      description,
      url: `/${params.lang}/privacy`,
      type: "article",
      // Without these, sharing the privacy policy or the link policy produced a
      // blank card. The og:url on these three was fixed two commits ago and the
      // image was missed.
      images: [{ url: ogImageUrl(title), width: 1200, height: 630, alt: title }]
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImageUrl(title)] }
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
        <p className="do-kicker">{fr ? "Mentions légales" : "Legal"}</p>
        <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
          {fr ? "Politique de confidentialité" : "Privacy Policy"}
        </h1>
        <p className="mt-4 text-sm text-[color:var(--text)]">
          {fr
            ? "Comment AI and Cybersecurity News collecte, utilise, et protège les informations utilisateur."
            : "How AI and Cybersecurity News collects, uses, and protects user information."}
        </p>
      </header>

      <div className="mt-6 space-y-4">
        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
            {fr ? "Données collectées" : "Data collected"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text)]">
            {fr
              ? "Nous collectons uniquement les données nécessaires (email, prénom) pour envoyer la newsletter et des ressources."
              : "We only collect data needed to deliver the newsletter and resources (email, first name)."}
          </p>
        </section>

        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
            {fr ? "Utilisation des données" : "How data is used"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text)]">
            {fr
              ? "Nous ne vendons pas vos données personnelles. Vous pouvez vous désabonner à tout moment."
              : "We do not sell your personal data. You can unsubscribe at any time."}
          </p>
        </section>

        {/*
          * The services that see a reader, named.
          *
          * The policy said only that we collect an email and a first name for
          * the newsletter. That is true of what we choose to collect and
          * materially incomplete about what a reader's browser actually does:
          * the bot-protection challenge sits in the footer form on every page,
          * so Cloudflare sees every visitor's address before anyone decides to
          * subscribe, and the host's analytics counts every page view. Neither
          * was named.
          *
          * Nothing here is new collection — it is disclosure catching up with
          * what already runs. For a site read in France and Morocco, naming the
          * recipients is what Articles 13-14 ask for, and for a site whose whole
          * claim is verified provenance it is the page a careful reader checks
          * first.
          */}
        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
            {fr ? "Services qui voient votre visite" : "Services that see your visit"}
          </h2>
          <ul className="mt-2 space-y-2 text-sm leading-7 text-[color:var(--text)]">
            <li>
              {fr
                ? "Vercel héberge le site. Son service de mesure d'audience compte les pages vues et les sites référents, sans cookie et sans profil publicitaire. Vercel reçoit votre adresse IP, comme tout hébergeur."
                : "Vercel hosts the site. Its analytics counts page views and referrers, with no cookie and no advertising profile. Vercel receives your IP address, as any host does."}
            </li>
            <li>
              {fr
                ? "Cloudflare Turnstile protège le formulaire d'inscription contre les robots. Il est présent dans le pied de page de chaque page, donc Cloudflare reçoit votre adresse IP et des signaux de navigateur même si vous ne vous inscrivez jamais."
                : "Cloudflare Turnstile protects the signup form from bots. It sits in the footer of every page, so Cloudflare receives your IP address and browser signals even if you never subscribe."}
            </li>
            <li>
              {fr
                ? "Kit (anciennement ConvertKit) envoie la newsletter. Il reçoit votre email et votre prénom uniquement si vous vous inscrivez, et les traite aux États-Unis."
                : "Kit (formerly ConvertKit) sends the newsletter. It receives your email and first name only if you subscribe, and processes them in the United States."}
            </li>
          </ul>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
            {fr
              ? "Les polices de caractères sont servies depuis ce site, pas depuis un CDN externe : aucune requête vers Google Fonts. Aucun cookie publicitaire n'est déposé, et le site n'utilise pas Google Analytics."
              : "Fonts are served from this site, not an external CDN: no request reaches Google Fonts. No advertising cookie is set, and the site does not use Google Analytics."}
          </p>
        </section>

        <section className="surface rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
            {fr ? "Conservation et base légale" : "Retention and legal basis"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[color:var(--text)]">
            {fr
              ? "Votre email reste chez Kit tant que vous êtes inscrit. Vous désabonner le retire de la liste, et vous pouvez demander sa suppression complète à l'adresse ci-dessous. La base légale est votre consentement pour la newsletter, et l'intérêt légitime pour la protection anti-robots et la mesure d'audience sans cookie."
              : "Your email stays with Kit for as long as you are subscribed. Unsubscribing removes you from the list, and you can ask for full deletion at the address below. The legal basis is your consent for the newsletter, and legitimate interest for bot protection and cookieless analytics."}
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
