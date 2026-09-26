import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI and Cybersecurity News",
    short_name: "AI Cyber News",
    description: "AI + Cybersecurity Signals for Real Builders.",
    start_url: "/en",
    scope: "/",
    display: "standalone",
    // Was #020617 / #0b1220 -- navy, from an older identity. The site's own
    // grounds are #ffffff on light and #0c1114 on dark, so the install splash
    // and Android's chrome matched neither.
    background_color: "#ffffff",
    theme_color: "#0c1114",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      // Android's installer ignores SVG and wants raster at these sizes.
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
