/**
 * The first loading state this site has ever had.
 *
 * `find src -name loading.tsx` returned nothing before this file, which meant
 * every in-app click was answered with silence. A prefetch of one of these
 * routes comes back as 389-444 bytes -- the route tree and nothing else, which
 * is correct for a dynamic route -- while the render it is standing in for is
 * 75.8 kB for /en and 210.8 kB for /en/stages. The reader pressed a link, the
 * old page stayed on screen unchanged, and nothing moved until the whole new
 * page had been rendered on the server. There was no way to tell a slow
 * navigation from a click that had missed.
 *
 * This is deliberately the shape of a page rather than a spinner: a kicker, a
 * title, two lines of standfirst and a column of cards, drawn in the same
 * do-hero / glass / surface containers and the same border colour the real
 * pages use. It is wrong in its details on every route, which does not matter
 * -- what it has to say is "your click landed, a page of roughly this shape is
 * coming", and a spinner in the middle of an empty column says less than that.
 *
 * Two things it does not do. It does not speak: loading.tsx takes no params
 * (Next's own reference: "Loading UI components do not accept any parameters"),
 * so it cannot know whether the reader is on /en or /fr, and a skeleton that
 * announces itself in the wrong language is worse than one that stays quiet --
 * aria-hidden keeps it out of the accessibility tree, and the App Router's
 * route announcer still reads the new page's title on arrival. And it does not
 * move for a reader who has asked for less motion: motion-safe: is the only
 * reason the pulse is here at all, and this site honours that preference
 * everywhere else.
 */
export default function LocalizedLoading() {
  return (
    <section className="page-shell max-w-6xl py-10 md:py-16" aria-hidden="true">
      <div className="do-hero rounded-3xl p-6 md:p-8">
        <div className="space-y-4 motion-safe:animate-pulse">
          <div className="h-3 w-28 rounded-full bg-[color:var(--border)]" />
          <div className="h-9 w-3/4 max-w-2xl rounded-2xl bg-[color:var(--border)]" />
          <div className="h-4 w-full max-w-3xl rounded-full bg-[color:var(--border)]" />
          <div className="h-4 w-2/3 max-w-xl rounded-full bg-[color:var(--border)]" />
          <div className="flex gap-2 pt-2">
            <div className="h-11 w-36 rounded-xl bg-[color:var(--border)]" />
            <div className="h-11 w-28 rounded-xl bg-[color:var(--border)]" />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-4 motion-safe:animate-pulse">
          {[0, 1, 2].map((row) => (
            <div key={row} className="glass rounded-2xl p-6">
              <div className="h-3 w-24 rounded-full bg-[color:var(--border)]" />
              <div className="mt-4 h-6 w-5/6 rounded-xl bg-[color:var(--border)]" />
              <div className="mt-3 h-4 w-full rounded-full bg-[color:var(--border)]" />
              <div className="mt-2 h-4 w-4/5 rounded-full bg-[color:var(--border)]" />
            </div>
          ))}
        </div>

        <div className="space-y-4 motion-safe:animate-pulse">
          <div className="surface rounded-2xl p-5">
            <div className="h-4 w-32 rounded-full bg-[color:var(--border)]" />
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-4 w-full rounded-full bg-[color:var(--border)]" />
              ))}
            </div>
          </div>
          <div className="surface rounded-2xl p-5">
            <div className="h-4 w-28 rounded-full bg-[color:var(--border)]" />
            <div className="mt-4 h-11 w-full rounded-xl bg-[color:var(--border)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
