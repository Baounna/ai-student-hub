# Funnel QA Checklist (AI and Cybersecurity News)

Use this checklist before weekly content pushes and after any monetization/auth changes.

## A) Lead magnet click tracking

- Surface checks:
  - Home hero CTA
  - Blog intro/end CTA
  - Tools sticky CTA
  - Footer CTA
- Expected:
  - Event fires: `lead_magnet_click`
  - Payload includes: `page`, `locale`
- Verify:
  - GA4 Realtime -> Event stream
  - Webhook receiver logs (if `TRACKING_WEBHOOK_URL` is enabled)

## B) Newsletter submit + segmentation

- Surface checks:
  - Home newsletter
  - Footer newsletter
  - Blog post newsletter
  - Tools page newsletter
  - Product page newsletter
- Expected:
  - Event fires: `newsletter_submit_success`
  - Payload includes source tag (`home`, `footer`, `blog_post`, `tools_page`, `product_page`)
  - ConvertKit receives locale/source tags when configured
- Verify:
  - Submit test emails (EN + FR)
  - ConvertKit subscriber tags
  - GA4 Realtime event payload
  - API response status from `/api/newsletter`

## C) Affiliate click tracking

- Surface checks:
  - Resources cards
  - Blog mid-article tool block
  - Blog related tools table
  - Tools/compare matrices
- Expected:
  - Event fires: `affiliate_click`
  - Outbound links include `rel="noopener noreferrer sponsored"`
- Verify:
  - Browser devtools network / click behavior
  - GA4 Realtime
  - Webhook logs

## D) Product checkout tracking

- Surface checks:
  - Product hero CTA
  - Home tertiary CTA
  - Blog CTA stack
  - Tools sticky CTA
- Expected:
  - Event fires: `product_checkout_click`
  - If checkout URL missing, UI falls back to roadmap/tools links (no dead button)
- Verify:
  - GA4 Realtime
  - Webhook logs
  - Manual click-through opens expected checkout URL

## E) Auth flow QA (credentials)

- Paths:
  - `/{lang}/register`
  - `/{lang}/login`
  - `/{lang}/account`
- Expected:
  - Register succeeds with valid password policy
  - Login succeeds and session is visible on account page
  - Logout clears session
  - Events fire:
    - `auth_register_attempt`
    - `auth_login_attempt`
- Verify:
  - UI flow end-to-end EN + FR
  - API route responses:
    - `/api/auth/credentials/register`
    - `/api/auth/credentials/login`
    - `/api/auth/logout`
  - GA4/Webhook events

## F) Weekly pass criteria

- No broken CTA buttons
- No 4xx/5xx on auth/newsletter/track endpoints during QA
- All required tracking events seen in GA4/webhook
- At least one active affiliate CTA per: home, resources, blog post, tools page

## G) Quick command checks

Run:

```bash
npm run lint
npm run build
npm run verify:security
npm run verify:production
npm run verify:affiliates
npm run verify:public-content
npm run verify:agents
```
