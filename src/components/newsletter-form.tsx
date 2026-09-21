"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { trackEvent } from "@/lib/track";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

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
    return {
      href: `/${locale}/product/ai-career-guide`,
      label: locale === "fr" ? "Voir le guide carrière" : "Open the career guide"
    };
  }

  if (source.includes("blog") || source.includes("post")) {
    return {
      href: `/${locale}/compare`,
      label: locale === "fr" ? "Ouvrir le lab outils" : "Open tools lab"
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
  // The route distinguishes 400, 403, 429 and 503, and every one of them
  // arrived here as the same sentence because the fetch threw away the status.
  // "Too many requests" in particular told the reader to try again, which is
  // the one thing that cannot work — the limit counts the retries too.
  const [errorKind, setErrorKind] = useState<"rate_limit" | "generic">("generic");
  const [deliveryStatus, setDeliveryStatus] = useState<"sent" | "queued" | "failed" | "unavailable" | null>(null);
  const sourceTag = normalizeSource(source, compact);
  const nextAction = getNextAction(sourceTag, locale);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorKind("generic");

    try {
      const formData = new FormData(event.currentTarget);
      const company = String(formData.get("company") || "");
      const botToken = String(formData.get("cf-turnstile-response") || "");

      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          company,
          botToken,
          locale,
          source: sourceTag
        })
      });

      if (!response.ok) {
        setErrorKind(response.status === 429 ? "rate_limit" : "generic");
        throw new Error("failed");
      }
      const data = (await response.json()) as {
        forwarded?: boolean;
        deliveryStatus?: "sent" | "queued" | "failed" | "unavailable";
      };

      setStatus("success");
      setDeliveryStatus(data.deliveryStatus || (data.forwarded ? "sent" : "queued"));
      setEmail("");
      setName("");
      trackEvent("newsletter_submit_success", {
        locale,
        source: sourceTag
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
            onChange={(event) => setName(event.target.value)}
            placeholder={locale === "fr" ? "Prénom" : "First name"}
            autoComplete="given-name"
            maxLength={80}
            className="field-input"
          />
        </>
      )}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <div className={compact ? "col-span-2" : "sm:col-span-3"}>
        <TurnstileWidget locale={locale} />
      </div>
      <label htmlFor={emailId} className="sr-only">
        {locale === "fr" ? "Adresse email" : "Email address"}
      </label>
      <input
        id={emailId}
        type="email"
        name="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={compact ? "you@school.edu" : "Email address"}
        autoComplete="email"
        maxLength={254}
        className={emailClass}
        required
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className={buttonClass}
      >
        {status === "loading" ? (locale === "fr" ? "Envoi..." : "Sending...") : ctaLabel}
      </button>
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
