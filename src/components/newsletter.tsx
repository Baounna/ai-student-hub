import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { NewsletterForm } from "@/components/newsletter-form";
import { canAcceptSignups } from "@/lib/convertkit";

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
  // Not just "is a provider named", but "can this actually accept an address".
  // EMAIL_PROVIDER=convertkit with no form id makes subscribeConvertKit return
  // provider_not_ready and drop the address — so checking the provider alone
  // would put the promises back while signups still went nowhere. Configuration
  // arrives one variable at a time, and the gap between the first and the last
  // is exactly when a half-open form does the damage.
  const listIsOpen = canAcceptSignups();
  const bullets =
    locale === "fr"
      ? [
          "1. Les nouveaux stages, alternances et PFE de la semaine",
          "2. Date limite et lien direct pour chaque offre",
          "3. Maroc et France, filtrés pour les profils tech"
        ]
      : [
          "1. New internships, apprenticeships and final-year projects each week",
          "2. A deadline and a direct link for every listing",
          "3. Morocco and France, filtered for technical roles"
        ];
  // Promise only the cadence that is actually planned. The previous line also
  // offered "occasional high-signal alerts", which is a second commitment
  // nobody has made.
  const cadenceLine =
    locale === "fr"
      ? "Un email par semaine. Rien d'autre."
      : "One email a week. Nothing else.";

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
