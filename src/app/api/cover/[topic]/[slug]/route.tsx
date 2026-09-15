import { ImageResponse } from "next/og";
import { sanitizeTextInput } from "@/lib/input";

/**
 * Article cover images, generated per article.
 *
 * Eighteen posts previously shared three SVG files, so every card on the blog
 * index looked like one of three. A repeated placeholder reads worse than no
 * image at all — it tells a reader the pages are interchangeable.
 *
 * Rather than licensing stock photography that would date badly and say nothing
 * about the subject, each cover is composed from the article's own slug: the
 * slug seeds the geometry, and the topic picks the palette. The same article
 * therefore always renders the same cover, every new article gets its own
 * without anyone drawing anything, and the whole set stays visibly one family.
 */
export const runtime = "nodejs";

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
 * Topic and slug are path segments rather than a query string: next/image
 * refuses to optimise a local source that carries one ("url parameter is not
 * allowed"), so a query-based route would have 400'd for every card.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ topic: string; slug: string }> }
) {
  const resolved = await params;
  const slug = sanitizeTextInput(decodeURIComponent(resolved.slug || "cover"), { maxLength: 120 });
  const topic = sanitizeTextInput(decodeURIComponent(resolved.topic || "").replace(/-/g, " "), {
    maxLength: 48
  });

  const palette = paletteFor(topic);
  const next = rng(seedFrom(slug));

  // Four broad bands, angled and offset by the seed. Large simple forms hold up
  // at card size, where fine detail would turn to mud.
  const bands = Array.from({ length: 4 }, (_, i) => ({
    top: Math.round(next() * 420) - 120,
    left: Math.round(next() * 520) - 180,
    width: Math.round(560 + next() * 620),
    height: Math.round(70 + next() * 130),
    rotate: Math.round(next() * 44) - 22,
    color: i % 2 === 0 ? palette.a : palette.b,
    opacity: 0.2 + next() * 0.45
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
            opacity: 0.5
          }}
        />

        {/* The topic, small and low — the headline already sits beside the card. */}
        <div
          style={{
            position: "absolute",
            left: "56px",
            bottom: "48px",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}
        >
          <div style={{ width: "12px", height: "12px", background: palette.a }} />
          <div
            style={{
              fontSize: "26px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: palette.ink,
              fontWeight: 600
            }}
          >
            {topic || "AI + Cybersecurity"}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 675 }
  );
}
