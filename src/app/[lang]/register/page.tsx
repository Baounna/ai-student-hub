import type { Metadata } from "next";
import Link from "next/link";
import { AccountAccessForm } from "@/components/account-access-form";
import { SocialAuthButtons } from "@/components/social-auth-buttons";
import { siteConfig } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";
import { getOAuthErrorMessage } from "@/lib/auth-feedback";
import { getOAuthProviderViews } from "@/lib/oauth";
import { isCredentialsAuthEnabled } from "@/lib/runtime-config";

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const fr = params.lang === "fr";
  const title = fr ? "Inscription" : "Create account";
  const description = fr
    ? "Cree ton compte AI and Cybersecurity News en quelques secondes."
    : "Create your AI and Cybersecurity News account in seconds.";

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: localizedAlternates("/register", params.lang)
  };
}

export default async function LocalizedRegisterPage(
  props: {
    params: Promise<{ lang: string }>;
    searchParams?: Promise<{ oauth_error?: string | string[] }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";
  const providers = getOAuthProviderViews().filter((provider) => provider.configured);
  const hasSocialProviders = providers.length > 0;
  const credentialsAuthEnabled = isCredentialsAuthEnabled();
  const oauthErrorRaw = searchParams?.oauth_error;
  const oauthError = typeof oauthErrorRaw === "string" ? oauthErrorRaw : null;
  const oauthErrorMessage = getOAuthErrorMessage(oauthError, locale);

  return (
    <div className="page-shell py-10 md:py-14">
      <div className="mx-auto w-full max-w-4xl">
      {hasSocialProviders ? (
        <div>
          <SocialAuthButtons locale={locale} mode="register" providers={providers} />
        </div>
      ) : null}

      {oauthErrorMessage ? (
        <div className="status-error mt-4 rounded-xl px-4 py-3 text-sm">
          {oauthErrorMessage}
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-3xl space-y-4">
        <AccountAccessForm
          locale={locale}
          mode="register"
          authVariant={credentialsAuthEnabled ? "credentials" : "passwordless"}
        />

        <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-xs text-[color:var(--muted)]">
          {fr
            ? "En continuant, tu acceptes les conditions d'utilisation et la politique de confidentialite."
            : "By continuing, you agree to the terms of use and privacy policy."}{" "}
          <Link href={`/${locale}/terms`} className="do-link">
            {fr ? "Conditions" : "Terms"}
          </Link>{" "}
          •{" "}
          <Link href={`/${locale}/privacy`} className="do-link">
            {fr ? "Confidentialite" : "Privacy"}
          </Link>
        </section>

        <div className="space-y-4">
          <section className="surface rounded-2xl p-5 md:p-6">
            <h2 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {fr ? "Ce que tu obtiens" : "What you get"}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>- {fr ? "Acces aux briefs IA + CS." : "Access to AI + Cybersecurity briefs."}</li>
              <li>- {fr ? "Ressources et comparatifs etudiants." : "Student resources and comparisons."}</li>
            </ul>
          </section>

          <section className="glass rounded-2xl p-5 md:p-6">
            <h2 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {fr ? "Deja inscrit ?" : "Already registered?"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr ? "Connecte-toi directement." : "Sign in directly."}
            </p>
            <Link href={`/${locale}/login`} className="btn-primary mt-4 inline-flex">
              {fr ? "Se connecter" : "Go to login"}
            </Link>
          </section>

          <section className="surface rounded-2xl p-5 md:p-6">
            <h2 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {fr ? "Besoin d'aide ?" : "Need help?"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr ? "Contact support:" : "Contact support:"}{" "}
              <a href={`mailto:${siteConfig.contactEmail}`} className="do-link">
                {siteConfig.contactEmail}
              </a>
            </p>
          </section>
        </div>
      </div>
      </div>
    </div>
  );
}
