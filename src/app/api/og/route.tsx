import { ImageResponse } from "next/og";
import { sanitizeTextInput } from "@/lib/input";
import { isKnownOgTitle } from "@/lib/og-titles";
import { siteConfig } from "@/config/site";
import { imageFonts } from "@/assets/fonts";
import { renderImage } from "@/lib/image-response";
import { enforceRateLimitRules, rateLimitIdentifier } from "@/lib/rate-limit";
import { getClientIp, rateLimitClientKey } from "@/lib/request";

/**
 * Social link previews, rendered as PNG.
 *
 * Every page previously pointed og:image at an SVG. LinkedIn, X, Facebook,
 * WhatsApp, Slack and Discord all refuse SVG for link previews, so every link
 * anyone shared appeared blank — on exactly the channels this publication needs
 * to reach readers. There were also only three of those files, so even where a
 * preview did render, every article looked identical.
 *
 * Generated per request instead of shipped as assets: 400+ pages each get a
 * preview carrying their own headline, with no binary files in the repo.
 */
export const runtime = "nodejs";

/**
 * These images are pure functions of the URL - the same path always renders the
 * same PNG - but the route was serving "max-age=0, must-revalidate", so every
 * hit re-rendered one from scratch and the CDN never kept a copy. Each social
 * crawler, each card on the index, each refresh paid full rendering cost, and
 * anyone could turn that into a bill by looping requests.
 *
 * Cache immutably and let the edge answer instead. Covers change only when the
 * slug changes, which changes the URL.
 */
const IMAGE_CACHE_CONTROL = "public, max-age=31536000, s-maxage=31536000, immutable";


const MAX_TITLE = 110;


/**
 * A ceiling on renders, because every distinct URL is a cache miss.
 *
 * The immutable cache only helps a URL that repeats. A caller looping
 * "?title=1", "?title=2" ... never repeats one, so nothing is cached and every
 * request is a billed render -- measured at ~36 a second, roughly 20-25ms each.
 * Neither image route was metered at all, which made a bill the cheapest thing
 * an unfriendly visitor could produce.
 *
 * The limit is deliberately loose. A reader who opens a page pulls one cover,
 * and a crawler fetching every card on a long index legitimately pulls dozens,
 * so this has to sit well above real traffic and only catch a loop.
 *
 * What this does NOT do, measured on production rather than assumed: it does
 * not stop a concurrent caller. The counters live in a Map inside one serverless
 * instance, so the cap is per instance and multiplies by however many the
 * platform has warm -- 527 renders went through in twenty seconds from a single
 * address against a nominal 120 a minute, roughly thirteen times the intended
 * rate. A sequential loop is capped; a parallel one is throttled and not
 * stopped. src/lib/rate-limit.ts says the same thing about every limit in this
 * codebase, and the answer it names is a shared store: UPSTASH_REDIS_REST_URL
 * and UPSTASH_REDIS_REST_TOKEN are read automatically if they ever exist.
 *
 * Worth keeping in proportion. This project has no payment method on file, so
 * the exposure is not a bill -- it is the Hobby plan pausing the site. Denial
 * of wallet turning into denial of service is still the failure to avoid, but
 * it is a different one from the one this comment used to imply was closed.
 */
async function imageRenderAllowed(request: Request) {
  const ip = getClientIp(request);
  return enforceRateLimitRules([
    { key: "image:endpoint", limit: 6000, windowMs: 60 * 1000 },
    { key: `image:ip:${rateLimitIdentifier(rateLimitClientKey(ip))}`, limit: 120, windowMs: 60 * 1000 }
  ]);
}

const TOO_MANY = (retryAfter: number) =>
  new Response("Too many requests", {
    status: 429,
    headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" }
  });

export async function GET(request: Request) {
  const gate = await imageRenderAllowed(request);
  if (!gate.allowed) return TOO_MANY(gate.retryAfter);

  const { searchParams } = new URL(request.url);

  const rawTitle = searchParams.get("title") || siteConfig.brandName;
  const rawKicker = searchParams.get("kicker") || "";

  // The text is drawn into an image rather than into markup, but it still comes
  // from a query string: keep it to plain characters and a sane length.
  const requested = sanitizeTextInput(rawTitle, { maxLength: MAX_TITLE }) || siteConfig.brandName;

  /**
   * A headline this site does not publish gets the brand card, not a render.
   *
   * The limiter above bounds how fast one address can ask; it does not bound
   * how many DIFFERENT things can be asked for, and that is the expensive axis,
   * because every distinct ?title= is its own Satori render and its own
   * immutable CDN object. Forty invented titles produced forty renders on a
   * production build before this.
   *
   * A redirect rather than a 404: a title that is real but missing from the set
   * -- a page added in a shape src/lib/og-titles.ts does not yet read -- then
   * degrades to a generic branded preview instead of a broken image. And a
   * redirect costs no render, so an attacker's unique URLs all collapse onto
   * one cached image.
   */
  if (!isKnownOgTitle(requested)) {
    return new Response(null, {
      status: 308,
      headers: {
        Location: "/api/og",
        "Cache-Control": "public, max-age=86400"
      }
    });
  }

  const title = requested;
  const kicker = sanitizeTextInput(rawKicker, { maxLength: 48 });

  // Long headlines get a smaller size rather than overflowing the canvas.
  const titleSize = title.length > 78 ? 54 : title.length > 46 ? 64 : 76;

  const card = (cardTitle: string) =>
    new ImageResponse(
      (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "72px 80px",
          fontFamily: "Public Sans"
        }}
      >
        {/* Provenance rail — the same idea the site leads with. */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "14px", height: "14px", background: "#1b4d3e" }} />
          <div
            style={{
              fontSize: "24px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#1b4d3e",
              fontWeight: 700,
              fontFamily: "Public Sans"
            }}
          >
            {kicker || "AI + Cybersecurity"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: `${titleSize}px`,
            lineHeight: 1.18,
            letterSpacing: "-0.01em",
            color: "#0f1519",
            fontWeight: 700,
            // The serif the site sets its headings in. A shared link should look
            // like it came from the page it points at.
            fontFamily: "Newsreader",
            maxWidth: "980px"
          }}
        >
          {cardTitle}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "3px solid #0f1519",
            paddingTop: "26px"
          }}
        >
          {/* The site calls itself siteConfig.brandName everywhere except
              here, where the social card said "AI Student Hub" — a name that
              appears nowhere on the site a reader lands on. Read it from config
              so the two cannot drift again. */}
          <div style={{ fontSize: "30px", color: "#0f1519", fontWeight: 700, fontFamily: "Newsreader" }}>
            {siteConfig.brandName}
          </div>
          <div style={{ fontSize: "22px", color: "#6b7883", letterSpacing: "0.04em", fontWeight: 400 }}>
            First-party sources only
          </div>
        </div>
      </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: imageFonts
      }
    );

  // Same buffering as the cover route: an Arabic title aborted this response
  // mid-stream, with no status code for the caller to act on. See renderImage.
  return renderImage(card, title, { "Cache-Control": IMAGE_CACHE_CONTROL });
}
