"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";

type Item = {
  href: string;
  label: string;
  icon: ReactNode;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileQuickNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const rootPage = segments[1] ?? "";
  const hideOnUtilityPages = new Set(["login", "register", "account", "privacy", "terms", "affiliate-disclosure", "donate"]);
  const hideOnReadingPage =
    segments.length >= 3 && ["blog", "news", "compare"].includes(segments[1] ?? "");
  const hideOnProductPage = segments.length >= 3 && segments[1] === "product";

  if (hideOnReadingPage || hideOnProductPage || hideOnUtilityPages.has(rootPage)) return null;

  const iconClass = "h-3.5 w-3.5";
  const items: Item[] = [
    {
      href: `/${locale}/news`,
      label: locale === "fr" ? "Actu" : "News",
      icon: (
        <svg viewBox="0 0 20 20" className={iconClass} aria-hidden>
          <path
            fill="currentColor"
            d="M3 4.75A1.75 1.75 0 0 1 4.75 3h8.5A1.75 1.75 0 0 1 15 4.75v10.5A1.75 1.75 0 0 1 13.25 17h-8.5A1.75 1.75 0 0 1 3 15.25V4.75Zm2.25.25a.75.75 0 0 0-.75.75V7h9V5.75a.75.75 0 0 0-.75-.75h-7.5ZM4.5 8.5v6.75c0 .414.336.75.75.75h7.5a.75.75 0 0 0 .75-.75V8.5h-9ZM6 10h2.5v1.25H6V10Zm0 2.25h6V13.5H6v-1.25Z"
          />
        </svg>
      )
    },
    {
      href: `/${locale}/blog`,
      label: "Blog",
      icon: (
        <svg viewBox="0 0 20 20" className={iconClass} aria-hidden>
          <path
            fill="currentColor"
            d="M4.25 3A1.25 1.25 0 0 0 3 4.25v11.5C3 16.44 3.56 17 4.25 17h11.5c.69 0 1.25-.56 1.25-1.25V4.25C17 3.56 16.44 3 15.75 3H4.25Zm.25 3h11v9.75a.25.25 0 0 1-.25.25H4.75a.25.25 0 0 1-.25-.25V6Zm1.5 2h5v1.25h-5V8Zm0 2.25h8v1.25H6v-1.25Zm0 2.25h8v1.25H6V12.5Z"
          />
        </svg>
      )
    },
    {
      href: `/${locale}/resources`,
      label: locale === "fr" ? "Ress." : "Res.",
      icon: (
        <svg viewBox="0 0 20 20" className={iconClass} aria-hidden>
          <path
            fill="currentColor"
            d="M11.72 2.91a4 4 0 0 0 4.47 5.37l-5.73 5.73a2.25 2.25 0 1 1-3.18 3.18l5.73-5.73a4 4 0 0 0-5.37-4.47l2.18 2.18-1.77 1.77-2.88-2.88a4 4 0 0 1 5.55-5.7ZM9.05 15.06a.75.75 0 1 0-1.06 1.06.75.75 0 0 0 1.06-1.06Z"
          />
        </svg>
      )
    },
    {
      href: `/${locale}/compare`,
      label: locale === "fr" ? "Outils" : "Tools",
      icon: (
        <svg viewBox="0 0 20 20" className={iconClass} aria-hidden>
          <path
            fill="currentColor"
            d="M4 4.75C4 3.78 4.78 3 5.75 3h8.5C15.22 3 16 3.78 16 4.75v10.5c0 .97-.78 1.75-1.75 1.75h-8.5A1.75 1.75 0 0 1 4 15.25V4.75Zm1.75-.25a.25.25 0 0 0-.25.25v4.5h4V4.5h-3.75Zm5.25 0v4.75h4.5v-4.5a.25.25 0 0 0-.25-.25H11Zm-5.5 6.25v4.5c0 .14.11.25.25.25h3.75v-4.75h-4Zm5.5 4.75h3.75a.25.25 0 0 0 .25-.25v-4.5H11v4.75Z"
          />
        </svg>
      )
    }
  ];

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-1.5 shadow-[0_24px_40px_-24px_rgba(7,19,42,0.8)] backdrop-blur-xl transition-transform duration-300 md:hidden"
      style={{ paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom) * 0.4)" }}
    >
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[3.15rem] flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
                  active
                    ? "bg-[color:var(--bg-soft)]/75 text-[color:var(--text-strong)] shadow-[0_12px_22px_-16px_rgba(17,74,180,0.7)]"
                    : "text-[color:var(--muted)] hover:text-[color:var(--text)]"
                }`}
              >
                <span
                  className={`mb-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border transition ${
                    active
                      ? "scale-[1.03] border-[color:var(--primary)]/45 bg-[color:var(--primary)]/12 text-[color:var(--text-strong)]"
                      : "border-[color:var(--border)]"
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
