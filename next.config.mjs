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
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
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
      {
        source: "/(.*)",
        headers
      }
    ];
  }
};

export default nextConfig;
