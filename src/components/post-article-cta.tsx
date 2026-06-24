import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { siteConfig } from "@/config/site";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { isSafeHttpUrl, normalizeHttpUrl } from "@/lib/url";

type PostArticleCtaProps = {
  locale?: Locale;
  title?: string;
  description?: string;
};

export function PostArticleCta({
  locale = "en",
  title,
  description
}: PostArticleCtaProps) {
  const resolvedTitle =
    title ||
    (locale === "fr"
      ? "Pret a accelerer ton execution IA + cybersecurite ?"
      : "Ready to accelerate your AI + cybersecurity execution?");
  const resolvedDescription =
    description ||
    (locale === "fr"
      ? "Recupere la roadmap gratuite puis passe au lab outils et au guide premium pour convertir tes apprentissages en resultats."
      : "Get the free roadmap, then move into the tools lab and premium guide to convert learning into outcomes.");
  const ctaPrimary = locale === "fr" ? "Obtenir la roadmap IA gratuite" : "Get Free AI Career Roadmap";
  const ctaSecondary = locale === "fr" ? "Ouvrir le lab outils" : "Open tools lab";
  const ctaTertiary = locale === "fr" ? "Acheter le guide etudiant" : "Buy student guide";
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;
  const checkoutUrlRaw = (process.env.NEXT_PUBLIC_PRODUCT_CHECKOUT_URL || "").trim();
  const checkoutUrl = isSafeHttpUrl(checkoutUrlRaw) ? normalizeHttpUrl(checkoutUrlRaw) : "";
  const proofLines =
    locale === "fr"
      ? ["Format actionable en 10 min", "Systeme hebdomadaire orientee execution", "Concu pour un budget-friendly reel"]
      : ["Actionable in under 10 minutes", "Weekly execution-first system", "Built for realistic budget constraints"];

  return (
    <section className="do-hero rounded-2xl p-6">
      <p className="do-kicker">
        {locale === "fr" ? "Prochaine étape" : "Next Step"}
      </p>
      <h3 className="font-display mt-2 text-2xl font-semibold text-[color:var(--text-strong)]">{resolvedTitle}</h3>
      <p className="mt-3 max-w-2xl text-sm text-[color:var(--text)]">{resolvedDescription}</p>
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
        <TrackableAnchor
          href={leadMagnetHref}
          event="lead_magnet_click"
          meta={{ page: "post_article_cta", locale }}
          className="btn-primary"
        >
          {ctaPrimary}
        </TrackableAnchor>
        <Link
          href={`/${locale}/compare`}
          className="btn-secondary"
        >
          {ctaSecondary}
        </Link>
        {checkoutUrl ? (
          <TrackableAnchor
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            event="product_checkout_click"
            meta={{ page: "post_article_cta", locale, offer: "ai-career-guide" }}
            className="btn-secondary"
          >
            {ctaTertiary}
          </TrackableAnchor>
        ) : (
          <Link href={`/${locale}/product/ai-career-guide`} className="btn-secondary">
            {ctaTertiary}
          </Link>
        )}
      </div>
    </section>
  );
}
