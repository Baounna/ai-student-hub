const isDevelopment = process.env.NODE_ENV !== "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The cover and OG routes read these TTFs from disk at request time so the
  // generated images use the site's own Newsreader and Public Sans rather than
  // whatever "sans-serif" resolves to on the server. Nothing imports them, so
  // file tracing would not otherwise ship them and the routes would fall back
  // to a system font in production while looking correct locally.
  outputFileTracingIncludes: {
    "/api/cover/[topic]/[locale]/[slug]": ["./src/assets/fonts/**"],
    "/api/og": ["./src/assets/fonts/**"]
  },
  images: {
    /*
     * A favicon does not change. The only remote images here are Google's
     * favicon service, fetched for the tool logos, and without a TTL the
     * optimizer re-fetches and re-encodes them on its own default schedule for
     * files that are identical every time.
     */
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/s2/favicons"
      }
    ]
  },
  async headers() {
    const headers = [
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      // Deny-list rather than a shortlist. The site has no <video>, <audio>,
      // <iframe> or any device API anywhere in src/, so every one of these is a
      // capability nothing here will ever ask for — and an unasked-for
      // capability is exactly what injected or embedded code goes looking for.
      // Naming them costs nothing and removes the question.
      {
        key: "Permissions-Policy",
        value: [
          "accelerometer=()",
          "autoplay=()",
          "bluetooth=()",
          "browsing-topics=()",
          "camera=()",
          "display-capture=()",
          "encrypted-media=()",
          "fullscreen=()",
          "geolocation=()",
          "gyroscope=()",
          "magnetometer=()",
          "microphone=()",
          "midi=()",
          "payment=()",
          "picture-in-picture=()",
          "publickey-credentials-get=()",
          "screen-wake-lock=()",
          "serial=()",
          "usb=()",
          "xr-spatial-tracking=()"
        ].join(", ")
      },
      { key: "Origin-Agent-Cluster", value: "?1" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" }
    ];

    if (!isDevelopment) {
      headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" });
    }

    const apiHeaders = [...headers, { key: "X-Robots-Tag", value: "noindex, nofollow" }];
    /*
     * The image routes get everything except the noindex, and a CORP that
     * allows the embedding their whole job depends on.
     */
    const imageHeaders = [
      ...headers.filter((header) => header.key !== "Cross-Origin-Resource-Policy"),
      // An image whose whole job is to render on someone else's domain should
      // not forbid that, and "all" has to be stated rather than merely omitted
      // because it is overriding the catch-all above.
      { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
      { key: "X-Robots-Tag", value: "all" }
    ];
    const growthSprintNoindexHeaders = [...headers, { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }];

    return [
      {
        source: "/growth-sprint",
        headers: growthSprintNoindexHeaders
      },
      {
        source: "/:lang(en|fr)/growth-sprint",
        headers: growthSprintNoindexHeaders
      },
      {
        source: "/api/:path*",
        headers: apiHeaders
      },
      /*
       * The two image routes, AFTER the catch-all, overriding its noindex.
       *
       * Every social card is /api/og and every article image is /api/cover, so
       * the catch-all was serving "X-Robots-Tag: noindex, nofollow" on every
       * image this site has. That is the other half of a bug already half
       * fixed: robots.ts was changed to let crawlers FETCH these, and the first
       * thing they read when they did was an instruction to ignore them.
       * `image` is the one Article property Google actually renders, so no page
       * could become a search thumbnail or a Discover card, and nothing here
       * was eligible for Google Images. It stayed invisible because LinkedIn,
       * Facebook and X do not honour X-Robots-Tag, so the previews anyone tests
       * by hand worked fine.
       *
       * Measured, not assumed: listing these BEFORE the catch-all changes
       * nothing, because a later matching rule wins. Hence the explicit
       * positive value here rather than a negative lookahead on the catch-all
       * -- a typo in a lookahead would silently expose a real API route, while
       * a typo here only fails to fix an image.
       */
      {
        source: "/api/og",
        headers: imageHeaders
      },
      {
        source: "/api/cover/:path*",
        headers: imageHeaders
      },
      // The two routes that take a body. Next's default for a route handler is
      // "public, max-age=0, must-revalidate", measured on production — and
      // "public" is a claim about a shared cache, not about freshness. A 429
      // carrying someone's Retry-After, or a signup reply that says whether an
      // address reached the provider, is not something a CDN should be told it
      // may hold. The image routes are deliberately excluded: they set their own
      // long immutable cache, and that was a fix for a real rendering bill.
      {
        source: "/api/newsletter",
        headers: [...apiHeaders, { key: "Cache-Control", value: "no-store" }]
      },
      {
        source: "/api/track",
        headers: [...apiHeaders, { key: "Cache-Control", value: "no-store" }]
      },
      {
        source: "/(.*)",
        headers
      },
      /*
       * The three files every crawler asks for first, told they may be cached.
       *
       * All three are built once and marked static, and all three answered
       * "public, max-age=0, must-revalidate" -- which tells a shared cache it
       * may store the file and then forbids it from ever using what it stored
       * without asking us again. So every crawler hit on /sitemap.xml came all
       * the way back to the origin for a file that cannot have changed since
       * the deploy, and the one spending that round trip is the crawler
       * deciding how much of this site to read.
       *
       * AFTER the catch-all, following the note on the image routes above: a
       * later matching rule wins, so anything listed before /(.*) is what gets
       * overwritten. Served both ways on a production build before settling
       * here, and both answered with this header -- "later wins" decides a key
       * that two rules both set, and the catch-all sets no Cache-Control at
       * all. It stays after it so that stops being load-bearing on the day the
       * catch-all does set one.
       *
       * The values are the ones /feed.xml and the suggest route already send,
       * so these three are not a fourth caching policy to keep in your head.
       * A browser still revalidates (max-age=0 is untouched); only the CDN in
       * front of it gets to answer, for an hour, and to serve what it has for
       * a day while it refreshes. A deploy purges it, which is what makes an
       * hour safe for a sitemap that lists dated content.
       */
      {
        source: "/:file(sitemap.xml|robots.txt|manifest.webmanifest)",
        headers: [
          ...headers,
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
