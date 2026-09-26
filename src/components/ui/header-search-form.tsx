"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { sanitizeSearchInputLive, sanitizeSearchQuery } from "@/lib/input";
import type { Suggestion } from "@/lib/suggest";
import { SearchSuggestions, suggestionsFor } from "@/components/ui/search-suggestions";

/**
 * The typeahead index is fetched once per page, on the first focus of either
 * search box, and shared between them. Module scope rather than component
 * state because the header renders two of these -- desktop and mobile -- and
 * they should not each pull their own copy.
 */
const indexCache: Record<string, Suggestion[] | undefined> = {};
const indexInFlight: Record<string, Promise<Suggestion[]> | undefined> = {};

async function loadSuggestIndex(locale: string): Promise<Suggestion[]> {
  const cached = indexCache[locale];
  if (cached) return cached;
  const existing = indexInFlight[locale];
  if (existing) return existing;
  const request = fetch(`/api/search-suggest/${locale}`)
    .then((response) => (response.ok ? response.json() : []))
    .then((data: Suggestion[]) => {
      indexCache[locale] = Array.isArray(data) ? data : [];
      return indexCache[locale] as Suggestion[];
    })
    // A failed fetch must leave the box working as a plain search field, not
    // broken: suggestions are an enhancement, never a dependency.
    .catch(() => {
      indexCache[locale] = [];
      return [] as Suggestion[];
    })
    .finally(() => {
      indexInFlight[locale] = undefined;
    });
  indexInFlight[locale] = request;
  return request;
}

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

  // What the reader has typed, or null when the box should simply mirror the
  // URL. Two sources of truth for one input, so keep them apart rather than
  // copying one into the other.
  const [typed, setTyped] = useState<string | null>(null);

  // The query in the address bar is browser state. It used to be copied into
  // React state from an effect, which re-rendered the header on every single
  // navigation and briefly showed the previous page's search term. Reading it
  // during render removes both; the server snapshot is empty so hydration
  // still matches.
  const subscribeToUrl = useCallback((onChange: () => void) => {
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);

  const urlQuery = useSyncExternalStore(subscribeToUrl, extractQueryFromLocation, () => "");

  // Adjusting state during render when a prop changes is the documented React
  // pattern for exactly this, and it costs one render rather than two.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setTyped(null);
  }

  const query = typed ?? urlQuery;
  const setQuery = setTyped;

  const fr = locale === "fr";
  const inputId = mobile ? `header-search-mobile-${locale}` : `header-search-${locale}`;
  const hasQuery = query.trim().length > 0;

  const clearLabel = fr ? "Effacer la recherche" : "Clear search";
  const inputLabel = fr ? "Rechercher dans le blog" : "Search blog";
  // The trailing "..." read as a stray full stop sitting in an empty field,
  // which is exactly what a placeholder should not do: it is a hint, and a hint
  // that looks like content is worse than no hint.
  const placeholder = mobile
    ? fr
      ? "Rechercher dans le blog"
      : "Search the blog"
    : fr
      ? "Rechercher IA, backend, cloud, algorithmes"
      : "Search AI, backend, cloud, algorithms";

  function clearSearch() {
    setQuery("");
    setOpen(false);
    activeRef.current = -1;
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  const router = useRouter();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [entries, setEntries] = useState<Suggestion[]>(() => indexCache[locale] ?? []);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // React batches the state update from ArrowDown, so a fast
  // ArrowDown-then-Enter can reach the Enter handler before the new index has
  // committed and land on nothing. The ref is written synchronously in the
  // same handler, so Enter always reads the row the reader just moved to.
  const activeRef = useRef(-1);

  const suggestions = open ? suggestionsFor(query, entries) : [];
  const listboxId = `${inputId}-listbox`;
  const optionId = (index: number) => `${inputId}-option-${index}`;

  // The active row can go out of range when the query narrows the list under
  // the cursor. Clamping during render keeps aria-activedescendant pointing at
  // an element that exists.
  const activeClamped = activeIndex >= suggestions.length ? -1 : activeIndex;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!shellRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  async function primeIndex() {
    if (entries.length) return;
    const loaded = await loadSuggestIndex(locale);
    setEntries(loaded);
  }

  function onInputChange(value: string) {
    setQuery(sanitizeSearchInputLive(value));
    activeRef.current = -1;
    setActiveIndex(-1);
    setOpen(true);
    void primeIndex();
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    // An IME candidate window uses the same arrow keys and Enter. Acting on
    // them mid-composition moves the suggestion highlight and navigates away
    // instead of committing the character the reader was choosing.
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape") {
      // First Escape dismisses the list; a second clears the field. Closing and
      // clearing on the same press loses work the reader may still want.
      if (open && suggestions.length) {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (hasQuery) clearSearch();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      // Escape used to be a one-way door: with the list closed there was no key
      // that reopened it, so a keyboard user had to edit the text to get
      // suggestions back. The same trap caught anyone arriving at
      // /blog?query=ai, where the box is pre-filled but closed. APG requires
      // Down Arrow to open the popup.
      if (!open && hasQuery) {
        event.preventDefault();
        setOpen(true);
        void primeIndex();
        return;
      }
      if (!suggestions.length) return;
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const raw = activeClamped + delta;
      const next = raw < -1 ? suggestions.length - 1 : raw >= suggestions.length ? -1 : raw;
      activeRef.current = next;
      setActiveIndex(next);
      // The list scrolls now, so moving the highlight past the fold has to
      // bring the row with it.
      if (next >= 0) {
        requestAnimationFrame(() => {
          document.getElementById(optionId(next))?.scrollIntoView({ block: "nearest" });
        });
      }
      return;
    }
    const chosen = activeRef.current >= 0 && activeRef.current < suggestions.length ? activeRef.current : activeClamped;
    if (event.key === "Enter" && chosen >= 0 && suggestions[chosen]) {
      // Go where the reader pointed, rather than submitting the raw text to
      // the results page and making them pick the same item again.
      event.preventDefault();
      setOpen(false);
      router.push(suggestions[chosen].h);
    }
  }

  function onShellBlur(event: React.FocusEvent<HTMLElement>) {
    // Only when focus has left the whole shell: moving between the input and a
    // suggestion must not close it. A document mousedown handler alone left the
    // list open, and aria-expanded true, after tabbing away.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }

  const comboProps = {
    role: "combobox" as const,
    "aria-expanded": open && suggestions.length > 0,
    "aria-controls": listboxId,
    "aria-autocomplete": "list" as const,
    "aria-activedescendant": activeClamped >= 0 ? optionId(activeClamped) : undefined,
    onFocus: () => void primeIndex(),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => onInputChange(event.target.value),
    onKeyDown: onInputKeyDown
  };

  // A screen reader was told only that the popup expanded, never what landed
  // in it. WCAG 4.1.3 asks for the count as a status message.
  const announcement = !open || !hasQuery
    ? ""
    : suggestions.length === 0
      ? fr
        ? "Aucune suggestion. Appuyez sur Entree pour lancer la recherche."
        : "No suggestions. Press Enter to search."
      : fr
        ? `${suggestions.length} suggestion${suggestions.length > 1 ? "s" : ""}`
        : `${suggestions.length} suggestion${suggestions.length > 1 ? "s" : ""}`;

  const dropdown = (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <SearchSuggestions
      query={query}
      entries={suggestions}
      activeIndex={activeClamped}
      listboxId={listboxId}
      optionId={optionId}
      locale={locale}
      onPick={() => setOpen(false)}
      onHover={(index) => {
        activeRef.current = index;
        setActiveIndex(index);
      }}
      emptyLabel={
        fr ? "Appuyer sur Entree pour rechercher" : "Press Enter to search"
      }
      showEmpty={open && hasQuery}
      />
    </>
  );

  if (mobile) {
    return (
      <form action={`/${locale}/blog`} method="get" className="mt-2 flex items-center gap-2">
        <label htmlFor={inputId} className="sr-only">
          {inputLabel}
        </label>
        <div ref={shellRef} onBlur={onShellBlur} className="header-search-shell group relative min-w-0 flex-1 rounded-xl">
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
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="search"
            value={query}
            {...comboProps}
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
          {dropdown}
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
      <div ref={shellRef} onBlur={onShellBlur} className="header-search-shell group relative min-w-0 flex-1 rounded-2xl">
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
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          value={query}
          {...comboProps}
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
        {dropdown}
      </div>
      <button type="submit" className="btn-secondary h-11 min-w-[7.4rem] shrink-0 rounded-2xl px-6 py-0">
        {fr ? "Rechercher" : "Search"}
      </button>
    </form>
  );
}
