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
