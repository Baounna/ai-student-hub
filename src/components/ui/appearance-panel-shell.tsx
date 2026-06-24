"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { AppearancePanel } from "@/components/ui/appearance-panel";

type AppearancePanelShellProps = {
  locale: Locale;
};

const HIDDEN_SUFFIXES = new Set(["login", "register", "account", "privacy", "terms", "affiliate-disclosure", "donate"]);
const HIDDEN_ROOT_SEGMENTS = new Set(["compare"]);

export function AppearancePanelShell({ locale }: AppearancePanelShellProps) {
  const pathname = usePathname();
  if (!pathname) return <AppearancePanel locale={locale} />;

  const normalized = pathname.replace(/\/+$/, "");
  const segments = normalized.split("/").filter(Boolean);
  const rootSegment = segments[1] ?? "";
  const lastSegment = segments[segments.length - 1];

  if (rootSegment && HIDDEN_ROOT_SEGMENTS.has(rootSegment)) {
    return null;
  }

  if (lastSegment && HIDDEN_SUFFIXES.has(lastSegment)) {
    return null;
  }

  return <AppearancePanel locale={locale} />;
}
