"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";

type SessionState = {
  authenticated: boolean;
  user: {
    name: string;
    email: string;
    provider: string;
  } | null;
};

export function AuthLinks({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [state, setState] = useState<SessionState | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) throw new Error("failed");
        const data = (await response.json()) as { authenticated?: boolean; user?: SessionState["user"] };
        if (!active) return;
        setState({
          authenticated: Boolean(data.authenticated),
          user: data.user || null
        });
      } catch {
        if (!active) return;
        setState({ authenticated: false, user: null });
      }
    }

    void loadSession();
    return () => {
      active = false;
    };
  }, [pathname]);

  if (!state) {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-[color:var(--muted)]">
        <span className="h-8 w-24 animate-pulse rounded-lg bg-[color:var(--surface)]" />
        <span className="h-8 w-16 animate-pulse rounded-lg bg-[color:var(--surface)]" />
      </div>
    );
  }

  if (state.authenticated) {
    const logoutHref = `/api/auth/logout?locale=${locale}&returnTo=${encodeURIComponent(`/${locale}/login?logged_out=1`)}`;
    const accountActive = pathname === `/${locale}/account`;

    return (
      <div className="inline-flex items-center gap-2 text-sm">
        <Link href={`/${locale}/account`} className={accountActive ? "utility-link-primary" : "utility-link"}>
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[10px] font-bold uppercase text-[color:var(--text-strong)]">
            {(state.user?.name || "U").charAt(0)}
          </span>
          {locale === "fr" ? "Mon compte" : "My account"}
        </Link>
        <a href={logoutHref} className="utility-link">
          {locale === "fr" ? "Se deconnecter" : "Log out"}
        </a>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <Link
        href={`/${locale}/register`}
        className={pathname === `/${locale}/register` ? "utility-link-primary" : "utility-link"}
      >
        {locale === "fr" ? "Creer un compte" : "Create account"}
      </Link>
      <Link href={`/${locale}/login`} className={pathname === `/${locale}/login` ? "utility-link-primary" : "utility-link"}>
        {locale === "fr" ? "Se connecter" : "Log in"}
      </Link>
    </div>
  );
}
