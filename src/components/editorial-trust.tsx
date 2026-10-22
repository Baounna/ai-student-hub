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
        {fr ? "Charte éditoriale" : "Editorial integrity"}
      </h2>
      <ul className={`mt-3 text-sm text-[color:var(--text)] ${compact ? "space-y-1.5" : "space-y-2"}`}>
        {/* This read "Weekly AI + Cybersecurity updates", word for word the
            same line the home page prints a few hundred pixels above, and it
            was a promise rather than a record: the newest hand-written piece is
            24 September 2026 and there are two publishing dates in seven
            months. The weekly thing that does happen is the scheduled job that
            re-checks the internship list every Monday, which every entry
            timestamps and the page says out loud. Claim that instead. */}
        <li>
          1.{" "}
          {/* "every entry says when" was an absolute, and two listings break it:
              a row the checker cannot verify shows "we could not verify this
              link" INSTEAD of a date, by design. This panel renders on eleven
              templates in both languages, so it was the site's most repeated
              claim and it was wrong by two rows. Say what is actually true,
              which is the better promise anyway: a date, or an admission,
              never silence. */}
          {fr
            ? "La liste des stages est revérifiée chaque semaine : chaque offre affiche sa date de vérification, ou indique que nous n'avons pas pu la vérifier."
            : "The internship list is re-checked every week, and every entry either shows its check date or says we could not verify it."}
        </li>
        <li>2. {fr ? "Sources explicites et références visibles." : "Explicit sources and visible references."}</li>
        <li>3. {fr ? "Recommandations orientées exécution et petit budget." : "Execution-first recommendations with budget-friendly constraints."}</li>
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
        <Link href={`/${locale}/affiliate-disclosure`} className="do-link py-1.5">
          {fr ? "Liens" : "Links"}
        </Link>
        <span>•</span>
        <Link href={`/${locale}/privacy`} className="do-link py-1.5">
          {fr ? "Confidentialité" : "Privacy"}
        </Link>
      </div>
    </section>
  );
}
