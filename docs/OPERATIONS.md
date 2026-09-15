# Operations Manual

Setup, configuration and day-to-day running of the site.
For what the project *is*, see [README.md](../README.md).
For the engineering story, see [PORTFOLIO.md](../PORTFOLIO.md).


## Core Product Scope

- Localized platform under `/en` and `/fr`
- Dark mode default + light mode toggle
- Audience-split homepage with "For Everyone" and "For Students" paths
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
  - Distributed-capable API rate limiting (Upstash + memory fallback)
  - Account lockout + progressive auth backoff
  - Session revocation denylist on logout
  - Optional Turnstile bot checks for auth/newsletter forms
- Security headers and CSP hardening
  - Nonce-based CSP in `middleware.ts`
  - Transport/frame/mime/referrer/permissions policies in `next.config.mjs`
  - Error and not-found pages
  - Health endpoint (`/health`)

## AI + CS Editorial Policy

Editorial decisions follow `docs/editorial-policy.md`.

Core rules:
- Keep AI and CS both first-class tracks.
- Do not publish uncited claims.
- Keep EN/FR parity for important updates.
- Bridge internal links between AI and CS clusters.
- Keep affiliate disclosures visible and compliant.
- Avoid private/internal planning language on public pages.

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
- `/api/auth/credentials/login`
- `/api/auth/credentials/register`
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
    auto-tools.ts
    auto-tools.json
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
npm run auto:tools
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
6. Choose auth flow mode:
   - `AUTH_FLOW_MODE=credentials` (recommended): email + password login/register.
   - `AUTH_FLOW_MODE=passwordless`: legacy email request flow.
7. Choose credentials backend (when using `AUTH_FLOW_MODE=credentials`):
   - `AUTH_CREDENTIALS_BACKEND=supabase` (recommended production)
     - set `SUPABASE_URL`
     - set `SUPABASE_SERVICE_ROLE_KEY`
     - optional `SUPABASE_USERS_TABLE=auth_users`
     - create table with `docs/auth/supabase-credentials.sql`
   - or `AUTH_CREDENTIALS_BACKEND=file` (local/dev or single-server)
     - optional `AUTH_USERS_STORE_PATH` for custom local path
8. Choose email auth security mode:
   - `EMAIL_AUTH_MODE=oauth_only` (recommended production, no unverified email session issuance)
   - `EMAIL_AUTH_MODE=insecure_demo` (dev/demo only)
9. Configure abuse protection:
   - distributed limits (recommended):
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`
   - optional bot verification:
     - `BOT_PROTECTION_MODE=turnstile`
     - `NEXT_PUBLIC_BOT_PROTECTION_MODE=turnstile`
     - `TURNSTILE_SECRET_KEY`
     - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
10. Add donation and affiliate links:
   - `NEXT_PUBLIC_DONATION_PRIMARY_URL` / `NEXT_PUBLIC_DONATION_PAYPAL_URL` / `NEXT_PUBLIC_DONATION_CARD_URL` / `NEXT_PUBLIC_DONATION_KOFI_URL` / `NEXT_PUBLIC_DONATION_GITHUB_SPONSORS_URL`
   - `AFFILIATE_1..5` URLs and placements
   - optional student tool override: `NEXT_PUBLIC_ANTIGRAVITY_URL`
11. Keep internal growth page private in production:
   - `ENABLE_INTERNAL_GROWTH_SPRINT=false` (default recommended)
12. Verify affiliate coverage:

```bash
npm run verify:affiliates
```

13. Run production preflight:

```bash
npm run verify:production
```

14. Run:

```bash
npm run lint && npm run build
```

15. After deployment on your chosen host, re-test:
   - `/en`, `/fr`
   - `/en/login`, `/en/register`, `/en/account`
   - `/en/donate`
   - `/sitemap.xml`, `/feed.xml`, `/robots.txt`

## Google Indexing Checklist (Production)

### Getting indexed — current status and the one manual step

Search engines fall into two groups here.

**Bing, Yandex, Seznam, Naver — automated, already done.** The site uses
IndexNow: a key file in `public/` proves ownership, and `npm run seo:indexnow`
posts every live sitemap URL. It runs after each news update, so new articles
are announced without anyone doing anything. No account required.

**Google — needs you to sign in once.** Google only accepts URLs through Search
Console, and verifying a property requires a human. It takes about ten minutes
and no domain purchase; the `vercel.app` address works as a property.

1. Open <https://search.google.com/search-console> and add a **URL prefix**
   property for the production site URL.
2. Choose **HTML tag** verification and copy the `content` value.
3. In Vercel, set `GOOGLE_SITE_VERIFICATION` to that value for Production, then
   redeploy. The tag is already wired into the app's metadata — the variable is
   all that is missing.
4. Click **Verify**, then submit `/sitemap.xml` under Sitemaps.
5. Use **URL Inspection → Request indexing** on the ten best written guides.
   Aggregated news pages are not worth requesting; original writing is.

Until step 3 is done the site has zero indexed pages in Google, and nothing
else in this file changes that.

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

### 7-email sequence plan (configure in ConvertKit)

Use `docs/email-sequence.md` for the full automation:
- 7 emails with subject + goal + CTA + target page
- source/locale segmentation
- soft CTA, product CTA, and recovery CTA copy blocks

Short version:
1. Deliver roadmap and execution expectation.
2. Push tools-lab click.
3. Push first practical guide.
4. Drive high-intent tool decision.
5. Introduce paid student guide.
6. Handle objections + route to resources.
7. Final conversion push (checkout or fallback path).

## Auth Behavior

- Auth flow mode:
  - `AUTH_FLOW_MODE=credentials` (default/recommended): register/login with email + password.
  - `AUTH_FLOW_MODE=passwordless`: keeps legacy email request flow (`/api/account-access`).
- Credentials backend:
  - `AUTH_CREDENTIALS_BACKEND=supabase` (recommended): persistent DB-backed auth users.
  - `AUTH_CREDENTIALS_BACKEND=file`: local JSON store (default path `./data/auth-users.json` or `AUTH_USERS_STORE_PATH` override).
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
- Script: `scripts/auto-tools-agent.mjs`
- Output data: `src/content/auto-tools.json`
- UI surface: `/{lang}/compare` (tools automation section)
- Behavior:
  - fetch trusted first-party release feeds/pages for AI/CS tools
  - detect new tool launches/updates (NotebookLM, Gamma, Perplexity, Cursor, Notion, cloud and dev platforms)
  - reject blocked sources like arXiv in auto-ingestion path
  - deduplicate and keep recent updates only
  - keep source labels and official links on every item

- Script: `scripts/auto-news-agent.mjs`
- Output data: `src/content/auto-news.json`
- UI surface: `/{lang}/news` (auto section) and article latest-updates blocks
- Primary freshness workflow: `.github/workflows/auto-news-agent.yml` (scheduled every 2 hours + manual dispatch, direct push for `auto-news.json` + `auto-tools.json`)
- Manual maintenance workflow: `.github/workflows/autopilot-agent.yml` (`workflow_dispatch` only)
- Manual fallback workflow: `.github/workflows/agents-master.yml` (`workflow_dispatch` only)
- Behavior:
  - fetch trusted AI/CS feeds and official newsroom pages
  - keep only official first-party links (allows vetted same-org domains like `claude.ai` for Anthropic)
  - reject blocked sources like arXiv in auto-ingestion path
  - deduplicate by title+URL
  - keep only recent items (default 45 days)
  - preserve existing dataset if all external sources fail in one run
  - write official-source bootstrap fallback when feed is empty or below minimum threshold
  - commit updated `auto-news.json` and `auto-tools.json` automatically

Optional agent env knobs:
- `AUTO_TOOLS_MAX_ITEMS` (default `120`)
- `AUTO_TOOLS_MAX_PER_SOURCE` (default `16`, hard per-source cap in stored dataset)
- `AUTO_TOOLS_UI_MAX_PER_SOURCE` (default `8`, per-source cap in UI block)
- `AUTO_TOOLS_MAX_AGE_DAYS` (default `120`)
- `AUTO_TOOLS_MIN_BOOTSTRAP_ITEMS` (default `8`, minimum cached items before fallback writes official baseline tools)

Optional auto-news env knobs:
- `AUTO_NEWS_MAX_ITEMS` (default `240`)
- `AUTO_NEWS_MAX_PER_SOURCE` (default `24`, hard per-source cap in stored dataset)
- `AUTO_NEWS_STRICT_SOURCE_CAP` (default `1`, keep strict cap to avoid one source dominating)
- `AUTO_NEWS_UI_MAX_PER_SOURCE` (default `12`, per-source cap in auto-news UI blocks)
- `LIVE_NEWS_MAX_PER_SOURCE` (default `8`, per-source cap in live stream UI)
- `AUTO_NEWS_MAX_AGE_DAYS` (default `45`)
- `AUTO_NEWS_MIN_BOOTSTRAP_ITEMS` (default `6`, minimum cached items before fallback writes official baseline news)

### Internal Blog Operator Agent (private)
- Script: `scripts/blog-operator-agent.mjs`
- Local command: `npm run agent:blog`
- Primary automation workflow: `.github/workflows/auto-news-agent.yml` (scheduled freshness)
- Maintenance execution workflow: `.github/workflows/autopilot-agent.yml` (manual maintenance run)
- Manual fallback workflow: `.github/workflows/agents-master.yml` (`workflow_dispatch` only)
- Legacy manual workflow: `.github/workflows/blog-operator-agent.yml` (`workflow_dispatch` only)
- Outputs (private repo files, not public routes):
  - `docs/agent/latest-report.md`
  - `docs/agent/next-actions.json`
  - `docs/agent/daily-checklist.md`
  - `docs/agent/issues-state.json`
  - `docs/agent/issues-report.md`
  - `docs/agent/drafts/*.md` (review-only draft templates)
- What it does:
  - audits affiliate/email/checkout setup coverage
  - audits CTA instrumentation surfaces
  - audits AI+CS editorial balance (track share + category coverage)
  - audits citation coverage on blog/news content blocks
  - checks blog/news split navigation presence for AI and CS tracks
  - ranks top auto-news monetization opportunities
  - computes internal monthly model vs `$10/month` target
  - generates prioritized action queue (P1/P2/P3)
  - generates private article draft templates from top opportunities
  - syncs top queued actions to GitHub Issues (when enabled)
- Optional env knob:
  - `AGENT_DRAFTS_PER_RUN` (default `2`, range `0-10`)
  - `AGENT_MIN_CS_SHARE` (default `0.35`)
  - `AGENT_MAX_AI_SHARE` (default `0.60`)
  - `AGENT_ISSUES_ENABLED` (default `1`)
  - `AGENT_ISSUES_MAX_PER_RUN` (default `3`)

### Blog Writer Agent — LLM full drafts (private, optional)
- Script: `scripts/blog-writer-agent.mjs`
- Local command: `npm run agent:writer`
- What it does:
  - reads the operator's ranked `opportunities` (falls back to `auto-news.json`)
  - calls the Claude API (`claude-opus-4-8`) to write **full, bilingual (EN/FR)**
    article drafts — real prose, not the template outlines the operator emits
  - writes review-required drafts to `docs/agent/drafts/llm/*.md`
- Safety:
  - **never auto-publishes** — adding a post to the live site is still a manual
    edit to `src/content/posts.ts`
  - **skips gracefully (exit 0)** when `ANTHROPIC_API_KEY` is unset, so it is safe
    to leave unconfigured; it is intentionally **not** part of the scheduled
    pipeline to avoid unattended API spend — run it on demand
  - drafts are review-gated because an LLM can still get facts wrong; the model is
    instructed to cite only the provided source and not invent URLs
- Optional env knobs:
  - `ANTHROPIC_API_KEY` (required to run; else skips)
  - `ANTHROPIC_MODEL` (default `claude-opus-4-8`)
  - `AGENT_WRITER_DRAFTS_PER_RUN` (default `2`, range `0-10`)
  - `AGENT_WRITER_MAX_TOKENS` (default `16000`)

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
- Primary automation workflow: `.github/workflows/auto-news-agent.yml` (scheduled freshness)
- Maintenance execution workflow: `.github/workflows/autopilot-agent.yml` (manual maintenance run)
- Manual fallback workflow: `.github/workflows/agents-master.yml` (`workflow_dispatch` only)
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
- Primary scheduled workflow entrypoint: `.github/workflows/auto-news-agent.yml`
- Maintenance workflow entrypoint: `.github/workflows/autopilot-agent.yml` (manual dispatch)
- Manual fallback entrypoint: `.github/workflows/agents-master.yml` (`workflow_dispatch` only)
- Outputs:
  - `docs/agent/pipeline-report.md`
  - `docs/agent/pipeline-status.json`
- Pipeline order:
  1. auto-tools
  2. auto-news
  3. blog-operator
  4. blog-design
  5. daily-checklist generator
  6. issue-sync
  7. agent-health verify
  8. public-content privacy verify
- Optional env knobs:
  - `AGENT_PIPELINE_INCLUDE_AUTO_TOOLS` (default `1`)
  - `AGENT_PIPELINE_INCLUDE_AUTO_NEWS` (default `1`)
  - `AGENT_PIPELINE_INCLUDE_OPERATOR` (default `1`)
  - `AGENT_PIPELINE_INCLUDE_DESIGN` (default `1`)
  - `AGENT_PIPELINE_INCLUDE_DAILY_CHECKLIST` (default `1`)
  - `AGENT_PIPELINE_INCLUDE_ISSUES` (default `1`)
  - `AGENT_PIPELINE_INCLUDE_VERIFY` (default `1`)
  - `AGENT_PIPELINE_INCLUDE_PUBLIC_CONTENT_VERIFY` (default `1`)
  - `AGENT_PIPELINE_WRITE_REPORTS` (default `1`, set `0` for non-committing CI runs)
  - `AGENT_PIPELINE_ISSUES_MAX_PER_RUN` (default `6`)

Master workflow profiles (`agents-master.yml`, manual dispatch only):
- `hourly`: auto-tools + auto-news + checklist
- `daily`: auto-tools + auto-news + operator + checklist + issue sync + verify
- `weekly`: design + checklist + issue sync + verify
- `full`: full pipeline

### Semi-autopilot PR mode (manual review fallback)
- Workflow: `.github/workflows/agents-semi-autopilot-pr.yml`
- Trigger: manual dispatch
- Behavior:
  - runs auto-tools + auto-news + operator + design + daily checklist + issue sync + verification
  - does **not** push directly to main (PR only)
  - opens/updates PR branch `bot/semi-autopilot` for safe review before merge

### Automation single source of truth

- Primary scheduled content freshness: `.github/workflows/auto-news-agent.yml`
- Manual maintenance workflow: `.github/workflows/autopilot-agent.yml`
- `agents-master.yml` is kept for manual execution only (no schedule).
- `agents-semi-autopilot-pr.yml` is kept as manual PR fallback.
- This avoids conflicting runs and duplicate commits.

| Workflow | Trigger mode | Purpose | Recommended usage |
| --- | --- | --- | --- |
| `.github/workflows/auto-news-agent.yml` | `schedule` + `workflow_dispatch` | Frequent auto-news + auto-tools refresh and direct commit of `src/content/auto-news.json` + `src/content/auto-tools.json` | Primary content freshness |
| `.github/workflows/autopilot-agent.yml` | `workflow_dispatch` only | Autonomous maintenance run (quality gates + commit/push + report) | Manual maintenance |
| `.github/workflows/agents-semi-autopilot-pr.yml` | `workflow_dispatch` only | Manual semi-autopilot run that opens/updates PR instead of direct push | Manual PR fallback |
| `.github/workflows/agents-master.yml` | `workflow_dispatch` only | Manual pipeline runs by profile (`hourly`, `daily`, `weekly`, `full`) | Manual fallback |

### Autonomous BlogOps autopilot (A→Z)
- Script: `scripts/autopilot-agent.mjs`
- Local command: `npm run agent:autopilot`
- Workflow: `.github/workflows/autopilot-agent.yml`
- Trigger: manual dispatch
- Report output: `docs/agent/autopilot-report.md`
- Execution flow:
  1. sync latest branch state
  2. run unified agents (`agent:all`)
  3. run quality gates (`lint`, `build`, `verify:production`, `verify:affiliates`, `verify:public-content`, `verify:agents`)
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

## Growth Operating Docs

- Revenue model and conversion assumptions: `docs/revenue-model.md`
- 7-email monetization sequence: `docs/email-sequence.md`
- AI/CS/tools content clusters + money keywords: `docs/content-clusters.md`
- KPI dashboard spec and alert thresholds: `docs/kpi-dashboard.md`
- Semi-autopilot run mode and PR workflow: `docs/agent/semi-autopilot.md`
- Funnel operational QA checklist: `docs/qa/funnel-checklist.md`
- Pre-Vercel UI and accessibility checklist: `docs/qa/pre-vercel-ui-checklist.md`
- Launch content batch (6 posts + 2 tools + 1 product push): `docs/launch/content-batch-01.md`
- Security launch readiness matrix (P1/P2): `docs/security/launch-readiness.md`

## Quality Gate Before Deploy

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run verify:security
npm run verify:agents
npm run verify:affiliates
npm run verify:production
npm run verify:public-content
```

All checks should pass before release.

`lint`, `typecheck`, `test`, and `build` also run automatically on every push and
pull request via `.github/workflows/ci.yml`.

### Unit tests

- Runner: [Vitest](https://vitest.dev/) (`npm run test`, or `npm run test:watch`).
- Location: `tests/*.test.ts`, with the `@/` alias resolved in `vitest.config.ts`.
- Coverage focuses on the security-sensitive lib layer: URL safety (`src/lib/url.ts`),
  the SSRF webhook guard (`src/lib/security.ts`), client-IP parsing (`src/lib/request.ts`),
  the tracking allowlist/sanitizer (`src/lib/tracking-schema.ts`), and OAuth error copy.

Production startup also enforces runtime config validation (fails fast if critical env is invalid), so keep `.env.local` and host env values aligned before any deploy.

## Security CI Workflows

- `.github/workflows/security-npm-audit.yml`
  - runs `npm audit --audit-level=high`
  - fails on high/critical dependency vulnerabilities
- `.github/workflows/security-secrets-scan.yml`
  - runs repository secret scan baseline (gitleaks)
- `.github/workflows/security-codeql.yml`
  - runs CodeQL analysis for JavaScript/TypeScript

## Deployment Checklist

1. Deploy to any Node.js host (self-hosted, VPS, Docker, cloud app runner) and connect your custom domain.
2. Set production environment variables in your hosting provider:
   - `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
   - `SITE_URL=https://your-domain.com`
   - if file backend: optional `AUTH_USERS_STORE_PATH`
   - `ENABLE_OAUTH=true|false` (or legacy `OAUTH_MODE`)
   - `EMAIL_PROVIDER=convertkit` + `CONVERTKIT_FORM_ID` + `CONVERTKIT_API_KEY`
   - `ANALYTICS_MODE=ga4` + `GA4_MEASUREMENT_ID`
   - `GOOGLE_SITE_VERIFICATION`
   - `ENABLE_INTERNAL_GROWTH_SPRINT=false` (keep private/internal page hidden)
3. Run `npm run verify:production` before release branch merge.
4. Run `npm run verify:security` before release branch merge.
5. Validate routes:
   - `/en`, `/fr`
   - `/en/news`, `/en/blog`, `/en/resources`, `/en/compare`
   - `/sitemap.xml`, `/robots.txt`, `/feed.xml`, `/health`
6. Test auth flows:
   - email login/register
   - social login (only if OAuth enabled)
7. Test newsletter/account capture API behavior with ConvertKit active.
8. Verify affiliate links and product checkout URL.
9. Verify legal pages and footer legal/contact values.
10. Validate EN/FR switching and dark/light toggle.
11. Verify GA4 receives events:
   - lead magnet CTA
   - newsletter submit
   - affiliate click
   - product checkout click
   - login/register attempts
12. Verify Search Console ownership and submit `https://your-domain.com/sitemap.xml`.
13. Validate auth session UX:
   - register -> redirect to `/account?auth=success`
   - login -> redirect to `/account?auth=success`
   - navbar account state updates correctly on navigation

For rollback/incident handling and post-launch monitoring, use:
- `docs/security/launch-readiness.md`
