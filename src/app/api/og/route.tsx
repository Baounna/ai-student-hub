import { ImageResponse } from "next/og";
import { sanitizeTextInput } from "@/lib/input";
import { siteConfig } from "@/config/site";
import { imageFonts } from "@/assets/fonts";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawTitle = searchParams.get("title") || "AI and Cybersecurity News";
  const rawKicker = searchParams.get("kicker") || "";

  // The text is drawn into an image rather than into markup, but it still comes
  // from a query string: keep it to plain characters and a sane length.
  const title = sanitizeTextInput(rawTitle, { maxLength: MAX_TITLE }) || "AI and Cybersecurity News";
  const kicker = sanitizeTextInput(rawKicker, { maxLength: 48 });

  // Long headlines get a smaller size rather than overflowing the canvas.
  const titleSize = title.length > 78 ? 54 : title.length > 46 ? 64 : 76;

  return new ImageResponse(
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
          {title}
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
          {/* The site calls itself "AI and Cybersecurity News" everywhere except
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
      fonts: imageFonts,
      headers: { "Cache-Control": IMAGE_CACHE_CONTROL }
    }
  );
}
