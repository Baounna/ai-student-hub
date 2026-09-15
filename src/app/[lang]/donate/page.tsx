import type { Metadata } from "next";
import Link from "next/link";
import { EditorialTrust } from "@/components/editorial-trust";
import { Newsletter } from "@/components/newsletter";
import { siteConfig } from "@/config/site";
import { isLocale, type Locale } from "@/i18n/config";
import { localizedAlternates } from "@/i18n/helpers";
import { getSeoKeywords } from "@/lib/seo";
import { isSafeHttpUrl } from "@/lib/url";

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.lang)) return {};

  const fr = params.lang === "fr";
  const title = fr ? "Faire un don" : "Donate";
  const description = fr
    ? "Soutiens AI and Cybersecurity News pour financer du contenu pratique IA/CS pour etudiants."
    : "Support AI and Cybersecurity News and fund practical AI + Cybersecurity education content for students.";

  return {
    title,
    description,
    keywords: getSeoKeywords(params.lang, "about", [
      fr ? "don education ia" : "donate ai education",
      fr ? "soutenir blog ia etudiant" : "support student ai blog"
    ]),
    alternates: localizedAlternates("/donate", params.lang)
  };
}

export default async function LocalizedDonatePage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params;
  if (!isLocale(params.lang)) return null;

  const locale: Locale = params.lang;
  const fr = locale === "fr";
  const primaryMethods = [
    {
      name: "PayPal",
      href: siteConfig.donation.paypalUrl,
      detail: fr ? "PayPal avec cartes bancaires (Mastercard, Visa)." : "PayPal with card checkout (Mastercard, Visa).",
      badges: ["PayPal", "Mastercard", "Visa"]
    },
    {
      name: siteConfig.donation.cardLabel,
      href: siteConfig.donation.cardUrl,
      detail: fr ? "Paiement carte bancaire securise." : "Secure card payment checkout.",
      badges: ["Mastercard", "Visa"]
    }
  ];

  const availablePrimaryMethods = primaryMethods.filter((item) => isSafeHttpUrl(item.href));
  const seenPrimaryUrls = new Set<string>();
  const uniquePrimaryMethods = availablePrimaryMethods.filter((item) => {
    const key = (item.href || "").trim().replace(/\/+$/, "").toLowerCase();
    if (!key) return false;
    if (seenPrimaryUrls.has(key)) return false;
    seenPrimaryUrls.add(key);
    return true;
  });
  const hasLiveDonationLinks = uniquePrimaryMethods.length > 0;
  const donationSignals = siteConfig.socialProofStats.length
    ? siteConfig.socialProofStats.slice(0, 3)
    : fr
      ? [
          "Contenu pratique publie regulierement pour etudiants IA/CS.",
          "Sources explicites et references visibles.",
          "Approche execution-first adaptee aux budgets etudiants."
        ]
      : [
          "Practical content published consistently for AI + Cybersecurity students.",
          "Explicit sources and visible references.",
          "Execution-first approach aligned with student budgets."
        ];

  return (
    <div className="page-shell max-w-6xl py-10 md:py-14">
      <section className="do-hero rounded-3xl p-7 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr] lg:items-end">
          <div>
            <p className="do-kicker">{fr ? "Soutien" : "Support"}</p>
            <h1 className="font-display hero-title mt-3 font-bold text-[color:var(--text-strong)]">
              {fr ? "Soutiens AI and Cybersecurity News" : "Support AI and Cybersecurity News"}
            </h1>
            <p className="body-copy mt-4 max-w-3xl text-[color:var(--text)]">
              {fr
                ? "Chaque don finance la recherche, la production d'articles de qualite, et des ressources accessibles pour etudiants IA/CS."
                : "Every donation funds research, high-quality articles, and accessible resources for AI + Cybersecurity students."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "100% education etudiante" : "100% student education"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Mises a jour mensuelles" : "Monthly updates"}
              </span>
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs text-[color:var(--muted)]">
                {fr ? "Execution IA/CS" : "AI + Cybersecurity execution"}
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
        <div className="min-w-0 space-y-6">
          {uniquePrimaryMethods.length > 0 ? (
            <section className="grid gap-4 md:grid-cols-2">
              {uniquePrimaryMethods.map((method, index) => (
                <article key={method.name} className="card-hover glass rounded-2xl p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    {fr ? `Methode ${index + 1}` : `Method ${index + 1}`}
                  </p>
                  <h2 className="font-display mt-1 text-xl font-semibold text-[color:var(--text-strong)]">{method.name}</h2>
                  <p className="mt-2 text-sm text-[color:var(--text)]">{method.detail}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {method.badges.map((badge) => (
                      <span
                        key={`${method.name}-${badge}`}
                        className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--muted)]"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  <a href={method.href} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 inline-flex">
                    {fr ? "Faire un don" : "Donate now"}
                  </a>
                </article>
              ))}
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-3">
            {donationSignals.map((signal, index) => (
              <article key={`${index}-${signal}`} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  {fr ? `Signal ${index + 1}` : `Signal ${index + 1}`}
                </p>
                <p className="mt-2 text-sm font-medium text-[color:var(--text-strong)]">{signal}</p>
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
                    <a
                      href={uniquePrimaryMethods[0]?.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary mt-3 inline-flex"
                    >
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
                  ? "Tu peux soutenir le projet via le guide etudiant ou en partageant AI and Cybersecurity News."
                  : "You can support the project via the student guide or by sharing AI and Cybersecurity News."}
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
                    ? "Cela depend du mode choisi et de tes parametres de confidentialite."
                    : "It depends on your selected payment method and privacy settings."}
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
