"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { trackEvent } from "@/lib/track";

type Mode = "register" | "login";

type AccountAccessFormProps = {
  locale: Locale;
  mode: Mode;
};

export function AccountAccessForm({ locale, mode }: AccountAccessFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [emailForwarded, setEmailForwarded] = useState<boolean | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<"sent" | "queued" | "failed" | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  const isRegister = mode === "register";
  const submitLabel = isRegister
    ? locale === "fr"
      ? "Creer mon acces"
      : "Create my account"
    : locale === "fr"
      ? "Continuer par email"
      : "Continue with email";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    trackEvent(isRegister ? "auth_register_attempt" : "auth_login_attempt", {
      locale,
      method: "email",
      source: `auth_${mode}_form`
    });

    try {
      const formData = new FormData(event.currentTarget);
      const company = String(formData.get("company") || "");
      const response = await fetch("/api/account-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: isRegister ? name : "",
          company,
          locale,
          mode,
          source: `auth_${mode}_form`
        })
      });

      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as {
        forwarded?: boolean;
        authenticated?: boolean;
        redirectTo?: string;
        deliveryStatus?: "sent" | "queued" | "failed";
      };

      setStatus("success");
      setEmailForwarded(Boolean(data.forwarded));
      setDeliveryStatus(data.deliveryStatus || (data.forwarded ? "sent" : "queued"));
      setSignedIn(Boolean(data.authenticated));
      if (isRegister) setName("");
      setEmail("");
      trackEvent("account_access_submit_success", { locale, mode });

      if (data.authenticated && data.redirectTo) {
        setTimeout(() => {
          router.push(data.redirectTo as string);
          router.refresh();
        }, 550);
      }
    } catch {
      setStatus("error");
      setEmailForwarded(null);
      setDeliveryStatus(null);
      setSignedIn(false);
      trackEvent("account_access_submit_error", { locale, mode });
    }
  }

  return (
    <form className="surface rounded-2xl p-5 md:p-6" onSubmit={onSubmit}>
      <p className="do-kicker">{isRegister ? (locale === "fr" ? "Inscription" : "Account creation") : "Login"}</p>
      <h2 className="font-display mt-2 text-xl font-semibold text-[color:var(--text-strong)]">
        {isRegister
          ? locale === "fr"
            ? "Acces gratuit a AI Student Hub"
            : "Free AI Student Hub access"
          : locale === "fr"
            ? "Acces par email"
            : "Email access"}
      </h2>
      <p className="mt-2 text-sm text-[color:var(--text)]">
        {isRegister
          ? locale === "fr"
            ? "Entre ton email pour creer ton acces et recevoir les mises a jour."
            : "Enter your email to create access and receive platform updates."
          : locale === "fr"
            ? "Entre ton email pour recevoir un acces ou des instructions de connexion."
            : "Enter your email to receive access or sign-in instructions."}
      </p>

      <div className="mt-4 grid gap-3">
        {isRegister && (
          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--muted)]">{locale === "fr" ? "Prenom" : "First name"}</span>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={locale === "fr" ? "Ton prenom" : "Your first name"}
              autoComplete="given-name"
              maxLength={80}
              className="h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)] focus:border-[color:var(--primary)]/45"
              required
            />
          </label>
        )}

        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        <label className="grid gap-1">
          <span className="text-xs text-[color:var(--muted)]">{locale === "fr" ? "Adresse email" : "Email address"}</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@school.edu"
            autoComplete="email"
            maxLength={254}
            className="h-11 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)] focus:border-[color:var(--primary)]/45"
            required
          />
        </label>

        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary h-11 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? (locale === "fr" ? "Envoi..." : "Sending...") : submitLabel}
        </button>
      </div>

      {status === "success" && (
        <div className="status-success mt-3 rounded-lg px-3 py-2 text-xs" aria-live="polite">
          <p>
            {signedIn
              ? locale === "fr"
                ? "Connexion reussie. Redirection vers ton compte..."
                : "Signed in successfully. Redirecting to your account..."
              : locale === "fr"
                ? deliveryStatus === "failed"
                  ? "Demande enregistree. Reessaie plus tard pour recevoir l'email de confirmation."
                  : "Demande enregistree. Nous t'envoyons la suite par email."
                : deliveryStatus === "failed"
                  ? "Request saved. Retry later to receive the confirmation email."
                  : "Request received. We will send the next steps by email."}
          </p>
          {signedIn && emailForwarded ? (
            <p className="mt-1 opacity-90">
              {locale === "fr"
                ? "Un email de confirmation a aussi ete envoye."
                : "A confirmation email was also sent."}
            </p>
          ) : null}
        </div>
      )}
      {status === "error" && (
        <p className="status-error mt-3 rounded-lg px-3 py-2 text-xs" aria-live="polite">
          {locale === "fr" ? "Erreur. Reessaie dans un instant." : "Something went wrong. Try again."}
        </p>
      )}

      <p className="mt-3 text-xs text-[color:var(--muted)]">
        {locale === "fr"
          ? "Acces securise. Tu peux te deconnecter a tout moment."
          : "Secure access. You can log out any time."}
      </p>
    </form>
  );
}
