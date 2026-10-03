"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { trackEvent } from "@/lib/track";
import { TurnstileWidget, botProtectionEnabled } from "@/components/ui/turnstile-widget";
import { getGuideCtaHref, getGuideCtaLabel } from "@/lib/product";

type NewsletterFormProps = {
  compact?: boolean;
  locale: Locale;
  ctaLabel: string;
  source?: string;
};

function normalizeSource(source: string | undefined, compact: boolean) {
  const fallback = compact ? "footer" : "section";
  const candidate = (source || fallback).trim().toLowerCase();
  return candidate.replace(/[^a-z0-9_-]/g, "-") || fallback;
}

function getNextAction(source: string, locale: Locale) {
  if (source.includes("product")) {
    // Subscribing on the product page used to send the reader back to the
    // product page -- and that page says the guide does not exist, so the
    // next action after signing up was to revisit the thing that has nothing.
    return { href: getGuideCtaHref(locale), label: getGuideCtaLabel(locale) };
  }

  if (source.includes("blog") || source.includes("post")) {
    return {
      href: `/${locale}/compare`,
      label: locale === "fr" ? "Ouvrir le labo outils" : "Open tools lab"
    };
  }

  if (source.includes("tools") || source.includes("compare")) {
    return {
      href: `/${locale}/resources`,
      label: locale === "fr" ? "Voir les ressources" : "See resources"
    };
  }

  return {
    href: `/${locale}/blog`,
    label: locale === "fr" ? "Lire les guides" : "Read guides"
  };
}

export function NewsletterForm({ compact = false, locale, ctaLabel, source }: NewsletterFormProps) {
  // Both fields used to carry only a placeholder. A placeholder is not an
  // accessible name: it disappears on the first keystroke and screen readers
  // may not announce it at all, so the field is read as "edit text" (WCAG
  // 1.3.1 and 3.3.2). The rest of the site pairs an input with an sr-only
  // <label htmlFor>, so this form does the same rather than inventing a
  // second pattern.
  const nameId = useId();
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  /**
   * Clear a finished result as soon as the reader types again.
   *
   * status only reset inside onSubmit, which the browser never reaches when
   * native validation blocks the submit. So after one successful signup, typing
   * a second, malformed address and pressing Join left "Great. Check your inbox."
   * on screen with the invalid address still in the field and no request sent --
   * readable as confirmation of an address that was never submitted.
   */
  function clearStaleResult() {
    setStatus((current) => (current === "success" || current === "error" ? "idle" : current));
  }
  // The route distinguishes 400, 403, 429 and 503, and every one of them
  // arrived here as the same sentence because the fetch threw away the status.
  // "Too many requests" in particular told the reader to try again, which is
  // the one thing that cannot work — the limit counts the retries too.
  const [errorKind, setErrorKind] = useState<"rate_limit" | "generic" | "needs_verification">("generic");
  /**
   * The challenge token, held here rather than read from FormData.
   *
   * FormData only carries cf-turnstile-response once the reader has passed the
   * challenge, and the submit button was never gated on it -- so pressing
   * Subscribe before ticking the box sent an empty token, got 403, and printed
   * "Something went wrong. Try again." Retrying without ticking the box fails
   * every single time, so the one instruction the reader was given could not
   * work. Measured on the live site: the hidden input was still empty 25
   * seconds after load.
   */
  const [botToken, setBotToken] = useState("");
  /**
   * True when the challenge could not be shown at all.
   *
   * Gating the button on a token is right only while the challenge can appear.
   * Blocked by an extension, or refused for the hostname, no token ever comes
   * and the reader is left with a dead button and no explanation. Submitting
   * would fail at the server anyway, so the button stays disabled -- but it now
   * says why, which is the difference between a broken form and a closed one.
   */
  const [verificationUnavailable, setVerificationUnavailable] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<"sent" | "queued" | "failed" | "unavailable" | null>(null);
  const sourceTag = normalizeSource(source, compact);
  const nextAction = getNextAction(sourceTag, locale);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorKind("generic");

    try {
      const formData = new FormData(event.currentTarget);
      const referralNote = String(formData.get("referral_note") || "");

      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          company: referralNote,
          botToken,
          locale,
          source: sourceTag
        })
      });

      if (!response.ok) {
        // 403 here is almost always a missing or expired challenge token, and
        // "try again" is the wrong thing to tell someone in that state.
        setErrorKind(
          response.status === 429 ? "rate_limit" : response.status === 403 ? "needs_verification" : "generic"
        );
        throw new Error("failed");
      }
      const data = (await response.json()) as {
        forwarded?: boolean;
        deliveryStatus?: "sent" | "queued" | "failed" | "unavailable";
      };

      // The HTTP request succeeding and the reader being subscribed are two
      // different things: the provider can refuse the address after we have
      // already got a 200 back. The warning below reads deliveryStatus and says
      // so, but this event did not, so every rejected signup was counted as a
      // successful one. With an invalid API key that is 100% of them -- and the
      // one dashboard that would show the key was broken reported the opposite.
      const delivery = data.deliveryStatus || (data.forwarded ? "sent" : "queued");
      const subscribed = delivery === "sent" || delivery === "queued";

      setStatus("success");
      setDeliveryStatus(delivery);
      if (subscribed) {
        setEmail("");
        setName("");
      }
      trackEvent(subscribed ? "newsletter_submit_success" : "newsletter_submit_error", {
        locale,
        source: sourceTag,
        delivery
      });
    } catch {
      setStatus("error");
      setDeliveryStatus(null);
      trackEvent("newsletter_submit_error", {
        locale,
        source: sourceTag
      });
    }
  }

  // Nothing to gate on when bot protection is off, which is how the form
  // behaves everywhere it is not configured.
  const canSubmit = !botProtectionEnabled || Boolean(botToken);

  const formClass = compact ? "mt-4 grid grid-cols-[1fr_auto] gap-2" : "mt-6 grid gap-3 sm:grid-cols-3";
  const emailClass = compact ? "field-input px-3" : "field-input";
  const buttonClass = compact
    ? "btn-primary h-11 px-4 py-0 text-sm"
    : "btn-primary h-11 px-4 py-0 text-sm disabled:cursor-not-allowed disabled:opacity-70";
  const statusColumnClass = compact ? "col-span-2" : "sm:col-span-3";

  const showWarning = status === "success" && (deliveryStatus === "unavailable" || deliveryStatus === "failed");
  const showSuccess = status === "success" && !showWarning;

  const warningText =
    deliveryStatus === "failed"
      ? locale === "fr"
        ? "L'inscription n'a pas abouti et votre adresse n'a pas été enregistrée. Réessayez dans un instant."
        : "The signup did not go through and your address was not saved. Please try again in a moment."
      : locale === "fr"
        ? "La newsletter n'est pas encore ouverte aux inscriptions. Votre adresse n'a pas été enregistrée."
        : "The newsletter is not open for signups yet, so your address was not saved.";

  const successText =
    deliveryStatus === "sent"
      ? locale === "fr"
        ? "Parfait. Vérifiez votre boîte mail."
        : "Great. Check your inbox."
      : locale === "fr"
        ? "Inscription enregistrée. Vous recevrez les prochaines mises à jour."
        : "Signup saved. You will receive upcoming updates.";

  // vous, like every other French string in this form.
  const errorText =
    errorKind === "rate_limit"
      ? locale === "fr"
        ? "Trop de tentatives. Attendez une dizaine de minutes avant de réessayer."
        : "Too many attempts. Wait about ten minutes before trying again."
      : // A 403 means the challenge was not passed or has expired. Telling that
        // reader to "try again" sends them round a loop that cannot end.
        errorKind === "needs_verification"
        ? locale === "fr"
          ? "Vérification incomplète. Cochez la case « Je ne suis pas un robot », puis renvoyez."
          : "Verification incomplete. Tick the human-verification box, then send again."
        : locale === "fr"
          ? "Erreur. Réessayez dans un instant."
          : "Something went wrong. Try again.";

  const liveMessage = showWarning ? warningText : showSuccess ? successText : status === "error" ? errorText : "";

  return (
    <form className={formClass} onSubmit={onSubmit}>
      {!compact && (
        <>
          {/* sr-only is position:absolute, so the label is out of flow and is
              not placed as a grid cell - the column layout is unchanged. */}
          <label htmlFor={nameId} className="sr-only">
            {locale === "fr" ? "Prénom" : "First name"}
          </label>
          <input
            id={nameId}
            type="text"
            name="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearStaleResult();
            }}
            placeholder={locale === "fr" ? "Prénom" : "First name"}
            autoComplete="given-name"
            maxLength={80}
            className="field-input"
          />
        </>
      )}
      {/* A honeypot, and it must keep answering a bot with a plain success --
          telling one it was caught just teaches it to stop filling the field.
          The cost of that is that a human who trips it is told they subscribed
          when the address was discarded, so the field has to be one a human
          never fills.

          It was named "company", which is an autofill category: browsers and
          password managers fill organization fields on sight, autoComplete="off"
          is widely ignored by managers, and display:none does not stop them. So
          a reader with a password manager could be silently dropped. The name is
          now one no autofill heuristic recognises, and the two documented
          manager opt-outs are set. A bot filling every input still trips it. */}
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
      <label htmlFor={emailId} className="sr-only">
        {locale === "fr" ? "Adresse email" : "Email address"}
      </label>
      <input
        id={emailId}
        type="email"
        name="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          clearStaleResult();
        }}
        placeholder={
          compact ? "you@school.edu" : locale === "fr" ? "Adresse email" : "Email address"
        }
        autoComplete="email"
        maxLength={254}
        className={emailClass}
        required
      />
      <button
        type="submit"
        disabled={status === "loading" || !canSubmit}
        className={buttonClass}
      >
        {status === "loading" ? (locale === "fr" ? "Envoi..." : "Sending...") : ctaLabel}
      </button>
      {/* Below the email field and above the button, which is the order the
          reader moves in. It used to render first, so on the full-width form
          the checkbox sat off-screen behind someone who had scrolled to the
          email box. */}
      {botProtectionEnabled ? (
        <div className={`min-w-0 ${compact ? "col-span-2" : "sm:col-span-3"}`}>
          <TurnstileWidget
            locale={locale}
            compact={compact}
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
              {locale === "fr"
                ? "Cochez la case ci-dessus pour activer le bouton."
                : "Tick the box above to enable the button."}
            </p>
          ) : null}
        </div>
      ) : null}
      {/* The one live region, always in the DOM. Each status box below used to
          carry aria-live itself, but a live region that is inserted at the same
          moment as its text is not reliably announced: the screen reader has to
          be observing the region before the change happens, and these did not
          exist until the moment they had something to say. So the submit result
          — including "your address was not saved" — was silently dropped for
          anyone not watching the screen. This node ships empty on first render
          and only its text changes. sr-only is position:absolute, so it claims
          no grid cell and the layout is untouched. */}
      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>
      {/* "failed" joins "unavailable" here rather than in the success box below.
          It used to render green, saying "Signup saved. Retry later to receive
          the confirmation email." Nothing was saved — there is no queue and no
          fallback store, so the address was gone. Telling someone their signup
          worked when it did not is worse than an error, because they have no
          reason to try again. */}
      {showWarning && (
        <div className={`status-warning ${statusColumnClass} rounded-lg px-3 py-2 text-xs`}>
          <p>{warningText}</p>
          <a href={nextAction.href} className="do-link mt-1 inline-block">
            {locale === "fr" ? "En attendant:" : "In the meantime:"} {nextAction.label}
          </a>
        </div>
      )}
      {showSuccess && (
        <div className={`status-success ${statusColumnClass} rounded-lg px-3 py-2 text-xs`}>
          <p>{successText}</p>
          <a href={nextAction.href} className="do-link mt-1 inline-block">
            {locale === "fr" ? "Prochaine action:" : "Next action:"} {nextAction.label}
          </a>
        </div>
      )}
      {status === "error" && (
        <p className={`status-error ${statusColumnClass} rounded-lg px-3 py-2 text-xs`}>{errorText}</p>
      )}
    </form>
  );
}
