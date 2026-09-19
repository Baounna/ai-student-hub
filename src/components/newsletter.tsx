import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { NewsletterForm } from "@/components/newsletter-form";
import { getEmailProvider } from "@/lib/runtime-config";

type NewsletterProps = {
  compact?: boolean;
  locale?: Locale;
  source?: string;
};


/**
 * Say the list is closed before someone types, not after.
 *
 * With no email provider configured the API accepts the address, discards it,
 * and answers "not open for signups yet". Honest — but only once the reader
 * has handed over their email. Until then the block promised "1 main email per
 * week", a 30-day sprint plan and interview prep, on the most prominent CTA on
 * the homepage.
 *
 * This is a server component, so it can read the provider at render time and
 * show the real state. The promises come back automatically the moment
 * EMAIL_PROVIDER is set, because they are the same strings either way.
 */
function ClosedNotice({ locale }: { locale: Locale }) {
  return (
    <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <p className="text-sm text-[color:var(--text)]">
        {locale === "fr"
          ? "Les inscriptions ne sont pas encore ouvertes. Rien n'est collecte pour l'instant."
          : "Signups are not open yet. Nothing is being collected for now."}
      </p>
      <p className="mt-2 text-xs text-[color:var(--muted)]">
        {locale === "fr" ? "En attendant, les articles sont ici : " : "In the meantime, the writing is here: "}
        <Link href={`/${locale}/blog`} className="do-link">
          {locale === "fr" ? "le blog" : "the blog"}
        </Link>
        .
      </p>
    </div>
  );
}

export function Newsletter({ compact = false, locale = "en", source }: NewsletterProps) {
  const dict = getDictionary(locale).newsletter;
  const listIsOpen = getEmailProvider() !== "none";
  const bullets =
    locale === "fr"
      ? [
          "1. Top signaux IA/CS de la semaine en version actionnable",
          "2. Plan sprint 30 jours avec jalons hebdomadaires",
          "3. Workflow candidatures + preparation entretien"
        ]
      : [
          "1. Weekly AI + Cybersecurity signals translated into practical actions",
          "2. 30-day sprint plan with weekly milestones",
          "3. Application + interview prep workflow"
        ];
  const cadenceLine =
    locale === "fr"
      ? "Frequence: 1 email principal par semaine + alertes importantes occasionnelles."
      : "Cadence: 1 main email per week + occasional high-signal alerts.";

  if (compact) {
    return (
      <section className="surface rounded-2xl p-6">
        <p className="do-kicker">Newsletter</p>
        <h3 className="mt-2 text-lg font-semibold text-[color:var(--text-strong)]">{dict.title}</h3>
        {listIsOpen ? (
          <>
            <p className="mt-2 text-xs text-[color:var(--muted)]">{cadenceLine}</p>
            <NewsletterForm compact locale={locale} source={source} ctaLabel={locale === "fr" ? "Rejoindre" : "Join"} />
          </>
        ) : (
          <ClosedNotice locale={locale} />
        )}
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

      {listIsOpen ? (
        <>
          <p className="mt-3 text-xs text-[color:var(--muted)]">{cadenceLine}</p>
          <NewsletterForm locale={locale} source={source} ctaLabel={dict.cta} />
          <p className="mt-3 text-xs text-[color:var(--muted)]">
            {locale === "fr"
              ? "Pas de spam. Briefs actualite + systemes actionnables pour etudiants IA/CS."
              : "No spam. News briefs + actionable weekly systems for AI + Cybersecurity students."}
          </p>
        </>
      ) : (
        <ClosedNotice locale={locale} />
      )}
    </section>
  );
}
