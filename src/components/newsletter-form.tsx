"use client";

import { useState } from "react";
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
      label: locale === "fr" ? "Voir la roadmap execution" : "Open execution roadmap"
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
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [deliveryStatus, setDeliveryStatus] = useState<"sent" | "queued" | "failed" | "unavailable" | null>(null);
  const sourceTag = normalizeSource(source, compact);
  const nextAction = getNextAction(sourceTag, locale);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

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

      if (!response.ok) throw new Error("failed");
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

  return (
    <form className={formClass} onSubmit={onSubmit}>
      {!compact && (
        <input
          type="text"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={locale === "fr" ? "Prenom" : "First name"}
          autoComplete="given-name"
          maxLength={80}
          className="field-input"
        />
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
      <input
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
      {status === "success" && deliveryStatus === "unavailable" && (
        <div className={`status-warning ${statusColumnClass} rounded-lg px-3 py-2 text-xs`} aria-live="polite">
          <p>
            {locale === "fr"
              ? "La newsletter n'est pas encore ouverte aux inscriptions. Ton adresse n'a pas ete enregistree."
              : "The newsletter is not open for signups yet, so your address was not saved."}
          </p>
          <a href={nextAction.href} className="do-link mt-1 inline-block">
            {locale === "fr" ? "En attendant:" : "In the meantime:"} {nextAction.label}
          </a>
        </div>
      )}
      {status === "success" && deliveryStatus !== "unavailable" && (
        <div className={`status-success ${statusColumnClass} rounded-lg px-3 py-2 text-xs`} aria-live="polite">
          <p>
            {deliveryStatus === "sent"
              ? locale === "fr"
                ? "Parfait. Verifie ta boite mail."
                : "Great. Check your inbox."
              : deliveryStatus === "failed"
                ? locale === "fr"
                  ? "Inscription enregistree. Reessaie plus tard pour recevoir l'email de confirmation."
                  : "Signup saved. Retry later to receive the confirmation email."
              : locale === "fr"
                ? "Inscription enregistree. Tu recevras les prochaines mises a jour."
                : "Signup saved. You will receive upcoming updates."}
          </p>
          <a href={nextAction.href} className="do-link mt-1 inline-block">
            {locale === "fr" ? "Prochaine action:" : "Next action:"} {nextAction.label}
          </a>
        </div>
      )}
      {status === "error" && (
        <p className={`status-error ${statusColumnClass} rounded-lg px-3 py-2 text-xs`} aria-live="polite">
          {locale === "fr" ? "Erreur. Reessaie dans un instant." : "Something went wrong. Try again."}
        </p>
      )}
    </form>
  );
}
