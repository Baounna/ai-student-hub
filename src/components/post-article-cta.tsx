import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { siteConfig } from "@/config/site";
import { TrackableAnchor } from "@/components/trackable-anchor";
import { getGuideCtaHref, getGuideCtaLabel, getProductCheckoutUrl } from "@/lib/product";

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
      ? "Prêt à accélérer votre exécution IA + cybersécurité ?"
      : "Ready to accelerate your AI + cybersecurity execution?");
  const resolvedDescription =
    description ||
    (locale === "fr"
      ? "Ouvrez la liste des stages ouverts, puis le lab outils."
      : "Open the current list of open internships, then the tools lab.");
  const ctaPrimary = locale === "fr" ? siteConfig.leadMagnet.frLabel : siteConfig.leadMagnet.enLabel;
  const ctaSecondary = locale === "fr" ? "Ouvrir le lab outils" : "Open tools lab";
  // Was hardcoded to "Buy student guide" / "Acheter le guide étudiant", and
  // rendered at the foot of all 48 article pages -- for a product whose own
  // page says "This guide does not exist. There is nothing to buy, no price,
  // and no date promised." Every other call site was moved onto the gate in
  // src/lib/product.ts; this one was missed, which made it the single place
  // the site still offered to sell something that is not written.
  const ctaTertiary = getGuideCtaLabel(locale);
  const leadMagnetHref = locale === "fr" ? siteConfig.leadMagnet.frUrl : siteConfig.leadMagnet.enUrl;
  const checkoutUrl = getProductCheckoutUrl();
  const proofLines =
    locale === "fr"
      ? ["Format actionable en 10 min", "Système hebdomadaire orienté exécution", "Conçu pour un budget-friendly réel"]
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
            {/* Only reachable once GUIDE_EXISTS is true and a checkout URL is
                set, i.e. once there is something to buy. Until then the branch
                below runs and says what the site actually has. */}
            {locale === "fr" ? "Acheter le guide étudiant" : "Buy student guide"}
          </TrackableAnchor>
        ) : (
          <Link href={getGuideCtaHref(locale)} className="btn-secondary">
            {ctaTertiary}
          </Link>
        )}
      </div>
    </section>
  );
}
