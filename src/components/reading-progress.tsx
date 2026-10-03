"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const value = scrollHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)) : 0;
      setProgress(value);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    /* z-[60], above the header.
     *
     * This was z-40 and the header is z-50 with an opaque background, so the
     * 2px bar was painted underneath it and has been invisible at every desktop
     * width since the header was raised from z-30 to z-50 to fix a search
     * dropdown. Proved by forcing the z-index in a live frame: the green bar
     * appears. The skip link is also z-[60] and they never coexist, since the
     * skip link only has a box while focused. */
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent">
      <div
        className="h-full bg-[color:var(--primary)] transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
