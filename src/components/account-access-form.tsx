"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { trackEvent } from "@/lib/track";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

type Mode = "register" | "login";
type AuthVariant = "passwordless" | "credentials";

type AccountAccessFormProps = {
  locale: Locale;
  mode: Mode;
  authVariant?: AuthVariant;
};

type EmailCheckStatus = "idle" | "checking" | "exists" | "missing" | "error";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isLikelyEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export function AccountAccessForm({ locale, mode, authVariant = "passwordless" }: AccountAccessFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [emailForwarded, setEmailForwarded] = useState<boolean | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<"sent" | "queued" | "failed" | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailCheckStatus, setEmailCheckStatus] = useState<EmailCheckStatus>("idle");
  const [emailCheckedValue, setEmailCheckedValue] = useState("");
  const latestEmailCheckRequest = useRef(0);

  const isRegister = mode === "register";
  const useCredentials = authVariant === "credentials";
  const submitLabel = isRegister
    ? locale === "fr"
      ? "Creer mon acces"
      : "Create my account"
    : locale === "fr"
      ? useCredentials
        ? "Se connecter"
        : "Continuer par email"
      : useCredentials
        ? "Sign in"
        : "Continue with email";
  const loadingLabel = isRegister
    ? locale === "fr"
      ? "Creation..."
      : "Creating..."
    : locale === "fr"
      ? "Connexion..."
      : "Signing in...";

  const endpoint = useCredentials ? `/api/auth/credentials/${mode}` : "/api/account-access";

  async function checkEmailExists(rawEmail: string): Promise<EmailCheckStatus> {
    if (!useCredentials) return "idle";

    const normalizedEmail = normalizeEmail(rawEmail);
    if (!normalizedEmail || !isLikelyEmail(normalizedEmail)) {
      setEmailCheckStatus("idle");
      setEmailCheckedValue("");
      return "idle";
    }

    if (normalizedEmail === emailCheckedValue && (emailCheckStatus === "exists" || emailCheckStatus === "missing")) {
      return emailCheckStatus;
    }

    const requestId = latestEmailCheckRequest.current + 1;
    latestEmailCheckRequest.current = requestId;
    setEmailCheckStatus("checking");

    try {
      const response = await fetch("/api/auth/credentials/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail })
      });

      if (!response.ok) {
        throw new Error("email_check_failed");
      }

      const data = (await response.json()) as { exists?: boolean };
      if (requestId !== latestEmailCheckRequest.current) return "idle";

      setEmailCheckedValue(normalizedEmail);
      const resolved = data.exists ? "exists" : "missing";
      setEmailCheckStatus(resolved);
      return resolved;
    } catch {
      if (requestId !== latestEmailCheckRequest.current) return "idle";
      setEmailCheckedValue("");
      setEmailCheckStatus("error");
      return "error";
    }

    return "error";
  }

  const emailCheckFeedback =
    !useCredentials || emailCheckStatus === "idle"
      ? null
      : emailCheckStatus === "checking"
        ? {
            tone: "muted" as const,
            text: locale === "fr" ? "Verification de l'email..." : "Checking email..."
          }
        : emailCheckStatus === "exists"
          ? isRegister
            ? {
                tone: "warning" as const,
                text:
                  locale === "fr"
                    ? "Cet email existe deja. Connecte-toi plutot."
                    : "This email is already registered. Sign in instead."
              }
            : {
                tone: "success" as const,
                text: locale === "fr" ? "Email trouve. Tu peux te connecter." : "Email found. You can sign in."
              }
          : emailCheckStatus === "missing"
            ? isRegister
              ? {
                  tone: "success" as const,
                  text: locale === "fr" ? "Email disponible pour creer un compte." : "Email is available for signup."
                }
              : {
                  tone: "warning" as const,
                  text:
                    locale === "fr"
                      ? "Aucun compte trouve avec cet email. Cree un compte."
                      : "No account found for this email. Create an account."
                }
            : {
                tone: "muted" as const,
                text:
                  locale === "fr"
                    ? "Impossible de verifier l'email maintenant."
                    : "Unable to verify this email right now."
              };

  function mapApiError(message: string | null) {
    const value = String(message || "").trim().toLowerCase();
    if (!value) {
      return locale === "fr" ? "Erreur. Reessaie dans un instant." : "Something went wrong. Try again in a moment.";
    }

    if (value.includes("invalid credentials")) {
      return locale === "fr" ? "Email ou mot de passe invalide." : "Invalid email or password.";
    }
    if (value.includes("invalid email")) {
      return locale === "fr" ? "Adresse email invalide." : "Invalid email address.";
    }
    if (value.includes("already registered")) {
      return locale === "fr"
        ? "Cet email est deja inscrit. Connecte-toi."
        : "This email is already registered. Please sign in.";
    }
    if (value.includes("too many requests")) {
      return locale === "fr"
        ? "Trop de tentatives. Reessaie dans quelques minutes."
        : "Too many attempts. Please retry in a few minutes.";
    }
    if (value.includes("forbidden")) {
      return locale === "fr"
        ? "Requete bloquee pour securite. Recharge la page puis reessaie."
        : "Request blocked for security. Refresh and try again.";
    }
    if (value.includes("service unavailable")) {
      return locale === "fr"
        ? "Service temporairement indisponible. Reessaie plus tard."
        : "Service is temporarily unavailable. Please try again later.";
    }
    if (value.includes("password")) {
      return locale === "fr"
        ? "Mot de passe invalide. Verifie les regles et reessaie."
        : "Invalid password. Check requirements and retry.";
    }

    return locale === "fr" ? "Connexion indisponible pour le moment." : "Sign-in is unavailable right now.";
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Capture the form element synchronously: React nullifies event.currentTarget
    // after the handler yields on the first await below, so reading it later throws.
    const formEl = event.currentTarget;
    setStatus("loading");
    setErrorMessage(null);
    setEmailCheckStatus("idle");
    setEmailCheckedValue("");

    const normalizedEmail = normalizeEmail(email);
    if (!isLikelyEmail(normalizedEmail) || normalizedEmail.length > 254) {
      setStatus("error");
      setErrorMessage(locale === "fr" ? "Adresse email invalide." : "Invalid email address.");
      return;
    }

    trackEvent(isRegister ? "auth_register_attempt" : "auth_login_attempt", {
      locale,
      method: useCredentials ? "credentials" : "email",
      source: `auth_${mode}_form`
    });

    if (useCredentials && isRegister && password !== confirmPassword) {
      setStatus("error");
      setSignedIn(false);
      setEmailForwarded(null);
      setDeliveryStatus(null);
      setErrorMessage(locale === "fr" ? "Les mots de passe ne correspondent pas." : "Passwords do not match.");
      return;
    }

    if (useCredentials && password.trim().length < 10) {
      setStatus("error");
      setSignedIn(false);
      setEmailForwarded(null);
      setDeliveryStatus(null);
      setErrorMessage(
        locale === "fr"
          ? "Le mot de passe doit contenir au moins 10 caracteres."
          : "Password must be at least 10 characters."
      );
      return;
    }

    if (useCredentials) {
      const emailStatus = await checkEmailExists(normalizedEmail);
      if (mode === "login" && emailStatus === "missing") {
        setStatus("error");
        setSignedIn(false);
        setEmailForwarded(null);
        setDeliveryStatus(null);
        setErrorMessage(
          locale === "fr"
            ? "Aucun compte trouve pour cet email. Cree un compte."
            : "No account found for this email. Create an account first."
        );
        return;
      }
      if (mode === "register" && emailStatus === "exists") {
        setStatus("error");
        setSignedIn(false);
        setEmailForwarded(null);
        setDeliveryStatus(null);
        setErrorMessage(
          locale === "fr"
            ? "Cet email existe deja. Connecte-toi."
            : "This email is already registered. Please sign in."
        );
        return;
      }
    }

    try {
      const formData = new FormData(formEl);
      const company = String(formData.get("company") || "");
      const botToken = String(formData.get("cf-turnstile-response") || "");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: useCredentials ? password : undefined,
          name: isRegister ? name : "",
          company,
          botToken,
          locale,
          mode,
          source: `auth_${mode}_form`
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "failed");
      }

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
      if (useCredentials) {
        setPassword("");
        setConfirmPassword("");
      }
      setEmail("");
      setEmailCheckStatus("idle");
      setEmailCheckedValue("");
      trackEvent("account_access_submit_success", { locale, mode });

      if (data.authenticated && data.redirectTo) {
        setTimeout(() => {
          router.push(data.redirectTo as string);
          router.refresh();
        }, 550);
      }
    } catch (error) {
      setStatus("error");
      setEmailForwarded(null);
      setDeliveryStatus(null);
      setSignedIn(false);
      const message = error instanceof Error && error.message ? error.message : null;
      setErrorMessage(mapApiError(message));
      trackEvent("account_access_submit_error", { locale, mode });
    }
  }

  return (
    <form className="surface rounded-2xl p-5 md:p-6" onSubmit={onSubmit} noValidate>
      <p className="do-kicker">{isRegister ? (locale === "fr" ? "Inscription" : "Account creation") : "Login"}</p>
      <h2 className="font-display mt-2 text-xl font-semibold text-[color:var(--text-strong)]">
        {isRegister
          ? locale === "fr"
            ? "Acces gratuit a AI and Cybersecurity News"
            : "Free AI and Cybersecurity News access"
          : locale === "fr"
            ? "Acces par email"
            : "Email access"}
      </h2>
      <p className="mt-2 text-sm text-[color:var(--text)]">
        {isRegister
          ? locale === "fr"
            ? useCredentials
              ? "Cree ton compte avec email et mot de passe."
              : "Entre ton email pour creer ton acces et recevoir les mises a jour."
            : useCredentials
              ? "Create your account with email and password."
              : "Enter your email to create access and receive platform updates."
          : locale === "fr"
            ? useCredentials
              ? "Entre ton email et mot de passe pour te connecter."
              : "Entre ton email pour recevoir un acces ou des instructions de connexion."
            : useCredentials
              ? "Enter your email and password to sign in."
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
              className="field-input"
              required
            />
          </label>
        )}

        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <TurnstileWidget locale={locale} />

        <label className="grid gap-1">
          <span className="text-xs text-[color:var(--muted)]">{locale === "fr" ? "Adresse email" : "Email address"}</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailCheckStatus !== "idle") {
                setEmailCheckStatus("idle");
                setEmailCheckedValue("");
              }
            }}
            onBlur={(event) => {
              void checkEmailExists(event.currentTarget.value);
            }}
            placeholder="you@school.edu"
            autoComplete="email"
            autoFocus={!isRegister}
            maxLength={254}
            className="field-input"
            required
          />
        </label>

        {emailCheckFeedback ? (
          <p
            className={
              emailCheckFeedback.tone === "success"
                ? "status-success rounded-lg px-3 py-2 text-xs"
                : emailCheckFeedback.tone === "warning"
                  ? "status-warning rounded-lg px-3 py-2 text-xs"
                  : "text-xs text-[color:var(--muted)]"
            }
            aria-live="polite"
          >
            {emailCheckFeedback.text}
          </p>
        ) : null}

        {useCredentials ? (
          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--muted)]">{locale === "fr" ? "Mot de passe" : "Password"}</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={locale === "fr" ? "Min 10 caracteres" : "Min 10 characters"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={10}
                maxLength={128}
                className="field-input pr-20"
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-[color:var(--border)] px-2 py-1 text-[11px] font-semibold text-[color:var(--muted)] hover:text-[color:var(--text-strong)]"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? (locale === "fr" ? "Masquer" : "Hide") : (locale === "fr" ? "Afficher" : "Show")}
              >
                {showPassword ? (locale === "fr" ? "Masquer" : "Hide") : (locale === "fr" ? "Afficher" : "Show")}
              </button>
            </div>
          </label>
        ) : null}

        {useCredentials && isRegister ? (
          <label className="grid gap-1">
            <span className="text-xs text-[color:var(--muted)]">
              {locale === "fr" ? "Confirmer le mot de passe" : "Confirm password"}
            </span>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={locale === "fr" ? "Confirme ton mot de passe" : "Confirm your password"}
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                className="field-input pr-20"
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-[color:var(--border)] px-2 py-1 text-[11px] font-semibold text-[color:var(--muted)] hover:text-[color:var(--text-strong)]"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? (locale === "fr" ? "Masquer" : "Hide") : (locale === "fr" ? "Afficher" : "Show")}
              >
                {showConfirmPassword ? (locale === "fr" ? "Masquer" : "Hide") : (locale === "fr" ? "Afficher" : "Show")}
              </button>
            </div>
          </label>
        ) : null}

        {useCredentials ? (
          <p className="text-xs text-[color:var(--muted)]">
            {locale === "fr"
              ? "Utilise au moins 10 caracteres avec lettres et chiffres."
              : "Use at least 10 characters with letters and numbers."}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary h-11 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? loadingLabel : submitLabel}
        </button>
      </div>

      {status === "success" && (
        <div className="status-success mt-3 rounded-lg px-3 py-2 text-xs" aria-live="polite">
          <p>
            {useCredentials
              ? locale === "fr"
                ? "Connexion reussie. Redirection vers ton compte..."
                : "Signed in successfully. Redirecting to your account..."
              : signedIn
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
          {signedIn && emailForwarded && !useCredentials ? (
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
          {errorMessage
            ? errorMessage
            : locale === "fr"
              ? "Erreur. Reessaie dans un instant."
              : "Something went wrong. Try again."}
        </p>
      )}

      <p className="mt-3 text-xs text-[color:var(--muted)]">
        {useCredentials
          ? locale === "fr"
            ? "Mot de passe chiffre et session securisee. Deconnexion a tout moment."
            : "Encrypted password and secure session. Log out any time."
          : locale === "fr"
            ? "Acces securise. Tu peux te deconnecter a tout moment."
            : "Secure access. You can log out any time."}
      </p>
    </form>
  );
}
