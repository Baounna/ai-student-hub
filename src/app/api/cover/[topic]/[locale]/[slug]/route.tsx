import { ImageResponse } from "next/og";
import { sanitizeTextInput } from "@/lib/input";
import { comparisons, posts } from "@/content/posts";
import { isLocale } from "@/i18n/config";
import { imageFonts } from "@/assets/fonts";

/**
 * Article cover images, generated per article.
 *
 * This has now failed twice for opposite reasons, and both are worth keeping
 * written down.
 *
 * First it was eighteen posts sharing three SVGs, which made every card look
 * interchangeable. That was replaced by a composition seeded from the slug:
 * four angled bands and a ring, coloured by topic. It fixed the repetition and
 * nothing else -- the covers were distinct from each other and silent about the
 * articles, and because the motif was identical everywhere, a page of them read
 * as generated wallpaper rather than a designed publication.
 *
 * Then the title was added on top of that motif, anchored bottom-left. That
 * broke it differently: these images are 1200x675 and the cards that show them
 * are nearly square, so `object-cover` crops the sides. The featured card was
 * rendering "EER INTERVIEWS" and "w to Build an AI Portfolio Project". Text
 * sliced mid-word looks broken in a way plain decoration never did.
 *
 * So: no motif, and nothing near an edge. A solid ground from the topic, and
 * one centred column 620px wide -- which is what survives a centre crop all the
 * way down to 1:1 (visible width 675px, x 262 to 938). The variation between
 * covers is the title and the colour, which is the variation that means
 * something. A consistent frame is what makes a set look designed; a different
 * random pattern on each one is what makes it look automatic.
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
  if (post) {
    const localized = isLocale(locale) ? post.locales[locale] : undefined;
    return localized?.title || post.title;
  }
  // Comparison pages are not posts. Without this they fell through to the slug,
  // so the hub's own hero read "Compare Index" and every French comparison
  // carried a Title-Cased English slug.
  const comparison = comparisons.find((candidate) => candidate.slug === slug);
  if (comparison && isLocale(locale)) return comparison.locales[locale].title;
  return titleFromSlug(slug);
}

/**
 * The label above the title.
 *
 * The topic arrives here slugified, because it is a path segment -- which
 * silently ate the separators the site's own category names use:
 * "Career/Interviews" reached the image as "CAREER INTERVIEWS" and
 * "Cloud/DevOps" as "CLOUD DEVOPS". The post knows its real category, so read
 * it from there and keep the slug only as a fallback for pages that are not
 * posts.
 */
function labelFor(slug: string, topicSegment: string) {
  const post = posts.find((candidate) => candidate.slug === slug);
  if (post?.category) return post.category;
  if (comparisons.some((candidate) => candidate.slug === slug)) return "Comparison";
  return topicSegment;
}

/**
 * Type big enough to read on a card, small enough that a long title still fits.
 * The thresholds are the character counts at which three lines stop fitting the
 * box at the next size up.
 */
function titleSize(title: string, narrow = false) {
  // The narrow ramp is for the news tiles, whose column is 340px rather than
  // 560 because their crop is portrait.
  if (narrow) {
    // Small, because the column is 170px: these wrap to two or three short
    // lines rather than running past the crop.
    if (title.length <= 14) return 24;
    if (title.length <= 24) return 20;
    return 18;
  }
  if (title.length <= 30) return 54;
  if (title.length <= 50) return 46;
  if (title.length <= 70) return 40;
  return 34;
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
  // The news strip's three tiles. They pass topic "none" because they must not
  // render a corner label, but they still need to say something.
  const isTile = slug.startsWith("news-");
  // Decorative tiles pass topic "none"; they get their subject from the slug
  // instead, so the strip still says what each third of it covers.
  const label = isTile ? "News" : labelFor(slug, topic);
  const fullTitle = isTile ? titleFromSlug(slug.replace(/^news-/, "")) : titleFor(slug, locale);
  // 96 characters is what fits three lines at the smallest size the ramp uses.
  const title = fullTitle.length > 96 ? `${fullTitle.slice(0, 95).trimEnd()}\u2026` : fullTitle;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "675px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: palette.ground,
          fontFamily: "Public Sans"
        }}
      >
        {/* 620px, centred: the widest column that survives a centre crop down
            to square. Nothing sits near an edge, so nothing gets sliced. */}
        <div
          style={{
            // Two widths, because two very different crops read this image.
            //
            // Article cards are landscape or square; the tightest measured is
            // 4:3, showing 902px of source, and 560 clears every one of them by
            // at least 190px.
            //
            // The news tiles are the hard case and I have now got them wrong
            // twice by assuming an aspect instead of measuring the element.
            // .news-feature-media is grid-cols-3 at EVERY breakpoint -- it never
            // stacks -- so each tile is a sliver whose aspect changes with the
            // viewport: measured 202x352 (0.575) at 1280 and 98x256 (0.383) at
            // 390, and about 80x256 (0.31) at 320. The narrowest of those shows
            // roughly 211px of a 1200px source.
            //
            // 170 is sized to that worst case, not to a typical one. At 340 the
            // live tile rendered "Computer System" with the C cut in half.
            width: isTile ? "170px" : "560px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "26px"
          }}
        >
          {label ? (
            <div
              style={{
                fontSize: "22px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: palette.a,
                fontWeight: 700,
                fontFamily: "Public Sans",
                display: "flex"
              }}
            >
              {label}
            </div>
          ) : null}

          <div
            style={{
              fontSize: `${titleSize(title, isTile)}px`,
              lineHeight: 1.22,
              color: palette.ink,
              fontWeight: 700,
              // Newsreader: the same serif the site sets its headings in, so a
              // cover beside an article looks like it belongs to it.
              fontFamily: "Newsreader",
              letterSpacing: "-0.01em",
              display: "flex",
              textAlign: "center"
            }}
          >
            {title}
          </div>

          {/* A short rule instead of a mark: it reads as an editorial device at
              any size, where a small square disappeared on a card. */}
          <div style={{ width: "72px", height: "3px", background: palette.a, display: "flex" }} />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 675,
      fonts: imageFonts,
      headers: { "Cache-Control": IMAGE_CACHE_CONTROL }
    }
  );
}
