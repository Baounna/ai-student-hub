"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { recognizeCampus } from "@/lib/campus";
import { trackEvent } from "@/lib/track";
import { TurnstileWidget, botProtectionEnabled } from "@/components/ui/turnstile-widget";

type CampusFormProps = {
  locale: Locale;
};

/**
 * The campus signup.
 *
 * Deliberately a separate component from NewsletterForm rather than another
 * prop on it. That form is already carrying a honeypot, four error kinds, a
 * lazily armed challenge and a per-source "next action" router; the flow here
 * differs in the one way that matters -- it reads the address as the reader
 * types and names their institution back to them -- and threading that through
 * the other form's branches would make both harder to follow.
 *
 * Recognition happens twice on purpose. Here, instantly, so the reader can see
 * their faculty appear and knows the address was understood before they commit;
 * and again on the server, which is the one that decides the tag. The server's
 * answer is what the success message repeats.
 */
export function CampusForm({ locale }: CampusFormProps) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [deliveryStatus, setDeliveryStatus] = useState<"sent" | "failed" | "unavailable" | null>(null);
  const [errorKind, setErrorKind] = useState<"rate_limit" | "needs_verification" | "generic">("generic");
  const [botToken, setBotToken] = useState("");
  const [armed, setArmed] = useState(false);
  const [verificationUnavailable, setVerificationUnavailable] = useState(false);

  /**
   * Only once the address looks finished.
   *
   * Recognising on every keystroke means "Établissement non reconnu" flashes up
   * while someone is still halfway through typing `uit.ac.ma`, which reads as a
   * rejection of an address they have not finished entering. An `@` and a dot
   * after it is the cheapest test for "there is a domain here to judge".
   */
  const match = useMemo(() => {
    const at = email.lastIndexOf("@");
    if (at < 0 || !email.slice(at + 1).includes(".")) return null;
    return recognizeCampus(email);
  }, [email]);

  const recognised = match !== null && match.kind !== "other";

  function clearStaleResult() {
    setStatus((current) => (current === "success" || current === "error" ? "idle" : current));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorKind("generic");

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          company: String(formData.get("referral_note") || ""),
          botToken,
          locale,
          source: "campus"
        })
      });

      if (!response.ok) {
        setErrorKind(
          response.status === 429 ? "rate_limit" : response.status === 403 ? "needs_verification" : "generic"
        );
        throw new Error("failed");
      }

      const data = (await response.json()) as {
        deliveryStatus?: "sent" | "failed" | "unavailable";
        forwarded?: boolean;
      };
      // Fails closed, exactly as the newsletter form does: an unknown outcome
      // is not a subscription, and saying it is would be the one error a reader
      // has no reason to come back and correct.
      const delivery = data.deliveryStatus || (data.forwarded ? "sent" : "failed");

      setStatus("success");
      setDeliveryStatus(delivery);
      if (delivery === "sent") setEmail("");
      trackEvent(delivery === "sent" ? "campus_submit_success" : "campus_submit_error", {
        locale,
        delivery,
        // The institution, never the address.
        campus: match && match.kind !== "other" ? match.slug : "none"
      });
    } catch {
      setStatus("error");
      setDeliveryStatus(null);
      trackEvent("campus_submit_error", { locale });
    }
  }

  const canSubmit = !botProtectionEnabled || Boolean(botToken);
  const showWarning = status === "success" && deliveryStatus !== "sent";
  const showSuccess = status === "success" && deliveryStatus === "sent";

  const warningText =
    deliveryStatus === "failed"
      ? locale === "fr"
        ? "L'inscription n'a pas abouti et votre adresse n'a pas été enregistrée. Réessayez dans un instant."
        : "The signup did not go through and your address was not saved. Please try again in a moment."
      : locale === "fr"
        ? "Les envois ne sont pas encore ouverts. Votre adresse n'a pas été enregistrée."
        : "Sending is not open yet, so your address was not saved.";

  const successText =
    locale === "fr"
      ? "C'est fait. Vous recevrez les nouvelles offres de stage par email."
      : "Done. You will receive new internship listings by email.";

  const errorText =
    errorKind === "rate_limit"
      ? locale === "fr"
        ? "Trop de tentatives. Attendez une dizaine de minutes avant de réessayer."
        : "Too many attempts. Wait about ten minutes before trying again."
      : errorKind === "needs_verification"
        ? locale === "fr"
          ? "Vérification incomplète. Cochez la case « Je ne suis pas un robot », puis renvoyez."
          : "Verification incomplete. Tick the human-verification box, then send again."
        : locale === "fr"
          ? "Erreur. Réessayez dans un instant."
          : "Something went wrong. Try again.";

  /**
   * What the reader is told about the address they have typed.
   *
   * The unrecognised case is worded as a statement about the list, not about
   * them -- the address is not "invalid", it is one this site cannot place --
   * and it still offers the subscription, because the general digest is open to
   * anyone and refusing them here would gain nothing.
   */
  const recognitionText = !match
    ? ""
    : match.kind === "named"
      ? locale === "fr"
        ? `Reconnu : ${match.name}, ${match.city}.`
        : `Recognised: ${match.name}, ${match.city}.`
      : match.kind === "academic"
        ? locale === "fr"
          ? `Adresse universitaire reconnue : ${match.domain}.`
          : `University address recognised: ${match.domain}.`
        : locale === "fr"
          ? "Cette adresse n'est pas celle d'un établissement que nous connaissons. Vous pouvez quand même vous inscrire : la lettre est ouverte à tous."
          : "This is not an address we can place at an institution. You can still subscribe: the digest is open to everyone.";

  const liveMessage = showWarning
    ? warningText
    : showSuccess
      ? successText
      : status === "error"
        ? errorText
        : recognitionText;

  return (
    <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <label htmlFor={emailId} className="sr-only">
          {locale === "fr" ? "Adresse email universitaire" : "University email address"}
        </label>
        <input
          id={emailId}
          type="email"
          name="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearStaleResult();
            setArmed(true);
          }}
          onFocus={() => setArmed(true)}
          onTouchStart={() => setArmed(true)}
          placeholder={locale === "fr" ? "prenom.nom@uit.ac.ma" : "name.surname@uit.ac.ma"}
          autoComplete="email"
          maxLength={254}
          className="field-input"
          required
        />
        <button type="submit" disabled={status === "loading" || !canSubmit} className="btn-primary h-11 px-4 py-0 text-sm">
          {status === "loading"
            ? locale === "fr"
              ? "Envoi..."
              : "Sending..."
            : locale === "fr"
              ? "Recevoir les offres"
              : "Get the listings"}
        </button>
      </div>

      {/* Same honeypot and the same reason as the newsletter form: a name no
          autofill heuristic recognises, with both documented manager opt-outs. */}
      <input
        type="text"
        name="referral_note"
        tabIndex={-1}
        autoComplete="off"
        data-lpignore="true"
        data-1p-ignore=""
        className="hidden"
        aria-hidden
      />

      {recognitionText && status === "idle" ? (
        <p className={`text-xs ${recognised ? "text-[color:var(--text-strong)]" : "text-[color:var(--muted)]"}`}>
          {recognitionText}
        </p>
      ) : null}

      {botProtectionEnabled && !armed ? (
        <p className="text-xs text-[color:var(--muted)]">
          {locale === "fr"
            ? "Une vérification anti-robot apparaît dès que vous saisissez votre adresse."
            : "A quick human check appears as soon as you start entering your address."}
        </p>
      ) : null}

      {botProtectionEnabled && armed ? (
        <div className="min-w-0">
          <TurnstileWidget
            locale={locale}
            onToken={(token) => {
              setBotToken(token);
              if (token) setVerificationUnavailable(false);
            }}
            onUnavailable={() => setVerificationUnavailable(true)}
          />
          {verificationUnavailable ? (
            <p className="mt-1 text-xs text-[color:var(--muted)]">
              {locale === "fr"
                ? "La vérification anti-robot n'a pas pu se charger. Désactivez votre bloqueur de publicités pour ce site, ou essayez un autre navigateur."
                : "The human-verification step could not load. Disable your ad blocker for this site, or try another browser."}
            </p>
          ) : !botToken ? (
            <p className="mt-1 text-xs text-[color:var(--muted)]">
              {locale === "fr" ? "Cochez la case ci-dessus pour activer le bouton." : "Tick the box above to enable the button."}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* One live region, in the DOM from first render, for the same reason the
          newsletter form has one: a region inserted at the same moment as its
          text is not reliably announced. */}
      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>

      {showWarning ? <p className="status-warning rounded-lg px-3 py-2 text-xs">{warningText}</p> : null}
      {showSuccess ? <p className="status-success rounded-lg px-3 py-2 text-xs">{successText}</p> : null}
      {status === "error" ? <p className="status-error rounded-lg px-3 py-2 text-xs">{errorText}</p> : null}
    </form>
  );
}
