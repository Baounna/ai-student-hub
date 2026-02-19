"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";

function switchLocale(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length) {
    return `/${nextLocale}`;
  }

  if (segments[0] === "en" || segments[0] === "fr") {
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  }

  return `/${nextLocale}/${segments.join("/")}`;
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setQuery(window.location.search || "");
    }
  }, [pathname]);

  return (
    <div className="inline-flex h-10 items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1 text-xs font-semibold">
      {(["en", "fr"] as const).map((target) => {
        const active = target === locale;

        return (
          <Link
            key={target}
            href={`${switchLocale(pathname, target)}${query}`}
            className={`inline-flex h-8 min-w-[42px] items-center justify-center rounded-lg px-2 ${
              active
                ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                : "text-[color:var(--muted)] hover:text-[color:var(--text)]"
            }`}
            hrefLang={target}
            aria-current={active ? "page" : undefined}
          >
            {target.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
