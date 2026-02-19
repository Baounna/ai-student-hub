import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { siteConfig } from "@/config/site";

type PostArticleCtaProps = {
  locale?: Locale;
  title?: string;
  description?: string;
};

export function PostArticleCta({
  locale = "en",
  title = "Ready to build your AI career momentum?",
  description = "Download the Free AI Career Roadmap and get the exact weekly system students use to ship projects and convert interviews."
}: PostArticleCtaProps) {
  const ctaPrimary = locale === "fr" ? "Obtenir la roadmap IA gratuite" : "Get Free AI Career Roadmap";
  const ctaSecondary = locale === "fr" ? "Voir les ressources recommandees" : "See recommended resources";
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;
  const proofLines =
    locale === "fr"
      ? ["Format actionable en 10 min", "Systeme hebdomadaire orientee execution", "Concu pour budget etudiant"]
      : ["Actionable in under 10 minutes", "Weekly execution-first system", "Built for student budgets"];

  return (
    <section className="do-hero rounded-2xl p-6">
      <p className="do-kicker">
        {locale === "fr" ? "Prochaine étape" : "Next Step"}
      </p>
      <h3 className="font-display mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">{title}</h3>
      <p className="mt-3 max-w-2xl text-sm text-[color:var(--text)]">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {proofLines.map((line) => (
          <span
            key={line}
            className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] text-[color:var(--muted)]"
          >
            {line}
          </span>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={leadMagnetHref}
          className="btn-primary"
        >
          {ctaPrimary}
        </a>
        <Link
          href={`/${locale}/resources`}
          className="btn-secondary"
        >
          {ctaSecondary}
        </Link>
      </div>
    </section>
  );
}
