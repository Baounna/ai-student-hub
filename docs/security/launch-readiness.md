# Launch Readiness (Security + Reliability)

This document is the final internet-launch safety checklist for AI and Cybersecurity News.
Scope: local verification before any hosting deployment.

## Security architecture (final)

1. Edge/browser protections
- CSP is nonce-based and generated in `middleware.ts`.
- Static CSP in `next.config.mjs` is disabled to avoid policy conflicts.
- Security headers in `next.config.mjs`:
  - `Strict-Transport-Security` (production)
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy`
  - `Permissions-Policy`

2. API abuse controls
- Distributed rate limiting backed by Upstash Redis when configured:
  - `src/lib/rate-limit.ts`
- Automatic in-memory fallback for local/dev.
- Per-endpoint/per-IP rate limits on:
  - `/api/auth/credentials/login`
  - `/api/auth/credentials/register`
  - `/api/newsletter`
  - `/api/account-access`
  - `/api/track`
  - OAuth start + callback routes
- Login lockout + progressive backoff:
  - `getLoginLockStatus`
  - `recordFailedLoginAttempt`
  - `clearFailedLoginAttempts`

3. Auth/session safety
- Signed session tokens (`AUTH_SESSION_SECRET`) with strict validation.
- Logout invalidates session using server-side revocation denylist:
  - `src/lib/session-revocation.ts`
- Session cookie flags:
  - `httpOnly`
  - `secure` in production
  - `sameSite=lax`
  - explicit `maxAge`

4. Input and request safety
- Mutation origin checks in `src/lib/security.ts`.
- Sanitization for email/name/source/query inputs in `src/lib/input.ts`.
- JSON body size guards for all JSON POST endpoints (`parseJsonBody` with `maxBytes`).
- Tracking payload schema validation before forwarding (`src/lib/tracking-schema.ts`).
- Safe outbound URL validation (`src/lib/url.ts`, `src/lib/security.ts`).

5. Bot protection toggle
- Optional Turnstile verification for newsletter/auth forms.
- Toggle via env:
  - `BOT_PROTECTION_MODE=none|turnstile`
  - `NEXT_PUBLIC_BOT_PROTECTION_MODE=none|turnstile`
- Graceful fallback when disabled.

## Required environment variables (security-critical)

Must be set before launch:

- `SITE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `AUTH_SESSION_SECRET`
- `NEXT_PUBLIC_CONTACT_EMAIL`
- `NEXT_PUBLIC_LEGAL_NAME`

Feature-dependent:

- GA4:
  - `ANALYTICS_MODE=ga4`
  - `GA4_MEASUREMENT_ID`
- ConvertKit:
  - `EMAIL_PROVIDER=convertkit`
  - `CONVERTKIT_FORM_ID`
  - `CONVERTKIT_API_KEY`
- Credentials backend:
  - `AUTH_CREDENTIALS_BACKEND=file|supabase`
  - `AUTH_USERS_STORE_PATH` (if file backend)
  - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (if supabase backend)
- OAuth:
  - `ENABLE_OAUTH=true` (or `OAUTH_MODE=enable`)
  - provider keys
- Distributed rate limits/session revocation:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- Bot protection:
  - `BOT_PROTECTION_MODE=turnstile`
  - `NEXT_PUBLIC_BOT_PROTECTION_MODE=turnstile`
  - `TURNSTILE_SECRET_KEY`
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

## P1 blockers (must be zero)

1. `npm run verify:security` passes.
2. `npm run verify:production` passes.
3. `npm run lint` and `npm run build` pass.
4. No localhost/non-HTTPS production URLs.
5. No public pages leaking private strategy text.
6. Legal + affiliate disclosure pages are visible and consistent.

## Incident rollback checklist

Use this sequence for fast containment if production issues appear:

1. Stop high-risk ingress
- Set `ENABLE_OAUTH=false` if OAuth abuse is suspected.
- Set `BOT_PROTECTION_MODE=turnstile` to increase friction on auth/newsletter abuse.

2. Reduce external dependencies temporarily
- Set `EMAIL_PROVIDER=none` if ConvertKit failures block user flows.
- Set `ANALYTICS_MODE=none` if analytics scripts cause runtime regressions.

3. Protect auth/session surface
- Rotate `AUTH_SESSION_SECRET` if token compromise is suspected.
- Keep logout invalidation active and force re-login after secret rotation.
- Tighten rate limits in `src/lib/rate-limit.ts` if brute-force spikes continue.

4. Stabilize monetization and outbound paths
- Remove invalid affiliate/donation URLs from env (UI auto-hides invalid links).
- Keep fallback CTAs active to avoid dead buttons.

5. Verify and recover
- Run full gate suite:
  - `npm run verify:security`
  - `npm run verify:production`
  - `npm run verify:affiliates`
  - `npm run verify:public-content`
  - `npm run verify:agents`
- Re-enable disabled integrations one-by-one after stability.

## Pre-launch checklist (local)

1. Security gates
- `npm run verify:security`
- `npm run verify:production`

2. Quality gates
- `npm run lint`
- `npm run build`
- `npm run verify:affiliates`
- `npm run verify:public-content`
- `npm run verify:agents`

3. Manual smoke tests
- EN/FR auth register/login/logout/account
- newsletter submit success/error states
- tracking events for lead magnet / affiliate / product checkout
- tools/resources/blog CTA click-throughs

## Post-launch monitoring checklist

First 24h:
- Monitor `429` spikes on auth/newsletter/track endpoints.
- Monitor auth failure ratio (login attempts vs successful sessions).
- Verify `lead_magnet_click`, `newsletter_submit_success`, `affiliate_click`, `product_checkout_click`.
- Validate no CSP violations blocking essential scripts in browser console.

Daily (week 1):
- Check affiliate link integrity + disclosure visibility.
- Check newsletter/provider delivery success ratio.
- Check top 10 entry pages for conversion CTA visibility on mobile.
- Check Search Console for crawl/index anomalies.

Weekly:
- Review rate-limit thresholds against real traffic.
- Review security workflow outputs:
  - npm audit
  - secret scan
  - CodeQL
- Update incident notes and adjust mitigations.
