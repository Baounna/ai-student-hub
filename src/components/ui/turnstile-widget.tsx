"use client";

import { useEffect, useRef, useState } from "react";
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
  /**
   * Tracks the reader's theme so the widget can be rebuilt when they switch.
   *
   * Reading data-theme once at render fixes the first paint and leaves a white
   * panel behind the moment someone uses the theme toggle -- the same bug, one
   * interaction later. Cloudflare gives no way to recolour a live widget, so it
   * is removed and rendered again, which is cheap and happens only on an
   * explicit toggle.
   */
  const [siteTheme, setSiteTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const read = () =>
      setSiteTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

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
    // A theme change re-runs this effect; the cleanup below removes the old
    // widget, and widgetId must be clear so a new one is created.
    widgetId.current = undefined;

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
          /*
           * The site's theme, not the operating system's.
           *
           * "auto" makes Cloudflare resolve the theme from
           * prefers-color-scheme, and this site's theme is a data-theme
           * attribute the reader chooses. So a reader on the dark site with a
           * light OS got a bright white Cloudflare panel inside a dark footer
           * card, on every page. Verified by A/B on one URL with data-theme
           * fixed to dark and only the OS setting changed: white in one arm,
           * dark in the other.
           */
          theme: siteTheme,
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
  }, [locale, compact, siteTheme]);

  if (!botProtectionEnabled) return null;

  return (
    /*
     * min-w-0 is the load-bearing class here, not overflow-hidden.
     *
     * Turnstile's widget has an intrinsic minimum width -- 300px for the normal
     * size, 150px compact -- and a grid item defaults to min-width:auto, so that
     * floor propagates outward and makes the whole column at least that wide.
     * overflow-hidden clipped the paint and left the measurement, so the form
     * stayed 34px wider than its card at 360 and 390: the email field, the
     * Subscribe button and the widget were all sliced by the card's rounded
     * edge, and every news brief gained 20px of horizontal page overflow that
     * body{overflow-x:hidden} then made unreachable rather than scrollable.
     *
     * min-w-0 lets the cell be narrower than its content, so the grid sizes to
     * the card and the clip applies only to the widget itself.
     */
    <div className="mt-2 min-w-0 max-w-full overflow-hidden">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div ref={holder} className="min-w-0 max-w-full" />
    </div>
  );
}
