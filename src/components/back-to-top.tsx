"use client";

import { useEffect, useState } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 650);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={`fixed right-4 z-40 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-xs font-semibold text-[color:var(--text)] shadow-lg backdrop-blur-xl transition md:right-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      } bottom-24 md:bottom-8`}
    >
      ↑ Top
    </button>
  );
}
