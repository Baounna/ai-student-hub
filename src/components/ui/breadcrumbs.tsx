import Link from "next/link";

type Crumb = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-[color:var(--muted)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-[color:var(--text)]">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-[color:var(--text-strong)]" : ""}>{item.label}</span>
              )}
              {!isLast ? <span aria-hidden>/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
