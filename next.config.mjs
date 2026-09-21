const isDevelopment = process.env.NODE_ENV !== "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
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
      }
    ];
  }
};

export default nextConfig;
