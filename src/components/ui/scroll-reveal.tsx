"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_SELECTORS = [
  "main > section",
  "main > article",
  "main > div > section",
  "main > div > article",
  "main .do-hero",
  "main .surface",
  "main .blog-stream-card",
  "main .blog-aside-card",
  "main .tools-step-card",
  "main .tools-metric-card"
].join(", ");

function isRevealCandidate(element: HTMLElement) {
  if (element.dataset.revealIgnore === "true") return false;
  if (element.closest("header, footer, nav, aside")) return false;
  const rect = element.getBoundingClientRect();
  return rect.height > 48 && rect.width > 220;
}

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const targets = Array.from(new Set(Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTORS))));
    const candidates = targets.filter(isRevealCandidate);
    if (!candidates.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          element.classList.add("js-reveal-in");
          observer.unobserve(element);
        }
      },
      {
        root: null,
        threshold: 0.14,
        rootMargin: "0px 0px -12% 0px"
      }
    );

    candidates.forEach((element, index) => {
      const delay = Math.min(index * 28, 220);
      element.style.setProperty("--reveal-delay", `${delay}ms`);
      const { top } = element.getBoundingClientRect();
      if (top <= window.innerHeight * 0.88) {
        element.classList.add("js-reveal-in");
        return;
      }

      element.classList.add("js-reveal");
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
