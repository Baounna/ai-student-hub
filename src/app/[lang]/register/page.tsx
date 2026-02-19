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
  const title = fr ? "Creer un compte" : "Create account";
  const description = fr
    ? "Creer un acces AI Student Hub pour recevoir les ressources et mises a jour."
    : "Create your AI Student Hub account to get resources and updates.";

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: localizedAlternates("/register", params.lang)
  };
}

export default function LocalizedRegisterPage({
  params,
  searchParams
}: {
  params: { lang: string };
  searchParams?: { oauth_error?: string | string[] };
}) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";
  const providers = getOAuthProviderViews().filter((provider) => provider.configured);
  const hasSocialProviders = providers.length > 0;
  const oauthErrorRaw = searchParams?.oauth_error;
  const oauthError = typeof oauthErrorRaw === "string" ? oauthErrorRaw : null;
  const oauthErrorMessage = getOAuthErrorMessage(oauthError, locale);

  return (
    <div className="page-shell max-w-6xl py-10 md:py-14">
      <section className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{fr ? "Compte" : "Account"}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {fr ? "Creer un compte AI Student Hub" : "Create your AI Student Hub account"}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">
              {fr
                ? "Acces gratuit pour suivre les news IA/CS, les guides deploiement et les ressources etudiantes."
                : "Free access to AI/CS news, deployment guides, and student-focused resources."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Acces gratuit" : "Free access"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "EN/FR" : "EN/FR"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Execution IA/CS" : "AI/CS execution"}
              </span>
            </div>
          </div>
          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{fr ? "Demarrage en 30 secondes" : "Start in 30 seconds"}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>{fr ? "1. Cree ton acces gratuitement." : "1. Create your free access."}</li>
              <li>{fr ? "2. Activation instantanee apres validation." : "2. Instant activation after submit."}</li>
              <li>{fr ? "3. Lance ton parcours execution IA/CS." : "3. Start your AI/CS execution path."}</li>
            </ul>
          </div>
        </div>
      </section>

      {hasSocialProviders ? (
        <div className="mt-6">
          <SocialAuthButtons locale={locale} mode="register" providers={providers} />
        </div>
      ) : null}

      {oauthErrorMessage ? (
        <div className="status-error mt-4 rounded-xl px-4 py-3 text-sm">
          {oauthErrorMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <AccountAccessForm locale={locale} mode="register" />

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <section className="glass rounded-2xl p-5 md:p-6">
            <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
              {fr ? "Ce que tu reçois" : "What you get"}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>- {fr ? "Briefs IA/CS hebdomadaires avec actions concretes." : "Weekly AI/CS briefs with practical actions."}</li>
              <li>- {fr ? "Acces rapide aux comparatifs et ressources." : "Fast access to tools, resources, and comparisons."}</li>
              <li>- {fr ? "Roadmap etudiante pour passer de theorie a execution." : "Student roadmap to move from theory to execution."}</li>
            </ul>
          </section>

          <EditorialTrust locale={locale} compact />

          <section className="surface rounded-2xl p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--primary)]">
              {fr ? "Comment ca marche" : "How it works"}
            </p>
            <ol className="mt-2 space-y-1 text-sm text-[color:var(--text)]">
              <li>1. {fr ? "Soumets ton email." : "Submit your email."}</li>
              <li>2. {fr ? "Session creee automatiquement." : "Session is created automatically."}</li>
              <li>3. {fr ? "Commence avec News, Resources, Compare." : "Start with News, Resources, Compare."}</li>
            </ol>
          </section>

          <section className="glass rounded-2xl p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--primary)]">{fr ? "Deja inscrit" : "Already registered?"}</p>
            <Link href={`/${locale}/login`} className="do-link mt-2 inline-block text-sm">
              {fr ? "Se connecter" : "Go to login"}
            </Link>
          </section>

          <Newsletter compact locale={locale} source="register_aside" />
        </aside>
      </div>
    </div>
  );
}
