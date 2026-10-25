import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        /*
         * The two image routes are allowed back, ahead of the /api/ block.
         *
         * Every og:image on the site is /api/og and every Article image is
         * /api/cover, so "Disallow: /api/" told Googlebot-Image, LinkedInBot,
         * Twitterbot and facebookexternalhit not to fetch a single social or
         * schema image on 131 pages. The images were fine; the rule forbade
         * reading them. It also made the x-robots-tag those routes send
         * unreadable, since a blocked URL is never requested.
         *
         * A longer Allow wins over a shorter Disallow for Google and Bing, so
         * these two lines reopen exactly the image routes and leave the rest of
         * /api/ -- the newsletter and tracking endpoints -- blocked.
         */
        allow: ["/", "/api/og", "/api/cover"],
        disallow: [
          "/api/",
          /*
           * /health is an operational endpoint that sits outside /api/.
           *
           * It returns a JSON blob of timestamps and item counts for the
           * watchdog, and because the route is /health rather than
           * /api/health, the "/api/" line above never covered it, it is in no
           * sitemap, and nothing links to it -- so the one thing keeping it out
           * of search results was the X-Robots-Tag header the route sets
           * itself. That header only works if a crawler spends a request
           * fetching the JSON to read it. This line means it does not have to:
           * the header stays as the backstop for anyone who links to /health
           * directly, and the crawl is skipped. Keep both.
           */
          "/health",
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
