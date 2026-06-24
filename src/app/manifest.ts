import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI and Cybersecurity News",
    short_name: "AI Cyber News",
    description: "AI + Cybersecurity Signals for Real Builders.",
    start_url: "/en",
    scope: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#0b1220",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
