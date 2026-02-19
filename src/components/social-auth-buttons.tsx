"use client";

import type { Locale } from "@/i18n/config";
import type { OAuthMode, OAuthProviderView } from "@/lib/oauth";
import { trackEvent } from "@/lib/track";

type SocialAuthButtonsProps = {
  locale: Locale;
  mode: OAuthMode;
  providers: OAuthProviderView[];
};

function providerIcon(provider: OAuthProviderView["id"]) {
  if (provider === "google") return "G";
  if (provider === "github") return "GH";
  return "in";
}

function providerBadgeClass(provider: OAuthProviderView["id"]) {
  if (provider === "google") return "text-rose-500 border-rose-300/40 bg-rose-500/10";
  if (provider === "github") return "text-indigo-500 border-indigo-300/40 bg-indigo-500/10";
  return "text-sky-500 border-sky-300/40 bg-sky-500/10";
}

export function SocialAuthButtons({ locale, mode, providers }: SocialAuthButtonsProps) {
  const configured = providers.filter((provider) => provider.configured);
  if (!configured.length) return null;

  return (
    <section className="glass rounded-2xl p-5 md:p-6">
      <p className="do-kicker">{locale === "fr" ? "Connexion sociale" : "Social sign in"}</p>
      <h2 className="font-display mt-2 text-xl font-semibold text-[color:var(--text-strong)]">
        {locale === "fr"
          ? "Continue avec Google, GitHub ou LinkedIn."
          : "Continue with Google, GitHub, or LinkedIn."}
      </h2>
      <p className="mt-1 text-xs text-[color:var(--muted)]">
        {mode === "login"
          ? locale === "fr"
            ? "Connexion rapide"
            : "Fast login"
          : locale === "fr"
            ? "Inscription rapide"
            : "Fast signup"}
      </p>

      <p className="mt-2 inline-flex rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-[11px] text-[color:var(--muted)]">
        {locale === "fr" ? "OAuth securise" : "Secure OAuth"}
      </p>

      <div className="mt-4 grid gap-2">
        {configured.map((provider) => {
          const href = `/api/auth/oauth/${provider.id}?locale=${locale}&mode=${mode}&returnTo=/${locale}/account`;
          const badgeClass = providerBadgeClass(provider.id);

          return (
            <a
              key={provider.id}
              href={href}
              className="group inline-flex h-11 items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm font-medium text-[color:var(--text)] hover:border-[color:var(--primary)]/35 hover:text-[color:var(--text-strong)]"
              onClick={() =>
                trackEvent(mode === "login" ? "auth_login_attempt" : "auth_register_attempt", {
                  locale,
                  method: "oauth",
                  provider: provider.id,
                  source: `auth_${mode}_social`
                })
              }
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full border px-1 text-[11px] font-bold ${badgeClass}`}
                >
                  {providerIcon(provider.id)}
                </span>
                {locale === "fr" ? `Continuer avec ${provider.label}` : `Continue with ${provider.label}`}
              </span>
              <span className="text-xs text-[color:var(--muted)] group-hover:text-[color:var(--text-strong)]">
                {mode === "login" ? "Login" : "Join"}
              </span>
            </a>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-[color:var(--muted)]">
        {locale === "fr" ? "Ou continue avec l'email ci-dessous." : "Or continue with email below."}
      </p>
    </section>
  );
}
