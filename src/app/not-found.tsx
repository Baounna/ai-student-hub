import Link from "next/link";

export default function NotFound() {
  return (
    // The skip link in the root layout points at #main-content, and this
    // boundary renders inside that layout. Without the id the link led nowhere:
    // pressing Enter on "Skip to content" did nothing at all, on the one page a
    // lost reader is most likely to be keyboarding around.
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center"
    >
      <p className="do-kicker">404</p>
      <h1 className="font-display mt-3 text-4xl font-bold text-[color:var(--text-strong)] md:text-5xl">Page not found</h1>
      <p className="mt-3 max-w-xl text-[color:var(--text)]">
        The page you requested does not exist or has moved. Use the main routes below to continue.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/en" className="btn-primary">
          Go home
        </Link>
        <Link href="/en/blog" className="btn-secondary">
          Browse blog
        </Link>
      </div>
    </main>
  );
}
