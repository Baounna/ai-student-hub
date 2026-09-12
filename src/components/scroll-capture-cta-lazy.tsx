"use client";

import dynamic from "next/dynamic";
import type { Locale } from "@/i18n/config";

// `ssr: false` is only allowed inside a Client Component, so this thin wrapper
// keeps the CTA lazily loaded and client-only when used from a Server Component.
// It stays hidden until a scroll threshold is crossed, so there is nothing
// useful to server-render.
const ScrollCaptureCta = dynamic(() => import("@/components/scroll-capture-cta").then((mod) => mod.ScrollCaptureCta), {
  ssr: false
});

export function ScrollCaptureCtaLazy({ locale }: { locale: Locale }) {
  return <ScrollCaptureCta locale={locale} />;
}
