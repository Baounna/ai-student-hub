import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { siteConfig } from "@/config/site";

export function ExitIntentCta({ locale = "en" }: { locale?: Locale }) {
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;
  const copy =
    locale === "fr"
      ? {
          badge: "Avant de partir",
          title: "Voyez les stages ouverts avant de partir",
          body: "Stages et alternances IA et cybersecurite au Maroc et en France. Nouvelle liste chaque semaine.",
          cta1: "Voir les stages",
          cta2: "Voir les ressources"
        }
      : {
          badge: "Before You Leave",
          title: "See the internships that are open now",
          body: "AI and cybersecurity internships in Morocco and France. A new list every week.",
          cta1: "See the internships",
          cta2: "See tools and resources"
        };

  return (
    <section className="do-hero mt-12 rounded-2xl p-6">
      <p className="do-kicker">{copy.badge}</p>
      <h3 className="font-display mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">{copy.title}</h3>
      <p className="mt-3 max-w-2xl text-sm text-[color:var(--text)]">{copy.body}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={leadMagnetHref}
          className="btn-primary"
        >
          {copy.cta1}
        </a>
        <Link
          href={`/${locale}/resources`}
          className="btn-secondary"
        >
          {copy.cta2}
        </Link>
      </div>
    </section>
  );
}
