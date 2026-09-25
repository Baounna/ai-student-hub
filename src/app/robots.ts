import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/growth-sprint",
          "/en/growth-sprint",
          "/fr/growth-sprint"
        ]
      }
    ],
    // No `host`. It is a Yandex-only extension that Yandex itself dropped in
    // 2018 in favour of redirects, Google never read it, and the value here was
    // malformed anyway: it emitted "https://host/" where the directive wanted a
    // bare hostname. A line no crawler honours, in a format none of them
    // specified, is not a hint -- it is just wrong output in a public file.
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
