import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { NewsletterForm } from "@/components/newsletter-form";

type NewsletterProps = {
  compact?: boolean;
  locale?: Locale;
  source?: string;
};

export function Newsletter({ compact = false, locale = "en", source }: NewsletterProps) {
  const dict = getDictionary(locale).newsletter;
  const bullets =
    locale === "fr"
      ? [
          "1. Top signaux IA/CS de la semaine en version actionnable",
          "2. Plan sprint 30 jours avec jalons hebdomadaires",
          "3. Workflow candidatures + preparation entretien"
        ]
      : [
          "1. Weekly AI/CS signals translated into practical actions",
          "2. 30-day sprint plan with weekly milestones",
          "3. Application + interview prep workflow"
        ];

  if (compact) {
    return (
      <section className="surface rounded-2xl p-6">
        <p className="do-kicker">Newsletter</p>
        <h3 className="mt-2 text-lg font-semibold text-[color:var(--text-strong)]">{dict.title}</h3>
        <NewsletterForm compact locale={locale} source={source} ctaLabel={locale === "fr" ? "Rejoindre" : "Join"} />
      </section>
    );
  }

  return (
    <section className="do-hero rounded-3xl p-8 md:p-10">
      <p className="do-kicker">{dict.badge}</p>
      <h3 className="mt-2 text-2xl font-bold text-[color:var(--text-strong)] md:text-3xl">{dict.title}</h3>
      <p className="mt-3 max-w-2xl text-[color:var(--text)]">
        {dict.description}
      </p>
      <ul className="mt-4 space-y-1 text-sm text-[color:var(--text)]">
        {bullets.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <NewsletterForm locale={locale} source={source} ctaLabel={dict.cta} />
      <p className="mt-3 text-xs text-[color:var(--muted)]">
        {locale === "fr"
          ? "Pas de spam. Briefs actualite + systemes actionnables pour etudiants IA/CS."
          : "No spam. News briefs + actionable weekly systems for AI/CS students."}
      </p>
    </section>
  );
}
