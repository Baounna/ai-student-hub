"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // The error arrived here and went nowhere: it was destructured away unused,
  // so a failure that happened during a client render — which never touches
  // the server and so is never in a server log — left no record at all. One
  // line, and it matches what [lang]/error.tsx does, so both boundaries report
  // the same way rather than each having its own idea.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    // Same reason as not-found.tsx: this renders inside the root layout, whose
    // skip link targets #main-content, and without the id that link was inert.
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center"
    >
      <p className="do-kicker">Application Error</p>
      <h1 className="font-display mt-3 text-4xl font-bold text-[color:var(--text-strong)] md:text-5xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-xl text-[color:var(--text)]">
        An unexpected error occurred. Retry the action or return to the homepage.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/en" className="btn-secondary">
          Go home
        </Link>
      </div>
    </main>
  );
}
