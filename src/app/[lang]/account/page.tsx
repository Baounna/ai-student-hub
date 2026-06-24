import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { getOAuthProviderViews } from "@/lib/oauth";
import { AUTH_SESSION_COOKIE, parseSessionToken } from "@/lib/auth-session";
import { isCredentialsAuthEnabled } from "@/lib/runtime-config";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";

const providerLabel: Record<string, string> = {
  email: "Email",
  credentials: "Email + Password",
  google: "Google",
  github: "GitHub",
  linkedin: "LinkedIn"
};

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  const fr = params.lang === "fr";

  return {
    title: fr ? "Mon compte" : "My account",
    description: fr ? "Espace compte AI and Cybersecurity News." : "AI and Cybersecurity News account area.",
    robots: { index: false, follow: false },
    alternates: localizedAlternates("/account", params.lang)
  };
}

export default async function LocalizedAccountPage({
  params,
  searchParams
}: {
  params: { lang: string };
  searchParams?: { auth?: string | string[] };
}) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";
  const token = cookies().get(AUTH_SESSION_COOKIE)?.value;
  const session = await parseSessionToken(token);
  const hasSocialProviders = getOAuthProviderViews().some((provider) => provider.configured);
  const credentialsAuthEnabled = isCredentialsAuthEnabled();
  const authSuccess = searchParams?.auth === "success";
  const sessionProviderLabel = session ? providerLabel[session.provider] || session.provider : "";

  if (!session) {
    return (
      <div className="page-shell max-w-6xl py-10 md:py-14">
        <section className="do-hero rounded-3xl p-7 md:p-10">
          <p className="do-kicker">{fr ? "Compte" : "Account"}</p>
          <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
            {fr ? "Aucune session active" : "No active session"}
          </h1>
          <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">
            {fr
              ? hasSocialProviders
                ? credentialsAuthEnabled
                  ? "Connecte-toi avec Google, GitHub, LinkedIn, ou email + mot de passe pour acceder a ton espace."
                  : "Connecte-toi avec Google, GitHub, LinkedIn, ou email pour acceder a ton espace."
                : credentialsAuthEnabled
                  ? "Connecte-toi par email + mot de passe pour acceder a ton espace."
                  : "Connecte-toi par email pour acceder a ton espace."
              : hasSocialProviders
                ? credentialsAuthEnabled
                  ? "Sign in with Google, GitHub, LinkedIn, or email + password to access your account."
                  : "Sign in with Google, GitHub, LinkedIn, or email to access your account."
                : credentialsAuthEnabled
                  ? "Sign in with email + password to access your account."
                  : "Sign in with email to access your account."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/${locale}/login`} className="btn-primary">
              {fr ? "Se connecter" : "Login"}
            </Link>
            <Link href={`/${locale}/register`} className="btn-secondary">
              {fr ? "Creer un compte" : "Create account"}
            </Link>
          </div>
        </section>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,18rem]">
          <div className="surface rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
              {fr ? "Acces recommande" : "Recommended access"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr
                ? "Connecte-toi d'abord puis reprends ton parcours News -> Resources -> Compare."
                : "Sign in first, then continue your path: News -> Resources -> Compare."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/${locale}/news`} className="btn-secondary">
                {fr ? "Actualites" : "News"}
              </Link>
              <Link href={`/${locale}/resources`} className="btn-secondary">
                {fr ? "Ressources" : "Resources"}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-primary">
                {fr ? "Comparatifs" : "Compare"}
              </Link>
            </div>
          </div>
          <aside className="space-y-4">
            <EditorialTrust locale={locale} compact />
            <Newsletter compact locale={locale} source="account_guest_aside" />
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-6xl py-10 md:py-14">
      <section className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{fr ? "Compte" : "Account"}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {fr ? `Bienvenue ${session.name}` : `Welcome ${session.name}`}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">
              {fr
                ? "Tu es connecte a AI and Cybersecurity News. Continue vers les news, ressources et comparatifs."
                : "You are signed in to AI and Cybersecurity News. Continue with news, resources, and comparison guides."}
            </p>
          </div>
          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{fr ? "Session active" : "Active session"}</p>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr ? `Connecte via ${sessionProviderLabel}.` : `Signed in with ${sessionProviderLabel}.`}
            </p>
            <a href={`/api/auth/logout?locale=${locale}`} className="btn-secondary mt-4 inline-flex">
              {fr ? "Se deconnecter" : "Log out"}
            </a>
          </div>
        </div>
      </section>

      {authSuccess ? (
        <div className="status-success mt-4 rounded-xl px-4 py-3 text-sm">
          {fr
            ? "Connexion reussie. Ton espace est pret."
            : "Sign-in successful. Your account workspace is ready."}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <section className="surface rounded-2xl p-5 md:p-6">
          <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
            {fr ? "Profil" : "Profile"}
          </h2>
          <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--bg-soft)] text-sm font-bold uppercase text-[color:var(--text-strong)]">
              {session.name.charAt(0)}
            </span>
            <div>
              <p className="text-sm font-semibold text-[color:var(--text-strong)]">{session.name}</p>
              <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">{sessionProviderLabel}</p>
            </div>
          </div>
          <dl className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
            <div>
              <dt className="text-[color:var(--muted)]">{fr ? "Nom" : "Name"}</dt>
              <dd>{session.name}</dd>
            </div>
            <div>
              <dt className="text-[color:var(--muted)]">Email</dt>
              <dd>{session.email}</dd>
            </div>
            <div>
              <dt className="text-[color:var(--muted)]">{fr ? "Provider" : "Provider"}</dt>
              <dd>{sessionProviderLabel}</dd>
            </div>
          </dl>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <section className="glass rounded-2xl p-5 md:p-6">
            <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
              {fr ? "Actions rapides" : "Quick actions"}
            </h2>
            <div className="mt-4 grid gap-2">
              <Link href={`/${locale}/news`} className="btn-secondary text-center">
                {fr ? "Actualites IA/CS" : "AI + Cybersecurity News"}
              </Link>
              <Link href={`/${locale}/resources`} className="btn-secondary text-center">
                {fr ? "Ressources" : "Resources"}
              </Link>
              <Link href={`/${locale}/compare`} className="btn-primary text-center">
                {fr ? "Comparatifs" : "Comparisons"}
              </Link>
            </div>
          </section>
          <EditorialTrust locale={locale} compact />
          <Newsletter compact locale={locale} source="account_member_aside" />
        </aside>
      </div>
    </div>
  );
}
