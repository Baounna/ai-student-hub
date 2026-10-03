"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import type { Locale } from "@/i18n/config";

const botProtectionMode = (process.env.NEXT_PUBLIC_BOT_PROTECTION_MODE || "").trim().toLowerCase();
const turnstileSiteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();

export const botProtectionEnabled = botProtectionMode === "turnstile" && Boolean(turnstileSiteKey);

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: Record<string, unknown>
  ) => string | undefined;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileWidgetProps = {
  locale: Locale;
  /**
   * The footer and sidebar forms sit in a narrow card.
   *
   * Turnstile's default widget is a fixed ~300px box. In the compact newsletter
   * card that is wider than its own container, so the Cloudflare panel hung out
   * past the card's right edge -- visible on the live site. "compact" is 150px
   * wide and fits; the full-width form keeps the normal one.
   */
  compact?: boolean;
  /** Called with the token when the challenge passes, and with "" when it expires or fails. */
  onToken: (token: string) => void;
  /**
   * Called when the challenge cannot be shown at all -- blocked by an
   * extension, refused for this hostname, or Cloudflare unreachable.
   *
   * Without this the form has a button that is disabled forever and no reason
   * given: the token never arrives, so the gate never opens, so the reader
   * cannot subscribe and cannot find out why. Verified locally, where Turnstile
   * declines to render because localhost is not on the widget's hostname list
   * -- window.turnstile loads, render() produces nothing, and the page sits
   * there.
   */
  onUnavailable: () => void;
};

/**
 * Renders the challenge AND reports its result.
 *
 * The first version of this dropped a bare `.cf-turnstile` div on the page and
 * let Cloudflare auto-render it. That put a real, interactive "Verify you are
 * human" checkbox on the form while the submit button stayed enabled and the
 * form read the token out of FormData -- which is empty until somebody ticks
 * the box. So a reader who filled in their address and pressed Subscribe got
 * HTTP 403 and the words "Something went wrong. Try again.", which is the one
 * piece of advice that cannot work: retrying without ticking the box fails
 * every time. Measured on the live site before this change: the hidden input
 * was still empty after 25 seconds.
 *
 * Explicit render, so the callbacks exist and the form can gate on them.
 */
export function TurnstileWidget({ locale, compact = false, onToken, onUnavailable }: TurnstileWidgetProps) {
  const holder = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | undefined>(undefined);
  // Kept in a ref so the render effect below does not re-run (and re-create the
  // Cloudflare iframe) every time the parent passes a new closure.
  const report = useRef(onToken);
  const reportUnavailable = useRef(onUnavailable);
  useEffect(() => {
    report.current = onToken;
    reportUnavailable.current = onUnavailable;
  }, [onToken, onUnavailable]);

  useEffect(() => {
    if (!botProtectionEnabled) return;
    let cancelled = false;

    // The script tag below is async, so poll briefly for the global rather than
    // racing it. Cloudflare's api.js defines window.turnstile on load.
    // ~10 seconds of polling. Past that, the challenge is not coming.
    let attempts = 0;
    const timer = window.setInterval(() => {
      if (cancelled || widgetId.current) return;
      attempts += 1;
      if (attempts > 66) {
        window.clearInterval(timer);
        reportUnavailable.current();
        return;
      }
      if (!holder.current || !window.turnstile) return;
      window.clearInterval(timer);
      try {
        widgetId.current = window.turnstile.render(holder.current, {
          sitekey: turnstileSiteKey,
          theme: "auto",
          language: locale,
          size: compact ? "compact" : "flexible",
          callback: (token: string) => report.current(token),
          // A token is good for 300 seconds. Someone who fills the form slowly
          // must not be left holding an expired one and told to try again.
          "expired-callback": () => report.current(""),
          "timeout-callback": () => report.current(""),
          // error-callback is how Cloudflare reports a challenge that cannot
          // run at all -- wrong hostname, blocked network, bad key. render()
          // still returns a widget id in that case, so this is the only signal
          // there is. Distinct from expired/timeout above, which are recoverable
          // and simply need the reader to tick the box again.
          "error-callback": () => {
            report.current("");
            reportUnavailable.current();
          }
        });
        if (!widgetId.current) reportUnavailable.current();
      } catch {
        // render() throws for an unlisted hostname, among other things.
        reportUnavailable.current();
      }
    }, 150);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      const id = widgetId.current;
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          // Already gone; nothing to clean up.
        }
        widgetId.current = undefined;
      }
    };
  }, [locale, compact]);

  if (!botProtectionEnabled) return null;

  return (
    // max-w-full and the overflow guard are deliberate: the widget's size is
    // decided by Cloudflare's own iframe, so the container has to be the thing
    // that refuses to be pushed wider than the card it sits in.
    <div className="mt-2 max-w-full overflow-hidden">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div ref={holder} className="max-w-full" />
    </div>
  );
}
