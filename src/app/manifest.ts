import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Student Hub",
    short_name: "AI Student Hub",
    description: "Execution-first AI + CS publication for students.",
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
