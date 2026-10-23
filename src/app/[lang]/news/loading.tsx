/**
 * /news gets its own, because it is the slowest page on the site to render and
 * the least like the others in shape.
 *
 * The parent src/app/[lang]/loading.tsx would cover this route, and it would
 * draw the wrong page: /news opens with a three-tile image strip and a feature
 * card beside a rail of related briefs, then a block of web updates, then a
 * filter row. Measured before the Suspense boundary went into page.tsx, this
 * route answered in 270.8ms against 12-18ms for everything else -- so it is
 * precisely the route where a reader spends long enough looking at the
 * placeholder for its shape to be a promise rather than a flicker.
 *
 * The reasoning behind the aria-hidden, the absence of any text and the
 * motion-safe pulse is all in the parent file; it applies here unchanged.
 */
export default function NewsLoading() {
  return (
    <section className="page-shell max-w-6xl py-10 md:py-16" aria-hidden="true">
      <div className="do-hero overflow-hidden rounded-3xl p-6 md:p-8">
        <div className="mb-6 motion-safe:animate-pulse">
          <div className="h-3 w-20 rounded-full bg-[color:var(--border)]" />
          <div className="mt-3 h-10 w-4/5 max-w-2xl rounded-2xl bg-[color:var(--border)]" />
          <div className="mt-3 h-4 w-full max-w-3xl rounded-full bg-[color:var(--border)]" />
        </div>

        <div className="grid gap-4 motion-safe:animate-pulse xl:grid-cols-[0.92fr,1.45fr]">
          <div className="space-y-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="news-related-card rounded-2xl p-4">
                <div className="h-3 w-24 rounded-full bg-[color:var(--border)]" />
                <div className="mt-3 h-4 w-11/12 rounded-full bg-[color:var(--border)]" />
                <div className="mt-2 h-4 w-3/4 rounded-full bg-[color:var(--border)]" />
              </div>
            ))}
          </div>

          <div className="news-feature-card overflow-hidden rounded-3xl">
            {/* The three tiles are grid-cols-3 at every breakpoint on the real
                page and never stack, so they are reserved at that ratio here
                too -- the strip is the tallest thing above the fold and the
                reader should not watch it push the rest of the page down. */}
            <div className="grid grid-cols-3 gap-1 p-1">
              {[0, 1, 2].map((tile) => (
                <div key={tile} className="h-[16rem] rounded-2xl bg-[color:var(--border)] md:h-[22rem]" />
              ))}
            </div>
            <div className="px-5 pb-5 pt-4 md:px-7 md:pb-7">
              <div className="h-3 w-28 rounded-full bg-[color:var(--border)]" />
              <div className="mt-3 h-8 w-5/6 rounded-2xl bg-[color:var(--border)]" />
              <div className="mt-3 h-4 w-full rounded-full bg-[color:var(--border)]" />
              <div className="mt-2 h-4 w-3/4 rounded-full bg-[color:var(--border)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 surface rounded-2xl p-6 motion-safe:animate-pulse">
        <div className="h-6 w-2/3 max-w-md rounded-xl bg-[color:var(--border)]" />
        <div className="mt-4 grid gap-3">
          {[0, 1, 2].map((row) => (
            <div key={row} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
              <div className="h-3 w-32 rounded-full bg-[color:var(--border)]" />
              <div className="mt-3 h-4 w-10/12 rounded-full bg-[color:var(--border)]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
