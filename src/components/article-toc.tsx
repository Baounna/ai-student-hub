"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [activeId, setActiveId] = useState(items[0]?.id || "");

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    if (!itemIds.length) return;

    const fromHash = window.location.hash.replace("#", "");
    if (fromHash && itemIds.includes(fromHash)) {
      setActiveId(fromHash);
    }

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
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-18% 0px -65% 0px",
        threshold: [0.15, 0.45, 0.7]
      }
    );

    sections.forEach((section) => observer.observe(section));

    const onHashChange = () => {
      const hashId = window.location.hash.replace("#", "");
      if (hashId && itemIds.includes(hashId)) {
        setActiveId(hashId);
      }
    };

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
