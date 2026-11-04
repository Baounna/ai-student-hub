import Link from "next/link";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/config";

type AffiliateDisclosureInlineProps = {
  locale: Locale;
  className?: string;
};

export function AffiliateDisclosureInline({ locale, className }: AffiliateDisclosureInlineProps) {
  return (
    <p className={className || "text-xs text-[color:var(--muted)]"}>
      {siteConfig.affiliateDisclosureText[locale]}{" "}
      {/* Named rather than "Learn more". This component renders on the home
          page and under every article in both locales, so in a screen reader's
          link list it was fifty entries of the same two words with nothing to
          tell them apart or say where any of them went (WCAG 2.4.9). */}
      <Link href={`/${locale}/affiliate-disclosure`} className="do-link">
        {locale === "fr" ? "Lire la politique d'affiliation" : "Read the affiliate disclosure"}
      </Link>
      .
    </p>
  );
}
