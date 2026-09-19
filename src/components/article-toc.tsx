"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

type TocItem = {
  id: string;
  label: string;
};

type ArticleTocProps = {
  title: string;
  items: TocItem[];
  className?: string;
};

export function ArticleToc({ title, items, className = "" }: ArticleTocProps) {
  // The heading the reader scrolled to, set by the observer. Empty until one
  // is seen, so the hash (or the first item) decides what is highlighted first.
  const [observedId, setObservedId] = useState("");

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  // The location hash is browser state, not React state. Reading it inside the
  // effect and calling setState meant an extra render on every article load,
  // and a flash of the wrong heading highlighted in between. useSyncExternalStore
  // reads it during render instead, and the server snapshot is empty so the
  // markup still matches on hydration.
  const subscribeToHash = useCallback((onChange: () => void) => {
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const hashId = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash.replace("#", ""),
    () => ""
  );

  const activeId =
    observedId || (hashId && itemIds.includes(hashId) ? hashId : items[0]?.id || "");

  useEffect(() => {
    if (!itemIds.length) return;

    const sections = itemIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setObservedId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-18% 0px -65% 0px",
        threshold: [0.15, 0.45, 0.7]
      }
    );

    sections.forEach((section) => observer.observe(section));

    // Clicking a link in this list jumps to the heading, which the observer
    // then reports. Clearing the observed id lets the new hash take over
    // immediately rather than waiting for the scroll to settle.
    const onHashChange = () => setObservedId("");
    window.addEventListener("hashchange", onHashChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [itemIds]);

  if (items.length < 2) return null;

  return (
    <nav aria-label={title} className={`surface mt-6 rounded-2xl p-4 md:p-5 ${className}`}>
      <p className="do-kicker">{title}</p>
      <ol className="mt-3 space-y-1.5">
        {items.map((item, index) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? "location" : undefined}
                className={`group flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition ${
                  active
                    ? "border-[color:var(--primary)]/45 bg-[color:var(--bg-soft)]/50 text-[color:var(--text-strong)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:border-[color:var(--primary)]/35"
                }`}
              >
                <span
                  className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border text-[11px] font-semibold ${
                    active
                      ? "border-[color:var(--primary)]/50 text-[color:var(--text-strong)]"
                      : "border-[color:var(--border)] text-[color:var(--muted)] group-hover:text-[color:var(--text)]"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 truncate">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
