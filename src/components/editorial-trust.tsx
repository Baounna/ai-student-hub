import Link from "next/link";
import type { Locale } from "@/i18n/config";

type EditorialTrustProps = {
  locale: Locale;
  compact?: boolean;
};

export function EditorialTrust({ locale, compact = false }: EditorialTrustProps) {
  const fr = locale === "fr";

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
        {fr ? "Charte editoriale" : "Editorial integrity"}
      </h2>
      <ul className={`mt-3 text-sm text-[color:var(--text)] ${compact ? "space-y-1.5" : "space-y-2"}`}>
        <li>1. {fr ? "Mises a jour hebdomadaires IA + CS." : "Weekly AI + Cybersecurity updates."}</li>
        <li>2. {fr ? "Sources explicites et references visibles." : "Explicit sources and visible references."}</li>
        <li>3. {fr ? "Recommandations orientees execution et budget-friendly." : "Execution-first recommendations with budget-friendly constraints."}</li>
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
        <Link href={`/${locale}/affiliate-disclosure`} className="do-link">
          {fr ? "Disclosure" : "Disclosure"}
        </Link>
        <span>•</span>
        <Link href={`/${locale}/privacy`} className="do-link">
          {fr ? "Confidentialite" : "Privacy"}
        </Link>
      </div>
    </section>
  );
}
