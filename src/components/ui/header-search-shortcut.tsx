"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/config";

type HeaderSearchShortcutProps = {
  locale: Locale;
};

export function HeaderSearchShortcut({ locale }: HeaderSearchShortcutProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingField =
        tagName === "input" || tagName === "textarea" || target?.isContentEditable;
      if (isTypingField) return;

      const headerSearch = document.getElementById(`header-search-${locale}`) as HTMLInputElement | null;

      event.preventDefault();
      if (headerSearch) {
        headerSearch.focus();
        headerSearch.select();
        return;
      }

      window.location.assign(`/${locale}/blog`);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [locale]);

  return null;
}
