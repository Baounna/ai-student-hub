import { ImageResponse } from "next/og";
import { sanitizeTextInput } from "@/lib/input";
import { posts } from "@/content/posts";
import { isLocale } from "@/i18n/config";

/**
 * Article cover images, generated per article.
 *
 * Eighteen posts once shared three SVG files, so every card looked like one of
 * three. That was replaced by a composition seeded from the slug — which fixed
 * the repetition and nothing else. The covers were still abstract bands and a
 * ring: distinct from each other, but silent about the article. A reader
 * scanning the index, or seeing a link shared, learned nothing from the image,
 * and the old note here even argued against stock photography on the grounds
 * that it "would date badly and say nothing about the subject". The generated
 * version said nothing either.
 *
 * So the cover now leads with the thing that actually identifies an article:
 * its title, in the reader's language, at a size that survives a card. The
 * seeded geometry stays as texture behind it, which keeps the set one family
 * and keeps every article's cover its own. The palette still comes from the
 * topic.
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


/** Small deterministic hash — same slug in, same composition out, forever. */
function seedFrom(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32: tiny seeded PRNG, so the layout varies without being random. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * One palette per editorial track, all sharing the site's ink and paper so the
 * covers read as a set. Pine is the house accent; the others sit beside it
 * rather than competing with it.
 */
const PALETTES: Record<string, { ground: string; ink: string; a: string; b: string }> = {
  security: { ground: "#0F1519", ink: "#E9EEF2", a: "#A3431B", b: "#63C09C" },
  ai: { ground: "#1B4D3E", ink: "#EAF3EF", a: "#63C09C", b: "#C9E5D9" },
  systems: { ground: "#16222C", ink: "#E6EEF4", a: "#4E8FB8", b: "#9CC4DC" },
  cs: { ground: "#F1F4F6", ink: "#0F1519", a: "#1B4D3E", b: "#A3431B" },
  career: { ground: "#241C2E", ink: "#EFE9F4", a: "#9B7FC4", b: "#D3C4E6" },
  cloud: { ground: "#10262A", ink: "#E4F0F1", a: "#2E8B87", b: "#8FC9C6" }
};

function paletteFor(topic: string) {
  const t = topic.toLowerCase();
  if (t.includes("security") || t.includes("standards")) return PALETTES.security;
  if (t.includes("cloud") || t.includes("devops")) return PALETTES.cloud;
  if (t.includes("career") || t.includes("interview")) return PALETTES.career;
  if (t.includes("backend") || t.includes("computer systems")) return PALETTES.systems;
  if (t.includes("ai") || t.includes("llm")) return PALETTES.ai;
  return PALETTES.cs;
}

/**
 * The article's own title, in the requested language.
 *
 * Falls back to the slug turned back into words, because this route also serves
 * pages that are not posts — the comparison index, the decorative news tiles —
 * and a cover is still better with a readable phrase on it than without one.
 * Known acronyms are re-capitalised, since "cve" and "ai" read as typos.
 */
const ACRONYMS = new Set(["ai", "ml", "cve", "llm", "rag", "cs", "api", "ci", "cd", "gpu", "cpu", "sql", "os"]);

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => (ACRONYMS.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

function titleFor(slug: string, locale: string) {
  const post = posts.find((candidate) => candidate.slug === slug);
  if (!post) return titleFromSlug(slug);
  const localized = isLocale(locale) ? post.locales[locale] : undefined;
  return localized?.title || post.title;
}

/**
 * Type big enough to read on a card, small enough that a long title still fits.
 * The thresholds are the character counts at which three lines stop fitting the
 * box at the next size up.
 */
function titleSize(title: string) {
  if (title.length <= 28) return 92;
  if (title.length <= 44) return 76;
  if (title.length <= 62) return 64;
  return 54;
}

/**
 * Topic and slug are path segments rather than a query string: next/image
 * refuses to optimise a local source that carries one ("url parameter is not
 * allowed"), so a query-based route would have 400'd for every card.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ topic: string; locale: string; slug: string }> }
) {
  const resolved = await params;
  const slug = sanitizeTextInput(decodeURIComponent(resolved.slug || "cover"), { maxLength: 120 });
  const locale = resolved.locale === "fr" ? "fr" : "en";
  const rawTopic = decodeURIComponent(resolved.topic || "");
  // "none" is the explicit opt-out used by decorative tiles.
  const topic =
    rawTopic === "none" ? "" : sanitizeTextInput(rawTopic.replace(/-/g, " "), { maxLength: 48 });

  // With the label suppressed there is no topic left to colour by, so fall back
  // to the slug — decorative tiles name their subject there ("news-ai-systems"),
  // which keeps a row of them visibly different rather than three of one colour.
  const palette = paletteFor(topic || slug);
  const next = rng(seedFrom(slug));
  const fullTitle = titleFor(slug, locale);
  // 96 characters is what fits three lines at the smallest size the ramp uses.
  const title = fullTitle.length > 96 ? `${fullTitle.slice(0, 95).trimEnd()}\u2026` : fullTitle;

  // Four broad bands, angled and offset by the seed. Large simple forms hold up
  // at card size, where fine detail would turn to mud.
  const bands = Array.from({ length: 4 }, (_, i) => ({
    top: Math.round(next() * 420) - 120,
    left: Math.round(next() * 520) - 180,
    width: Math.round(560 + next() * 620),
    height: Math.round(70 + next() * 130),
    rotate: Math.round(next() * 44) - 22,
    color: i % 2 === 0 ? palette.a : palette.b,
    // Dimmer than before: these sit behind the title now, and at the old
    // opacity they competed with it instead of supporting it.
    opacity: 0.12 + next() * 0.24
  }));

  const ringSize = Math.round(300 + next() * 260);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: palette.ground,
          fontFamily: "sans-serif"
        }}
      >
        {bands.map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${b.top}px`,
              left: `${b.left}px`,
              width: `${b.width}px`,
              height: `${b.height}px`,
              background: b.color,
              opacity: b.opacity,
              transform: `rotate(${b.rotate}deg)`
            }}
          />
        ))}

        {/* One open ring: a steady mark across the set, placed by the seed. */}
        <div
          style={{
            position: "absolute",
            top: `${Math.round(next() * 160) + 40}px`,
            right: `${Math.round(next() * 180) + 40}px`,
            width: `${ringSize}px`,
            height: `${ringSize}px`,
            borderRadius: `${ringSize}px`,
            border: `2px solid ${palette.a}`,
            opacity: 0.28
          }}
        />

        {/* The title, which is the whole point. Omitted for decorative tiles
            (topic "none"), which are cropped to a fraction of their width on the
            news page and would show a few sliced letters rather than a phrase. */}
        {topic ? (
          <div
            style={{
              position: "absolute",
              left: "64px",
              right: "64px",
              // 72, not 56: at 56 a descender in the last line sat a few pixels
            // off the image edge, which reads as a crop rather than a margin.
            bottom: "72px",
              display: "flex",
              flexDirection: "column",
              gap: "22px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "12px", height: "12px", background: palette.a }} />
              <div
                style={{
                  fontSize: "24px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: palette.a,
                  fontWeight: 700
                }}
              >
                {topic}
              </div>
            </div>
            <div
              style={{
                fontSize: `${titleSize(title)}px`,
                lineHeight: 1.12,
                color: palette.ink,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                // next/og has no ellipsis support, so the title is cut to a
                // length the box can hold rather than overflowing the image.
                display: "flex"
              }}
            >
              {title}
            </div>
          </div>
        ) : null}
      </div>
    ),
    {
      width: 1200,
      height: 675,
      headers: { "Cache-Control": IMAGE_CACHE_CONTROL }
    }
  );
}
