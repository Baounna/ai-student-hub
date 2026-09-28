import type { ImageResponse } from "next/og";

/**
 * Finish rendering an image before answering, and fall back rather than abort.
 *
 * ImageResponse hands back a Response whose body is still being rendered, so a
 * font-shaping failure surfaces while the bytes are being piped -- long after
 * any try/catch around the constructor has returned. The client sees the
 * connection close mid-image with no status at all: `curl (52) Empty reply from
 * server`, and the server logs a stack trace.
 *
 * Arabic does this today. The vendored fonts declare a GSUB table Satori's
 * shaper cannot read ("lookupType: 5 - substFormat: 3 is not yet supported"),
 * and every Arabic title fails in about 3ms. CJK, Hebrew, Devanagari, Thai,
 * emoji and combining accents all render fine, so it is specific rather than a
 * general gap -- and it matters here, because the publication is written from
 * Morocco for a worldwide audience and will meet Arabic in a title eventually.
 *
 * Buffering costs the streaming we were not benefiting from: these renders take
 * 20-25ms and sit behind an immutable cache. In exchange a failure becomes a
 * plainer image instead of a broken response.
 */
export async function renderImage(
  build: (title: string) => ImageResponse,
  title: string,
  headers: Record<string, string>
): Promise<Response> {
  // Latin only. If the shaper choked on the title, the retry must not hand it
  // the same characters again.
  const plain = title.replace(/[^\u0000-ɏ‐-›]/g, "").replace(/\s+/g, " ").trim();
  const attempts = [title, plain !== title ? plain : "", ""].filter(
    (value, index, all) => index === 0 || all.indexOf(value) === index
  );

  for (const attempt of attempts) {
    try {
      const body = await build(attempt).arrayBuffer();
      return new Response(body, { headers: { "Content-Type": "image/png", ...headers } });
    } catch {
      // Try the next, plainer, attempt.
    }
  }

  // Nothing rendered at all. A 502 is honest and lets the caller show its own
  // placeholder, which is better than a connection that dies mid-image.
  return new Response("Image render failed", { status: 502, headers: { "Cache-Control": "no-store" } });
}
