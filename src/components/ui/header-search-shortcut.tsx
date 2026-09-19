"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";

type HeaderSearchShortcutProps = {
  locale: Locale;
};

export function HeaderSearchShortcut({ locale }: HeaderSearchShortcutProps) {
  const router = useRouter();

  useEffect(() => {
    function isVisible(element: HTMLElement | null) {
      if (!element) return false;
      return element.offsetParent !== null;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingField =
        tagName === "input" || tagName === "textarea" || target?.isContentEditable;
      if (isTypingField) return;

      const desktopSearch = document.getElementById(`header-search-${locale}`) as HTMLInputElement | null;
      const mobileSearch = document.getElementById(`header-search-mobile-${locale}`) as HTMLInputElement | null;
      const headerSearch = isVisible(desktopSearch) ? desktopSearch : mobileSearch;

      event.preventDefault();
      if (headerSearch) {
        headerSearch.focus();
        headerSearch.select();
        return;
      }

      // router.push keeps the client-side navigation: location.assign threw
      // away the whole document, so pressing "/" on a page without a search
      // box reloaded the app, refetched every chunk, and lost scroll position
      // — a full page load to reach a page Next already had.
      router.push(`/${locale}/blog`);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [locale, router]);

  return null;
}
