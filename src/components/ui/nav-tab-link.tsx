"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavTabLinkProps = {
  href: string;
  label: string;
  activeClassName: string;
  inactiveClassName: string;
  className?: string;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavTabLink({ href, label, activeClassName, inactiveClassName, className = "" }: NavTabLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${active ? activeClassName : inactiveClassName} ${className}`.trim()}
    >
      {label}
    </Link>
  );
}
