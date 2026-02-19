"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
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
