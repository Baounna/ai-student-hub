"use client";

import { useEffect, useState } from "react";
import { applyTheme, appearanceStorageKeys, type Theme } from "@/lib/appearance";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(appearanceStorageKeys.theme);
    const initial = stored === "light" ? "light" : "dark";
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-10 w-[118px] rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]" aria-hidden />
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex h-10 items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1"
    >
      {(["dark", "light"] as const).map((option) => {
        const active = theme === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => {
              setTheme(option);
              applyTheme(option);
            }}
            aria-pressed={active}
            className={`inline-flex h-8 min-w-[52px] items-center justify-center rounded-lg px-2 text-xs font-semibold ${
              active
                ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                : "text-[color:var(--muted)] hover:text-[color:var(--text)]"
            }`}
          >
            {option === "dark" ? "Dark" : "Light"}
          </button>
        );
      })}
    </div>
  );
}
