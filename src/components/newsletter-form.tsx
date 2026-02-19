"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { trackEvent } from "@/lib/track";

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

export function NewsletterForm({ compact = false, locale, ctaLabel, source }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [emailForwarded, setEmailForwarded] = useState<boolean | null>(null);
  const sourceTag = normalizeSource(source, compact);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    try {
      const formData = new FormData(event.currentTarget);
      const company = String(formData.get("company") || "");

      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          company,
          locale,
          source: sourceTag
        })
      });

      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { forwarded?: boolean };

      setStatus("success");
      setEmailForwarded(Boolean(data.forwarded));
      setEmail("");
      setName("");
      trackEvent("newsletter_submit_success", {
        locale,
        source: sourceTag
      });
    } catch {
      setStatus("error");
      setEmailForwarded(null);
      trackEvent("newsletter_submit_error", {
        locale,
        source: sourceTag
      });
    }
  }

  const formClass = compact ? "mt-4 grid grid-cols-[1fr_auto] gap-2" : "mt-6 grid gap-3 sm:grid-cols-3";
  const emailClass = compact
    ? "h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-3 text-sm text-[color:var(--text)] outline-none ring-cyan-300/40 placeholder:text-[color:var(--muted)] focus:ring"
    : "w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-3 py-2 text-sm text-[color:var(--text)] outline-none ring-cyan-300/40 placeholder:text-[color:var(--muted)] focus:ring";
  const buttonClass = compact
    ? "btn-primary h-11 px-4 py-0 text-sm"
    : "rounded-lg bg-[color:var(--primary)] px-4 py-3 text-sm font-semibold text-[color:var(--primary-foreground)] transition opacity-95 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-70";
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
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-soft)] px-4 py-3 text-sm text-[color:var(--text)] outline-none ring-cyan-300/40 placeholder:text-[color:var(--muted)] focus:ring"
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
      {status === "success" && (
        <p className={`status-success ${statusColumnClass} rounded-lg px-3 py-2 text-xs`} aria-live="polite">
          {emailForwarded
            ? locale === "fr"
              ? "Parfait. Verifie ta boite mail."
              : "Great. Check your inbox."
            : locale === "fr"
              ? "Inscription enregistree. Livraison email non active pour le moment."
              : "Signup saved. Email delivery is not active yet."}
        </p>
      )}
      {status === "error" && (
        <p className={`status-error ${statusColumnClass} rounded-lg px-3 py-2 text-xs`} aria-live="polite">
          {locale === "fr" ? "Erreur. Reessaie dans un instant." : "Something went wrong. Try again."}
        </p>
      )}
    </form>
  );
}
