# AI Student Hub

AI Student Hub is a production-ready, bilingual (EN/FR) AI + CS publication for students.
It combines:
- Weekly AI/CS news briefs
- Practical engineering blog content
- Conversion-oriented resources/comparisons/product pages
- Ethical monetization foundations (affiliate + digital product + email)

Built with Next.js 14 App Router.

## Core Product Scope

- Localized platform under `/en` and `/fr`
- Dark mode default + light mode toggle
- Student-focused homepage with encyclopedia-style structure
- News hub + news detail pages
- Live-source stream + in-article latest updates blocks
- Blog hub + post pages + category/tag archives
- Auto web ingestion agent (scheduled, no manual intervention)
- Internal blog operator agent (scheduled private growth report + action queue)
- Resources page for tool recommendations (affiliate-ready)
- Comparison pages for high-intent SEO
- 14-day growth sprint page for execution and early monetization
- Product page for low-ticket digital guide
- Newsletter capture with optional ConvertKit integration
- Social auth-ready account flows (Google/GitHub/LinkedIn)
- Event tracking pipeline (GA4 + webhook compatible)

## Professional Features Included

- SEO foundations
  - Route-level metadata
  - Canonical URLs + hreflang alternates (`en`, `fr`, `x-default`)
  - OpenGraph + Twitter cards
  - Search engine verification support (Google/Bing/Yandex/Baidu)
  - `sitemap.xml`
  - `robots.txt`
  - `manifest.webmanifest`
  - RSS feed (`/feed.xml`) including blog + news
  - JSON-LD for articles/news articles
- Internationalization
  - Dictionary-based EN/FR content system
  - Localized routes and hreflang alternates
- Conversion system
  - Lead magnet CTAs
  - In-article monetization callouts
  - Resources and compare pathways
  - Product checkout CTA tracking hooks
- Account + auth system
  - Social OAuth entry routes for Google/GitHub/LinkedIn
  - Account access API endpoint (`/api/account-access`)
  - Session cookie signing and validation
  - Account page (`/{lang}/account`) + logout endpoint
- Reliability and safety
  - API rate limiting
  - Newsletter honeypot
  - Security headers in `next.config.mjs`
  - Error and not-found pages
  - Health endpoint (`/health`)

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- ESLint

## Key Routes

### Localized app routes
- `/{lang}` home
- `/{lang}/news`
- `/{lang}/news/live`
- `/{lang}/news/[slug]`
- `/{lang}/news/auto/[slug]`
- `/{lang}/blog`
- `/{lang}/blog/[slug]`
- `/{lang}/blog/category/[category]`
- `/{lang}/blog/tag/[tag]`
- `/{lang}/resources`
- `/{lang}/compare`
- `/{lang}/compare/[slug]`
- `/{lang}/growth-sprint`
- `/{lang}/about`
- `/{lang}/product/ai-career-guide`
- `/{lang}/register`
- `/{lang}/login`
- `/{lang}/account`
- `/{lang}/donate`
- `/{lang}/privacy`
- `/{lang}/terms`
- `/{lang}/affiliate-disclosure`

### Utility + API routes
- `/sitemap.xml`
- `/robots.txt`
- `/feed.xml`
- `/health`
- `/api/newsletter`
- `/api/account-access`
- `/api/auth/oauth/[provider]`
- `/api/auth/oauth/[provider]/callback`
- `/api/auth/logout`
- `/api/track`

### Legacy redirects
- `/compare` -> `/en/compare`
- `/compare/[slug]` -> `/en/compare/[slug]`
- `/blog` -> `/en/blog`
- `/about` -> `/en/about`
- `/resources` -> `/en/resources`
- `/growth-sprint` -> `/en/growth-sprint`
- `/register` -> `/en/register`
- `/login` -> `/en/login`
- `/account` -> `/en/account`
- `/donate` -> `/en/donate`

## Project Structure (simplified)

```txt
src/
  app/
    [lang]/
      page.tsx
      layout.tsx
      news/
      blog/
      resources/
      compare/
      about/
      product/
      privacy/
      terms/
      affiliate-disclosure/
    api/
      account-access/
      auth/
      newsletter/
      track/
    feed.xml/
    health/
    sitemap.ts
    robots.ts
    globals.css
  components/
    ui/
    newsletter.tsx
    newsletter-form.tsx
    editorial-trust.tsx
    latest-updates-block.tsx
  content/
    posts.ts
    news.ts
    auto-news.ts
    auto-news.json
  i18n/
    config.ts
    dictionaries.ts
    helpers.ts
  lib/
    auth-session.ts
    live-news.ts
    oauth.ts
    site-url.ts
    rate-limit.ts
    request.ts
    track.ts
```

## Run Locally

1. Install dependencies

```bash
npm install
```

2. Run dev server

```bash
npm run dev
```

3. Open

- `http://localhost:3000` (redirects to `/en`)

4. Pull latest web updates manually (optional)

```bash
npm run auto:news
```

5. Run internal blog operator agent manually (optional)

```bash
npm run agent:blog
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill your real production values.

Environment is grouped by:
- Brand + site URLs
- Search engine verification tokens (Google/Bing/Yandex/Baidu)
- Donation links (non-Stripe supported first)
- OAuth toggle/mode and provider keys (`ENABLE_OAUTH` or `OAUTH_MODE`)
- Email provider mode (`convertkit` or `none`)
- Affiliate links (`AFFILIATE_1..5`)
- Social proof/testimonials
- Founder + LinkedIn copy
- Tracking (`ANALYTICS_MODE`, `GA4_MEASUREMENT_ID`, `TRACKING_WEBHOOK_URL`)
- Legal text overrides
- Optional local tracking debug (`TRACKING_DEBUG`, `NEXT_PUBLIC_TRACKING_DEBUG`)
- Optional internal operator assumptions (`AGENT_*`)
- Optional internal page flags (`ENABLE_INTERNAL_GROWTH_SPRINT`)

## 10-Minute Production Setup

1. Create `.env.local` and set at minimum:
   - `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
   - `SITE_URL=https://your-domain.com`
   - `AUTH_SESSION_SECRET` (long random string)
   - `NEXT_PUBLIC_CONTACT_EMAIL`
   - `NEXT_PUBLIC_LEGAL_NAME`
   - `GOOGLE_SITE_VERIFICATION` (recommended)
   - do not use localhost values for production URLs
2. Set product checkout:
   - `NEXT_PUBLIC_PRODUCT_CHECKOUT_URL`.
3. Choose OAuth mode:
   - `ENABLE_OAUTH=false` (email-only auth UI)
   - or `ENABLE_OAUTH=true` + provider keys.
   - legacy fallback is still supported: `OAUTH_MODE=enable|disable`
4. If OAuth is enabled, configure provider callbacks:
   - Google callback: `https://your-domain.com/api/auth/oauth/google/callback`
   - GitHub callback: `https://your-domain.com/api/auth/oauth/github/callback`
   - LinkedIn callback: `https://your-domain.com/api/auth/oauth/linkedin/callback`
5. Choose email provider mode:
   - `EMAIL_PROVIDER=none` (capture endpoint active without ConvertKit forwarding)
   - or `EMAIL_PROVIDER=convertkit` with `CONVERTKIT_FORM_ID` and `CONVERTKIT_API_KEY`.
6. Choose email auth security mode:
   - `EMAIL_AUTH_MODE=oauth_only` (recommended production, no unverified email session issuance)
   - `EMAIL_AUTH_MODE=insecure_demo` (dev/demo only)
7. Add donation and affiliate links:
   - `NEXT_PUBLIC_DONATION_PRIMARY_URL`/`PAYPAL`/`KOFI`/`GITHUB_SPONSORS`
   - `AFFILIATE_1..5` URLs and placements
8. Keep internal growth page private in production:
   - `ENABLE_INTERNAL_GROWTH_SPRINT=false` (default recommended)
9. Verify affiliate coverage:

```bash
npm run verify:affiliates
```

10. Run production preflight:

```bash
npm run verify:production
```

11. Run:

```bash
npm run lint && npm run build
```

12. Deploy to Vercel, then re-test:
   - `/en`, `/fr`
   - `/en/login`, `/en/register`, `/en/account`
   - `/en/donate`
   - `/sitemap.xml`, `/feed.xml`, `/robots.txt`

## Google Indexing Checklist (Production)

1. In Google Search Console, add your property (`https://your-domain.com`).
2. Use the meta verification token:
   - set `GOOGLE_SITE_VERIFICATION` in environment variables.
3. Redeploy and verify ownership in Search Console.
4. Submit sitemap:
   - `https://your-domain.com/sitemap.xml`
5. Request indexing for priority URLs first:
   - `/en`
   - `/en/news`
   - `/en/blog`
   - `/en/resources`
   - `/en/compare`
6. Confirm crawlability:
   - `https://your-domain.com/robots.txt` returns allow rules + sitemap + host.
7. Monitor Search Console weekly:
   - indexing status
   - core web vitals
   - top queries and CTR.

## Analytics and Event Tracking

Events are validated through an allowlist + payload sanitizer:
- `src/lib/tracking-schema.ts`
- `src/lib/track.ts`
- `src/app/api/track/route.ts`

Tracked monetization events:
- `lead_magnet_click`
- `newsletter_submit_success`
- `affiliate_click`
- `product_checkout_click`
- `auth_login_attempt`
- `auth_register_attempt`

Behavior:
- Client sends events to `/api/track`.
- If `ANALYTICS_MODE=ga4` and `GA4_MEASUREMENT_ID` is set, events are also sent to `gtag`.
- If `TRACKING_WEBHOOK_URL` is configured, server forwards sanitized events to your webhook.
- Local debugging only: set `TRACKING_DEBUG=1` and `NEXT_PUBLIC_TRACKING_DEBUG=1`.

## Email Automation (ConvertKit)

Capture endpoints:
- `/api/newsletter`
- `/api/account-access`

ConvertKit forwarding runs only when:
- `EMAIL_PROVIDER=convertkit`
- `CONVERTKIT_FORM_ID` and `CONVERTKIT_API_KEY` are present

If ConvertKit is not configured, forms still succeed (graceful fallback) without noisy public UI errors.

Automatic tagging:
- locale tag: `locale:en` or `locale:fr`
- source tag: `source:<placement>` (home/footer/post/etc.)
- account mode tag: `account_login` or `account_register`

### 5-email sequence plan (configure in ConvertKit)

1. Subject: `Your 30-day AI roadmap starts now`
   - Goal: Deliver lead magnet + execution cadence.
   - CTA: Open roadmap.
2. Subject: `Ship your first portfolio-grade AI project this week`
   - Goal: Push first project decision.
   - CTA: Read project starter article.
3. Subject: `Best student tool stack (budget + tradeoffs)`
   - Goal: Drive affiliate-intent clicks.
   - CTA: Open resources + compare pages.
4. Subject: `Internship conversion system for AI students`
   - Goal: Move readers toward paid product intent.
   - CTA: Open `$9-$19` student guide.
5. Subject: `Your 90-day interview-ready execution plan`
   - Goal: Convert hesitant subscribers.
   - CTA: Checkout product or re-enter roadmap.

## Auth Behavior

- OAuth mode:
  - `ENABLE_OAUTH=true` to use Google/GitHub/LinkedIn (recommended for production identity trust).
  - `ENABLE_OAUTH=false` for email/local flow only.
  - legacy fallback: `OAUTH_MODE=enable|disable`.
- Email auth mode:
  - `EMAIL_AUTH_MODE=oauth_only` (default/recommended): email forms capture requests, but do not create an authenticated session.
  - `EMAIL_AUTH_MODE=insecure_demo`: email forms can create a local signed session immediately (use only for local demos).
- If ConvertKit is configured, the same flow can also forward contact capture tags for email automation.

## Content Workflow

### Add a blog post
- Edit `src/content/posts.ts`
- Add:
  - EN/FR localized copy
  - category/tags/keywords
  - references list (sources)
  - related posts + monetization callout links

### Add a news brief
- Edit `src/content/news.ts`
- Add:
  - EN/FR localized title/summary
  - takeaways + action steps
  - source link
  - related blog post slugs

### Live AI/CS update stream
- Route: `/{lang}/news/live`
- Data source: `src/lib/live-news.ts`
- Pulls latest items from trusted AI/CS RSS/Atom feeds every 30 minutes.
- Use this stream to pick high-signal topics, then publish curated briefs with explicit sources.

### In-article latest updates
- Blog and news article pages now include an automatic "Latest AI/CS updates (with sources)" block.
- Each item links to the original source publication.
- This keeps article pages fresh without manual edits to every article.

### Auto brief pages from web signals
- Route: `/{lang}/news/auto/[slug]`
- Each auto-ingested web signal gets an internal brief page with:
  - source reference links
  - student impact context
  - action steps + execution links
- News hub now links to these internal auto briefs and to the original source.

### Fully automatic web-ingestion agent
- Script: `scripts/auto-news-agent.mjs`
- Output data: `src/content/auto-news.json`
- UI surface: `/{lang}/news` (auto section) and article latest-updates blocks
- Master automation workflow: `.github/workflows/agents-master.yml` (`hourly` profile)
- Schedule: every hour (`15 * * * *`)
- Legacy manual workflow: `.github/workflows/auto-news-agent.yml` (`workflow_dispatch` only)
- Behavior:
  - fetch trusted AI/CS feeds
  - deduplicate by title+URL
  - keep only recent items (default 45 days)
  - commit updated `auto-news.json` automatically

Optional agent env knobs:
- `AUTO_NEWS_MAX_ITEMS` (default `240`)
- `AUTO_NEWS_MAX_AGE_DAYS` (default `45`)

### Internal Blog Operator Agent (private)
- Script: `scripts/blog-operator-agent.mjs`
- Local command: `npm run agent:blog`
- Master automation workflow: `.github/workflows/agents-master.yml` (`daily` profile)
- Schedule: daily (`35 6 * * *`)
- Legacy manual workflow: `.github/workflows/blog-operator-agent.yml` (`workflow_dispatch` only)
- Outputs (private repo files, not public routes):
  - `docs/agent/latest-report.md`
  - `docs/agent/next-actions.json`
  - `docs/agent/issues-state.json`
  - `docs/agent/issues-report.md`
  - `docs/agent/drafts/*.md` (review-only draft templates)
- What it does:
  - audits affiliate/email/checkout setup coverage
  - audits CTA instrumentation surfaces
  - ranks top auto-news monetization opportunities
  - computes internal monthly model vs `$10/month` target
  - generates prioritized action queue (P1/P2/P3)
  - generates private article draft templates from top opportunities
  - syncs top queued actions to GitHub Issues (when enabled)
- Optional env knob:
  - `AGENT_DRAFTS_PER_RUN` (default `2`, range `0-10`)
  - `AGENT_ISSUES_ENABLED` (default `1`)
  - `AGENT_ISSUES_MAX_PER_RUN` (default `3`)

### Operator issue sync (private)
- Script: `scripts/sync-operator-issues.mjs`
- Local command: `npm run agent:issues`
- Inputs:
  - `docs/agent/next-actions.json` (operator queue)
  - `docs/agent/design-actions.json` (design queue)
- Outputs:
  - `docs/agent/issues-state.json`
  - `docs/agent/issues-report.md`
- Behavior:
  - creates issues only for top-priority actions (capped)
  - deduplicates by stable action hash and issue title
  - supports source toggles (`operator` / `design`) per workflow run
  - runs in dry-run mode when GitHub token/repository env is missing
- Optional env knobs:
  - `AGENT_ISSUES_ENABLED` (default `1`)
  - `AGENT_ISSUES_MAX_PER_RUN` (default `3`)
  - `AGENT_ISSUES_INCLUDE_OPERATOR` (default `1`)
  - `AGENT_ISSUES_INCLUDE_DESIGN` (default `1`)

### Blog design agent (private)
- Script: `scripts/blog-design-agent.mjs`
- Local command: `npm run agent:design`
- Master automation workflow: `.github/workflows/agents-master.yml` (`weekly` profile)
- Schedule: weekly (`20 7 * * 1`)
- Legacy manual workflow: `.github/workflows/blog-design-agent.yml` (`workflow_dispatch` only)
- Outputs:
  - `docs/agent/design-report.md`
  - `docs/agent/design-actions.json`
  - `docs/agent/issues-state.json` and `docs/agent/issues-report.md` (when issue sync runs)
- Behavior:
  - scores blog design quality (index + post + style system)
  - flags missing UX/design conversion elements
  - produces prioritized design action queue (P1/P2/P3)
- Optional env knobs:
  - `DESIGN_AGENT_TARGET_SCORE` (default `88`)
  - `DESIGN_AGENT_MAX_ACTIONS` (default `10`)

### Unified agent pipeline (recommended)
- Script: `scripts/agent-pipeline.mjs`
- Local command: `npm run agent:all`
- Master workflow entrypoint: `.github/workflows/agents-master.yml`
- Outputs:
  - `docs/agent/pipeline-report.md`
  - `docs/agent/pipeline-status.json`
- Pipeline order:
  1. auto-news
  2. blog-operator
  3. blog-design
  4. issue-sync
  5. agent-health verify
- Optional env knobs:
  - `AGENT_PIPELINE_INCLUDE_AUTO_NEWS` (default `1`)
  - `AGENT_PIPELINE_INCLUDE_OPERATOR` (default `1`)
  - `AGENT_PIPELINE_INCLUDE_DESIGN` (default `1`)
  - `AGENT_PIPELINE_INCLUDE_ISSUES` (default `1`)
  - `AGENT_PIPELINE_INCLUDE_VERIFY` (default `1`)
  - `AGENT_PIPELINE_WRITE_REPORTS` (default `1`, set `0` for non-committing CI runs)
  - `AGENT_PIPELINE_ISSUES_MAX_PER_RUN` (default `6`)

Master workflow profiles:
- `hourly` (cron `15 * * * *`): auto-news only
- `daily` (cron `35 6 * * *`): auto-news + operator + issue sync + verify
- `weekly` (cron `20 7 * * 1`): design + issue sync + verify
- `full` (manual dispatch): full pipeline

### Autonomous BlogOps autopilot (A→Z)
- Script: `scripts/autopilot-agent.mjs`
- Local command: `npm run agent:autopilot`
- Workflow: `.github/workflows/autopilot-agent.yml`
- Schedule: daily (`45 6 * * *`)
- Report output: `docs/agent/autopilot-report.md`
- Execution flow:
  1. sync latest branch state
  2. run unified agents (`agent:all`)
  3. run quality gates (`lint`, `build`, `verify:production`, `verify:affiliates`, `verify:public-content`)
  4. retry once when checks fail
  5. commit + push changes automatically when checks pass
- Optional env knobs:
  - `AUTOPILOT_PULL` (default `true`)
  - `AUTOPILOT_COMMIT` (default `true` in CI, `false` locally)
  - `AUTOPILOT_PUSH` (default `false`; workflow sets `true`)
  - `AUTOPILOT_MAX_RETRIES` (default `2`)
  - `AUTOPILOT_BRANCH` (default detected branch)
  - `AUTOPILOT_COMMIT_MESSAGE`

### Agent health verify
- Script: `scripts/verify-agent-health.mjs`
- Local command: `npm run verify:agents`
- Validates:
  - required agent outputs exist
  - queue/state JSON schemas are valid
  - issue-state hash uniqueness
  - generatedAt freshness window
- Optional env knob:
  - `AGENT_HEALTH_MAX_AGE_HOURS` (default `96`)

Important:
- This operator is internal planning only.  
- It does not expose your private target/strategy on public blog pages.
- Keep the repository private if you want these internal reports private.

### Add a comparison
- Edit `src/content/posts.ts` in `comparisons`
- Add intent keyword + tools + affiliate links

## Quality Gate Before Deploy

Run:

```bash
npm run lint
npm run build
npm run verify:agents
npm run verify:affiliates
npm run verify:production
npm run verify:public-content
```

All checks should pass before release.

## Deployment Checklist

1. Deploy on Vercel and connect your custom domain.
2. Set production environment variables in Vercel:
   - `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
   - `SITE_URL=https://your-domain.com`
   - `AUTH_SESSION_SECRET` (32+ chars)
   - `ENABLE_OAUTH=true|false` (or legacy `OAUTH_MODE`)
   - `EMAIL_PROVIDER=convertkit` + `CONVERTKIT_FORM_ID` + `CONVERTKIT_API_KEY`
   - `ANALYTICS_MODE=ga4` + `GA4_MEASUREMENT_ID`
   - `GOOGLE_SITE_VERIFICATION`
   - `ENABLE_INTERNAL_GROWTH_SPRINT=false` (keep private/internal page hidden)
3. Run `npm run verify:production` before release branch merge.
4. Validate routes:
   - `/en`, `/fr`
   - `/en/news`, `/en/blog`, `/en/resources`, `/en/compare`
   - `/sitemap.xml`, `/robots.txt`, `/feed.xml`, `/health`
5. Test auth flows:
   - email login/register
   - social login (only if OAuth enabled)
6. Test newsletter/account capture API behavior with ConvertKit active.
7. Verify affiliate links and product checkout URL.
8. Verify legal pages and footer legal/contact values.
9. Validate EN/FR switching and dark/light toggle.
10. Verify GA4 receives events:
   - lead magnet CTA
   - newsletter submit
   - affiliate click
   - product checkout click
   - login/register attempts
11. Verify Search Console ownership and submit `https://your-domain.com/sitemap.xml`.
12. Validate auth session UX:
   - register -> redirect to `/account?auth=success`
   - login -> redirect to `/account?auth=success`
   - navbar account state updates correctly on navigation
