"use client";

import Script from "next/script";

const botProtectionMode = (process.env.NEXT_PUBLIC_BOT_PROTECTION_MODE || "").trim().toLowerCase();
const turnstileSiteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();

type TurnstileWidgetProps = {
  locale: "en" | "fr";
};

export function TurnstileWidget({ locale }: TurnstileWidgetProps) {
  if (botProtectionMode !== "turnstile" || !turnstileSiteKey) return null;

  return (
    <div className="mt-2">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="auto" data-language={locale} />
    </div>
  );
}

