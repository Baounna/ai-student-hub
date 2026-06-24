"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { sanitizeSearchQuery } from "@/lib/input";

type HeaderSearchFormProps = {
  locale: Locale;
  mobile?: boolean;
};

function extractQueryFromLocation() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const query = sanitizeSearchQuery(params.get("query") || params.get("q") || "");
  return query;
}

export function HeaderSearchForm({ locale, mobile = false }: HeaderSearchFormProps) {
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(extractQueryFromLocation());
  }, [pathname]);

  const fr = locale === "fr";
  const inputId = mobile ? `header-search-mobile-${locale}` : `header-search-${locale}`;
  const hasQuery = query.trim().length > 0;

  const clearLabel = fr ? "Effacer la recherche" : "Clear search";
  const inputLabel = fr ? "Rechercher dans le blog" : "Search blog";
  const placeholder = mobile
    ? fr
      ? "Rechercher dans le blog..."
      : "Search in blog..."
    : fr
      ? "Rechercher IA, backend, cloud, algorithmes..."
      : "Search AI, backend, cloud, algorithms...";

  function clearSearch() {
    setQuery("");
    inputRef.current?.focus();
  }

  if (mobile) {
    return (
      <form action={`/${locale}/blog`} method="get" className="mt-2 flex items-center gap-2">
        <label htmlFor={inputId} className="sr-only">
          {inputLabel}
        </label>
        <div className="header-search-shell group relative min-w-0 flex-1 rounded-xl">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)] transition group-focus-within:text-[color:var(--primary)]">
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4">
              <path
                d="M8.75 3.5a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Zm-6.75 5.25a6.75 6.75 0 1 1 11.93 4.33l3.49 3.49a.75.75 0 1 1-1.06 1.06l-3.49-3.49A6.75 6.75 0 0 1 2 8.75Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <input
            ref={inputRef}
            id={inputId}
            name={hasQuery ? "query" : undefined}
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(event) => setQuery(sanitizeSearchQuery(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === "Escape" && hasQuery) clearSearch();
            }}
            placeholder={placeholder}
            maxLength={120}
            className="h-10 min-w-0 w-full rounded-xl border-0 bg-transparent pl-9 pr-9 text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] outline-none"
          />
          {hasQuery ? (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] text-xs text-[color:var(--muted)] hover:border-[color:var(--primary)]/45 hover:text-[color:var(--text-strong)]"
              aria-label={clearLabel}
            >
              ×
            </button>
          ) : null}
        </div>
        <button type="submit" className="btn-secondary h-10 shrink-0 rounded-xl px-4 py-0 text-xs">
          {fr ? "Chercher" : "Search"}
        </button>
      </form>
    );
  }

  return (
    <form action={`/${locale}/blog`} method="get" className="hidden min-w-0 flex-1 items-center gap-2 md:flex md:max-w-xl lg:max-w-2xl">
      <label htmlFor={inputId} className="sr-only">
        {fr ? "Rechercher" : "Search"}
      </label>
      <div className="header-search-shell group relative min-w-0 flex-1 rounded-2xl">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--muted)] transition group-focus-within:text-[color:var(--primary)]">
          <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4">
            <path
              d="M8.75 3.5a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Zm-6.75 5.25a6.75 6.75 0 1 1 11.93 4.33l3.49 3.49a.75.75 0 1 1-1.06 1.06l-3.49-3.49A6.75 6.75 0 0 1 2 8.75Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <input
          ref={inputRef}
          id={inputId}
          name={hasQuery ? "query" : undefined}
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(event) => setQuery(sanitizeSearchQuery(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === "Escape" && hasQuery) clearSearch();
          }}
          placeholder={placeholder}
          maxLength={120}
          className="h-11 w-full rounded-2xl border-0 bg-transparent pl-10 pr-14 text-[15px] text-[color:var(--text)] placeholder:text-[color:var(--muted)] outline-none"
        />
        {hasQuery ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] text-xs text-[color:var(--muted)] hover:border-[color:var(--primary)]/45 hover:text-[color:var(--text-strong)]"
            aria-label={clearLabel}
          >
            ×
          </button>
        ) : (
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[color:var(--muted)] xl:inline-flex">
            /
          </span>
        )}
      </div>
      <button type="submit" className="btn-secondary h-11 min-w-[7.4rem] shrink-0 rounded-2xl px-6 py-0">
        {fr ? "Rechercher" : "Search"}
      </button>
    </form>
  );
}
