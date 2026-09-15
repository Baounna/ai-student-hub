# Security posture

What protects this site, what does not, and what to check when something looks
wrong. Written against the code as it stands — if an item here is not true, the
document is the bug.

Last reviewed: 2026-09-15, after an audit that tested the live deployment rather
than only reading the source.

## Attack surface

Deliberately small. There is no login, no user accounts, no password storage and
no user database — that system was removed, so the usual goals of an attack
(steal an account, dump a table) have nothing to aim at.

Everything a visitor can send input to:

| Endpoint | Method | Takes |
| --- | --- | --- |
| `/api/newsletter` | POST | email, name, locale, source |
| `/api/track` | POST | analytics event payload |
| `/api/og` | GET | title, kicker (query) |
| `/api/cover/[topic]/[slug]` | GET | two path segments |

## What is in place

**Edge and browser**
- Nonce-based CSP generated per request in `middleware.ts`. The static CSP in
  `next.config.mjs` stays off so the two cannot conflict.
- `Strict-Transport-Security` (with `preload`), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.

**Request safety**
- Origin/referer checks on every mutation (`src/lib/security.ts`), failing
  closed in production when no trustworthy browser hint is present.
- JSON body size caps on every POST (`parseJsonBody` with `maxBytes`).
- Input sanitization for email, name, source and query (`src/lib/input.ts`).
- Tracking payloads validated against a schema before anything is forwarded
  (`src/lib/tracking-schema.ts`).
- Outbound webhook targets validated against private-network ranges, so a
  misconfigured URL cannot be used to reach internal hosts
  (`isSafeWebhookTarget`).
- Structured data serialized through `src/lib/json-ld.ts`, never a bare
  `JSON.stringify`. Article schemas carry text straight from feeds we do not
  control, and `JSON.stringify` leaves `<` intact.

**Rate limiting** (`src/lib/rate-limit.ts`)
- Layered per-endpoint, per-IP, per-email and per-(email+IP) rules.
- Client IP is read only from headers the hosting platform overwrites itself.

**Abuse controls, optional**
- Honeypot field on the newsletter form.
- Turnstile verification, off unless `BOT_PROTECTION_MODE=turnstile`.

**Supply chain**
- CodeQL, `npm audit` and gitleaks secret scanning on every push.
- Dependabot for npm packages and GitHub Actions, weekly.
- CI runs with `permissions: contents: read`.

## Known limitations

These are real and currently accepted. Do not describe the site as protected
against them.

1. **Rate limit counters are per-instance.** Without
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, counters live in the
   memory of one serverless instance. Vercel runs many, so a limit of 8 may
   allow somewhat more in practice, and a burst spread across instances is
   counted separately. Set the Upstash variables to make limits exact.
2. **No bot challenge is active.** `BOT_PROTECTION_MODE` is unset, so
   `verifyBotChallenge` passes everything. The honeypot catches naive bots only.
3. **Generated images accept arbitrary paths.** `/api/cover/<anything>/<anything>`
   renders. Responses are cached immutably so normal traffic and crawlers are
   cheap, but deliberately unique URLs still cost CPU. Vercel's platform
   protection is the backstop.
4. **No email provider is connected.** Newsletter addresses are not stored and
   the form says so. Once a provider is added, revisit limitation 1 first:
   a bypassable limiter plus a live provider is a subscription-bombing tool.

## Fixed in the 2026-09-15 audit

Recorded because each was found by testing production, not by reading code.

- **Rate limit bypass.** `getClientIp` trusted `cf-connecting-ip` first. The
  site runs on Vercel, not behind Cloudflare, so nothing overwrote that header
  and a caller's own value was used. Sending a new value per request reset every
  per-IP counter. Now only platform-set headers are trusted; re-enable a proxy
  header deliberately with `TRUSTED_CLIENT_IP_HEADER`.
- **Unescaped JSON-LD.** Article `description` comes from scraped feed
  summaries, which still contained raw HTML. A summary containing `</script`
  would have closed the block. CSP would have blocked execution; that is a last
  line of defence, not the only one.
- **Scraped markup reaching readers.** Feed summaries are cut with
  `html.slice()` and can begin mid-tag; 84 stored strings carried attribute
  debris. The cleaner now handles fragments that start or end inside a tag.
- **Uncached image generation.** Both image routes served `max-age=0`, so every
  request re-rendered a PNG.
- **Dead required secret.** `AUTH_SESSION_SECRET` and the Supabase checks still
  blocked the build for a deleted account system, forcing a live secret to be
  kept for code nothing could read.

## Required environment variables

Must be set in production:

- `SITE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_CONTACT_EMAIL`
- `NEXT_PUBLIC_LEGAL_NAME`

Feature-dependent:

- Analytics: `ANALYTICS_MODE=ga4`, `GA4_MEASUREMENT_ID`
- Newsletter: `EMAIL_PROVIDER=convertkit`, `CONVERTKIT_FORM_ID`, `CONVERTKIT_API_KEY`
- Exact rate limits: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Bot protection: `BOT_PROTECTION_MODE=turnstile`,
  `NEXT_PUBLIC_BOT_PROTECTION_MODE=turnstile`, `TURNSTILE_SECRET_KEY`,
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- Behind a trusted proxy only: `TRUSTED_CLIENT_IP_HEADER`

## Gates before shipping

1. `npm run verify:security`
2. `npm run verify:production`
3. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
4. No localhost or non-HTTPS production URLs.
5. Legal and affiliate disclosure pages visible and consistent.

`npm run watchdog` runs these plus live-site checks, and the daily workflow
opens an issue when one fails.

## If something goes wrong

1. **Raise friction.** Set `BOT_PROTECTION_MODE=turnstile` (plus the public
   variable and both keys) to put a challenge in front of the newsletter form.
2. **Tighten limits.** Lower the thresholds in `src/lib/rate-limit.ts`, and add
   the Upstash variables so the limits actually hold across instances.
3. **Shed dependencies.** `EMAIL_PROVIDER=none` if the provider is failing,
   `ANALYTICS_MODE=none` if analytics breaks rendering.
4. **Check the outbound surface.** Remove invalid affiliate or donation URLs;
   the UI hides links it cannot validate.
5. **Re-verify**, then re-enable integrations one at a time.

## What to watch

First 24h after a change:
- `429` spikes on `/api/newsletter` and `/api/track`.
- CSP violations in the browser console blocking real scripts.
- Tracking events still firing: `lead_magnet_click`,
  `newsletter_submit_success`, `affiliate_click`, `product_checkout_click`.

Weekly:
- CodeQL, `npm audit` and secret-scan results.
- Dependabot PRs — these are the route a transitive security patch arrives by.
- Rate-limit thresholds against real traffic.
- Search Console for crawl and index anomalies.
