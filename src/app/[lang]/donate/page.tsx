import type { Metadata } from "next";
import Link from "next/link";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { siteConfig } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { alternateLanguages } from "@/i18n/helpers";
import { isSafeHttpUrl } from "@/lib/url";

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  if (!isLocale(params.lang)) return {};

  const fr = params.lang === "fr";
  const title = fr ? "Faire un don" : "Donate";
  const description = fr
    ? "Soutiens AI Student Hub pour financer du contenu pratique IA/CS pour etudiants."
    : "Support AI Student Hub and fund practical AI/CS education content for students.";

  return {
    title,
    description,
    alternates: {
      languages: alternateLanguages("/donate")
    }
  };
}

export default function LocalizedDonatePage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";
  const methods = [
    {
      name: "Buy Me a Coffee",
      href: siteConfig.donation.primaryUrl,
      detail: fr ? "Contribution rapide en un clic." : "Quick one-click contribution."
    },
    {
      name: "PayPal",
      href: siteConfig.donation.paypalUrl,
      detail: fr ? "Paiement international facile." : "Global donation checkout."
    },
    {
      name: "Ko-fi",
      href: siteConfig.donation.koFiUrl,
      detail: fr ? "Support ponctuel ou mensuel." : "One-time or monthly support."
    },
    {
      name: "GitHub Sponsors",
      href: siteConfig.donation.githubSponsorsUrl,
      detail: fr ? "Soutien public et recurrent." : "Public recurring support."
    }
  ];
  const availableMethods = methods.filter((item) => isSafeHttpUrl(item.href));
  const hasLiveDonationLinks = availableMethods.length > 0;

  return (
    <div className="page-shell max-w-6xl py-10 md:py-14">
      <section className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{fr ? "Soutien" : "Support"}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {fr ? "Soutiens AI Student Hub" : "Support AI Student Hub"}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">
              {fr
                ? "Chaque don finance la recherche, la production d'articles de qualite, et des ressources accessibles pour etudiants IA/CS."
                : "Every donation funds research, high-quality articles, and accessible resources for AI/CS students."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "100% education etudiante" : "100% student education"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Mises a jour mensuelles" : "Monthly updates"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Execution IA/CS" : "AI/CS execution"}
              </span>
            </div>
          </div>

          <div className="surface rounded-2xl p-5">
            <p className="do-kicker">{fr ? "Pourquoi contribuer" : "Why contribute"}</p>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>{fr ? "1. Plus de guides pratiques EN/FR." : "1. More practical EN/FR guides."}</li>
              <li>{fr ? "2. Comparatifs outils mis a jour regulierement." : "2. Regularly updated tool comparisons."}</li>
              <li>{fr ? "3. Experience etudiante orientee execution." : "3. Execution-first student experience."}</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          {hasLiveDonationLinks ? (
            <section className="grid gap-4 md:grid-cols-2">
              {availableMethods.map((method, index) => (
                <article key={method.name} className="card-hover glass rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">#{index + 1}</p>
                  <h2 className="font-display mt-1 text-xl font-semibold text-[color:var(--text-strong)]">{method.name}</h2>
                  <p className="mt-2 text-sm text-[color:var(--text)]">{method.detail}</p>
                  <a href={method.href} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 inline-flex">
                    {fr ? "Faire un don" : "Donate now"}
                  </a>
                </article>
              ))}
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: fr ? "Guides livres" : "Guides shipped",
                value: "20+"
              },
              {
                label: fr ? "Pays touches" : "Countries reached",
                value: "30+"
              },
              {
                label: fr ? "Mises a jour / mois" : "Updates / month",
                value: "4"
              }
            ].map((item) => (
              <article key={item.label} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-[color:var(--text-strong)]">{item.value}</p>
              </article>
            ))}
          </section>

          <section className="surface rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
              {fr ? "Contribuer par palier" : "Support tiers"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text)]">
              {fr
                ? "Choisis un niveau de soutien selon ton budget."
                : "Choose a support tier based on your budget."}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { amount: "$3", label: fr ? "Cafe support" : "Coffee support" },
                { amount: "$10", label: fr ? "Soutien mensuel" : "Monthly support" },
                { amount: "$25", label: fr ? "Sponsor etudiant" : "Student sponsor" }
              ].map((tier) => (
                <article key={tier.amount} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <p className="text-2xl font-bold text-[color:var(--text-strong)]">{tier.amount}</p>
                  <p className="mt-1 text-sm text-[color:var(--text)]">{tier.label}</p>
                  {hasLiveDonationLinks ? (
                    <a href={availableMethods[0]?.href} target="_blank" rel="noopener noreferrer" className="btn-primary mt-3 inline-flex">
                      {fr ? "Choisir" : "Select"}
                    </a>
                  ) : (
                    <Link href={`/${locale}/product/ai-career-guide`} className="btn-secondary mt-3 inline-flex">
                      {fr ? "Acheter le guide" : "Buy student guide"}
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="surface rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
              {fr ? "Ou va ton soutien" : "Where your support goes"}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[color:var(--text)]">
              <li>- {fr ? "Production de contenu EN/FR a haute valeur pratique." : "EN/FR content production with practical value."}</li>
              <li>- {fr ? "Mises a jour tools/comparatifs pour budgets etudiants." : "Frequent tools/comparison updates for student budgets."}</li>
              <li>- {fr ? "Amelioration continue du site et de l'experience learning." : "Continuous site and learning experience improvements."}</li>
            </ul>
            <div className="mt-4">
              <Link href={`/${locale}/resources`} className="do-link text-sm">
                {fr ? "Voir les ressources recommandees" : "See recommended resources"}
              </Link>
            </div>
          </section>

          {!hasLiveDonationLinks ? (
            <section className="surface rounded-2xl p-5">
              <h2 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
                {fr ? "Soutien alternatif" : "Alternative support"}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--text)]">
                {fr
                  ? "Tu peux soutenir le projet via le guide etudiant ou en partageant AI Student Hub."
                  : "You can support the project via the student guide or by sharing AI Student Hub."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary">
                  {fr ? "Voir le guide etudiant" : "Open student guide"}
                </Link>
                <Link href={`/${locale}/resources`} className="btn-secondary">
                  {fr ? "Voir les ressources" : "Open resources"}
                </Link>
              </div>
            </section>
          ) : null}

          <section className="surface rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold text-[color:var(--text-strong)]">
              {fr ? "FAQ donation" : "Donation FAQ"}
            </h2>
            <div className="mt-4 space-y-4 text-sm text-[color:var(--text)]">
              <div>
                <p className="font-semibold text-[color:var(--text-strong)]">
                  {fr ? "Est-ce un abonnement obligatoire ?" : "Is this a required subscription?"}
                </p>
                <p className="mt-1">
                  {fr
                    ? "Non. Tu peux soutenir ponctuellement ou mensuellement selon ton budget."
                    : "No. You can support once or monthly based on your budget."}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[color:var(--text-strong)]">
                  {fr ? "Les dons sont-ils publics ?" : "Are donations public?"}
                </p>
                <p className="mt-1">
                  {fr
                    ? "Cela depend de la plateforme choisie (ex: GitHub Sponsors peut etre public)."
                    : "It depends on the platform (for example GitHub Sponsors can be public)."}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[color:var(--text-strong)]">
                  {fr ? "Puis-je contribuer autrement ?" : "Can I support in another way?"}
                </p>
                <p className="mt-1">
                  {fr
                    ? "Oui: partage les articles, rejoins la newsletter et recommande le site a d'autres etudiants."
                    : "Yes: share articles, join the newsletter, and recommend the site to other students."}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-32 lg:h-fit">
          <EditorialTrust locale={locale} compact />
          <div className="surface rounded-2xl p-5">
            <h3 className="font-display text-lg font-semibold text-[color:var(--text-strong)]">
              {fr ? "Actions utiles" : "Useful actions"}
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              <Link href={`/${locale}/resources`} className="btn-secondary text-center">
                {fr ? "Ressources" : "Resources"}
              </Link>
              <Link href={`/${locale}/blog`} className="btn-secondary text-center">
                {fr ? "Blog" : "Blog"}
              </Link>
              <Link href={`/${locale}/product/ai-career-guide`} className="btn-primary text-center">
                {fr ? "Guide etudiant" : "Student guide"}
              </Link>
            </div>
          </div>
          <Newsletter compact locale={locale} source="donate_aside" />
        </aside>
      </div>
    </div>
  );
}
