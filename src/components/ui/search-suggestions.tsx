"use client";

import Link from "next/link";
import { highlightParts, rankSuggestions, type Suggestion } from "@/lib/suggest";
import type { Locale } from "@/i18n/config";

type Props = {
  query: string;
  entries: Suggestion[];
  activeIndex: number;
  listboxId: string;
  optionId: (index: number) => string;
  locale: Locale;
  onPick: () => void;
  onHover: (index: number) => void;
};

const KIND_LABEL: Record<Suggestion["k"], { en: string; fr: string }> = {
  guide: { en: "Guide", fr: "Guide" },
  compare: { en: "Comparison", fr: "Comparatif" },
  tool: { en: "Tool", fr: "Outil" },
  internship: { en: "Internship", fr: "Stage" }
};

export function suggestionsFor(query: string, entries: Suggestion[]) {
  return rankSuggestions(query, entries, 8);
}

export function SearchSuggestions({
  query,
  entries,
  activeIndex,
  listboxId,
  optionId,
  locale,
  onPick,
  onHover
}: Props) {
  if (!entries.length) return null;

  return (
    <ul
      id={listboxId}
      role="listbox"
      aria-label={locale === "fr" ? "Suggestions" : "Suggestions"}
      className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] py-1 shadow-2xl"
    >
      {entries.map((entry, index) => {
        const parts = highlightParts(entry.t, query);
        return (
          // Index-first key: rankSuggestions guarantees these are unique now,
          // but a list whose key can collide fails by silently keeping a stale
          // row rather than by throwing, so it is not worth relying on.
          <li key={`${index}-${entry.k}-${entry.h}-${entry.t}`} role="none">
            <Link
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              href={entry.h}
              onClick={onPick}
              onMouseEnter={() => onHover(index)}
              // The active option is styled from state rather than :hover, so
              // the keyboard and the mouse highlight the same row.
              className={`flex items-baseline gap-2 px-3 py-2 text-sm no-underline ${
                index === activeIndex ? "bg-[color:var(--bg-soft)]" : ""
              }`}
              tabIndex={-1}
            >
              <span className="min-w-0 flex-1 truncate text-[color:var(--text-strong)]">
                {parts.map((part, i) =>
                  // Odd indices are the matched runs.
                  i % 2 === 1 ? (
                    <strong key={i} className="font-semibold text-[color:var(--primary)]">
                      {part}
                    </strong>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
                {entry.s ? <span className="ml-2 text-xs text-[color:var(--muted)]">{entry.s}</span> : null}
              </span>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted)]">
                {KIND_LABEL[entry.k][locale === "fr" ? "fr" : "en"]}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
