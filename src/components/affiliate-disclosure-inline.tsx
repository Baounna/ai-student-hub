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
      <Link href={`/${locale}/affiliate-disclosure`} className="do-link">
        {locale === "fr" ? "En savoir plus" : "Learn more"}
      </Link>
      .
    </p>
  );
}
