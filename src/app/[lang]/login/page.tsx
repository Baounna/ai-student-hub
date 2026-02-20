import type { Metadata } from "next";
import Link from "next/link";
import { AccountAccessForm } from "@/components/account-access-form";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { SocialAuthButtons } from "@/components/social-auth-buttons";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";
import { getOAuthErrorMessage } from "@/lib/auth-feedback";
import { getOAuthProviderViews } from "@/lib/oauth";

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  const fr = params.lang === "fr";
  const title = fr ? "Connexion" : "Login";
  const description = fr
    ? "Connecte-toi instantanement a AI Student Hub."
    : "Sign in instantly to AI Student Hub.";

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: localizedAlternates("/login", params.lang)
  };
}

export default function LocalizedLoginPage({
  params,
  searchParams
}: {
  params: { lang: string };
  searchParams?: { oauth_error?: string | string[]; logged_out?: string | string[] };
}) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";
  const providers = getOAuthProviderViews().filter((provider) => provider.configured);
  const hasSocialProviders = providers.length > 0;
  const oauthErrorRaw = searchParams?.oauth_error;
  const oauthError = typeof oauthErrorRaw === "string" ? oauthErrorRaw : null;
  const oauthErrorMessage = getOAuthErrorMessage(oauthError, locale);
  const loggedOut = typeof searchParams?.logged_out === "string";
  const secureAccessTitle = fr ? "Acces compte" : "Account access";

  return (
    <div className="page-shell max-w-6xl py-10 md:py-14">
      <section className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">Login</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {fr ? "Connexion a AI Student Hub" : "Sign in to AI Student Hub"}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">
              {fr
                ? "Connexion instantanee pour acceder a tes ressources et mises a jour."
                : "Instant sign in to access your resources and updates."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Acces instantane" : "Instant access"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Session securisee" : "Secure session"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Acces etudiant" : "Student access"}
              </span>
            </div>
          </div>
          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{fr ? "Session rapide" : "Fast session"}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>{fr ? "1. Choisis social login ou email." : "1. Choose social login or email."}</li>
              <li>{fr ? "2. Session ouverte en quelques secondes." : "2. Session opens in seconds."}</li>
              <li>{fr ? "3. Reprends News, Resources, Compare." : "3. Continue with News, Resources, Compare."}</li>
            </ul>
          </div>
        </div>
      </section>

      {oauthErrorMessage ? (
        <div className="status-error mt-4 rounded-xl px-4 py-3 text-sm">
          {oauthErrorMessage}
        </div>
      ) : null}

      {loggedOut ? (
        <div className="status-success mt-4 rounded-xl px-4 py-3 text-sm">
          {fr ? "Tu es deconnecte avec succes." : "You have been logged out successfully."}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          {hasSocialProviders ? <SocialAuthButtons locale={locale} mode="login" providers={providers} /> : null}
          <AccountAccessForm locale={locale} mode="login" />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <section className="glass rounded-2xl p-5 md:p-6">
            <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
              {secureAccessTitle}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              {hasSocialProviders ? (
                <li>- {fr ? "Connexion sociale (Google/GitHub/LinkedIn)." : "Social login (Google/GitHub/LinkedIn)."}</li>
              ) : null}
              <li>- {fr ? "Connexion email instantanee." : "Instant email sign-in."}</li>
              <li>- {fr ? "Session 30 jours avec deconnexion en un clic." : "30-day session with one-click logout."}</li>
            </ul>
          </section>

          <EditorialTrust locale={locale} compact />

          <section className="surface rounded-2xl p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--primary)]">
              {fr ? "Depannage" : "Troubleshooting"}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[color:var(--text)]">
              <li>- {fr ? "Si blocage: vide cache navigateur puis reessaie." : "If blocked: clear browser cache then retry."}</li>
              <li>- {fr ? "Pour social login, teste un autre provider ou l'email." : "For social login, try another provider or email."}</li>
              <li>- {fr ? "Utilise la meme adresse que ton compte." : "Use the same email as your account."}</li>
            </ul>
          </section>

          <section className="glass rounded-2xl p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--primary)]">
              {fr ? "Nouveau sur la plateforme" : "New to the platform"}
            </p>
            <h2 className="font-display mt-2 text-lg font-semibold text-[color:var(--text-strong)]">
              {fr ? "Cree ton compte en 30 secondes" : "Create your account in 30 seconds"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr
                ? "Accede aux news IA/CS, guides deployment, ressources et comparatifs."
                : "Get access to AI/CS news, deployment guides, resources, and comparisons."}
            </p>
            <Link href={`/${locale}/register`} className="btn-primary mt-4 inline-flex">
              {fr ? "Creer un compte" : "Create account"}
            </Link>
          </section>

          <Newsletter compact locale={locale} source="login_aside" />

          <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-xs text-[color:var(--muted)]">
            {fr
              ? "En continuant, tu acceptes les conditions et la politique de confidentialite."
              : "By continuing, you agree to the terms and privacy policy."}{" "}
            <Link href={`/${locale}/terms`} className="do-link">
              {fr ? "Conditions" : "Terms"}
            </Link>{" "}
            •{" "}
            <Link href={`/${locale}/privacy`} className="do-link">
              {fr ? "Confidentialite" : "Privacy"}
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
