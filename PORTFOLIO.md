# AI & Cybersecurity News — Engineering Case Study

A production-grade, bilingual (EN/FR) content platform built on **Next.js 16**, with a
custom **multi-agent content-automation pipeline** and a hardened security layer.

Built solo as a final-year AI student. This document is the engineering tour — for
setup and operations, see [README.md](README.md).

> **Live:** https://ai-student-hub-navy.vercel.app · **Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind · Node ESM tooling · Vitest · GitHub Actions

---

## What it is (in one paragraph)

A bilingual editorial site for AI/CS students, plus an autonomous back office that
discovers news from 21 first-party sources, audits editorial balance and quality,
drafts articles with an LLM, and routes work to GitHub — all behind a security layer
(nonce CSP, distributed rate limiting, session revocation, SSRF/CSRF guards) that most
content sites never build.

---

## Architecture at a glance

```
┌────────────────────────── Next.js 16 App Router ──────────────────────────┐
│  /[lang]/…  localized pages (EN/FR)      /api/…  route handlers            │
│  ISR + static generation (406 pages)     auth · newsletter · track         │
│  middleware.ts → per-request nonce CSP                                      │
└───────────────┬───────────────────────────────────────┬───────────────────┘
                │ reads                                   │ writes/guards
        ┌───────▼────────┐                        ┌───────▼────────┐
        │ content model  │                        │  lib/ (core)   │
        │ posts · news · │                        │ auth-session   │
        │ auto-news/tools│                        │ rate-limit     │
        └───────▲────────┘                        │ security(SSRF) │
                │ generated                        │ oauth · seo    │
        ┌───────┴───────────────────────────┐     └────────────────┘
        │   Autonomous "BlogOps" pipeline    │
        │  (scripts/*.mjs, GitHub Actions)   │
        │                                    │
        │  aggregate → audit → LLM draft →   │
        │  quality-gate → GitHub issues/PR   │
        └────────────────────────────────────┘
```

---

## The interesting engineering

### 1. Autonomous multi-agent content pipeline (the standout)
A set of deterministic Node agents orchestrated in sequence, each with structured
JSON state and a markdown report:
- **Aggregators** pull from 21 trusted first-party feeds/pages, dedupe, age-trim,
  and reject low-trust sources (arXiv, social) — with a `curl --fail` fallback when
  `fetch` is blocked.
- **Operator agent** audits AI-vs-CS editorial balance, citation coverage, and
  conversion instrumentation, then emits a prioritized action queue.
- **Design agent** scores the UI against a weighted rubric.
- **Issue sync** turns the queues into GitHub Issues, deduped by a stable content hash.
- **Autopilot** runs the whole pipeline behind quality gates (lint → build → verify)
  and commits/pushes only when they pass, with rollback on failure.

### 2. LLM integration done safely
A Claude-powered writer (`claude-opus-4-8`, structured output) drafts full **EN/FR**
articles from the operator's ranked opportunities. Design constraints that matter:
- **Never auto-publishes** — output is review-gated and surfaced as a **pull request**.
- **Fails open, not closed** — skips gracefully without an API key so the pipeline
  never breaks because a secret is missing.
- Model is constrained to cite only provided sources (no invented URLs).

### 3. Security layer beyond the norm for a blog
- **Nonce-based CSP** generated per request in `middleware.ts`, plus a full header set
  (HSTS, COOP/CORP, frame/mime/referrer policies).
- **Distributed rate limiting** (Upstash Redis) with an in-memory fallback, and
  **progressive login lockout**.
- **Session revocation** denylist on logout; HMAC-signed session cookies.
- **SSRF guard** on outbound webhooks (incl. IPv4-mapped & bracketed IPv6 edge cases),
  **CSRF** origin/referer checks, honeypots, and optional Turnstile.

### 4. Internationalization & SEO
Full EN/FR parity via a dictionary system; canonical + hreflang alternates, JSON-LD,
sitemap, RSS, and per-route metadata.

### 5. Reliability
Vitest unit tests over the security-sensitive lib layer (URL safety, the SSRF guard,
client-IP parsing, the tracking allowlist) and a CI workflow running
lint → typecheck → test → build on every push/PR — plus a scheduled watchdog that
verifies the deployed site and self-heals dependency drift (see below).

---

## The incident that taught me the most

The site ran unattended for **80 days**. Every scheduled workflow had been failing
16 seconds in, and I had no idea — the failures went to GitHub notifications, which
had long since become wallpaper. Roughly 700 unread.

**Root cause:** `package-lock.json` had drifted from `package.json` — three missing
transitive entries. `npm ci` refuses to install against a drifted lockfile, so it
took down all eleven workflows at once, before any of them did any work.

Fixing that exposed three more faults it had been masking:

| Fault | Why it stayed invisible |
| --- | --- |
| The news section rendered **empty** | All 240 stored items were arXiv, which the UI filters out under the site's own editorial policy. The pipeline looked healthy; the page had nothing on it. |
| Two feed parsers silently dropped whole sources | `extractTag` only matched bare tags, so Atom feeds using `<title type="html">` lost every title. And CDATA was stripped as if it were markup, emptying the text instead of unwrapping it. Sources reported "0 items" and nobody asked why. |
| **No webfont ever loaded** | The CSS named two typefaces that nothing fetched. Every visitor fell through to an OS fallback, so no two people saw the same site. |

The pattern connecting them is the part worth keeping: **each was correct on my
machine and broken in production.** The fonts, a placeholder LinkedIn URL published
into `schema.org`, and a stale contact email all came from configuration that existed
locally and not where the site actually runs. "Works locally" is not a test.

### What I built in response

A watchdog, scheduled daily, that checks what a reader would notice (is the site up,
is the content fresh) alongside what rots quietly (lockfile integrity, advisories,
plus the four `verify:*` scripts I had written and never scheduled).

Two design decisions I'd defend in review:

- **It repairs the lockfile itself — but commits nothing it hasn't verified.** It runs
  lint, typecheck, tests and build on the repaired tree first. A self-healer that
  breaks production is worse than the fault it replaced.
- **It reports through one issue it owns**, opened on failure, updated while broken,
  closed automatically on recovery. A stream of alerts is precisely what trained me to
  ignore the last outage; a single tracked issue survives being ignored for a week.

I also tested it against reality rather than theory: I re-broke the lockfile the same
way it broke in June, confirmed the watchdog caught it and named the exact missing
packages — then watched its first real run raise a **false alarm** (a check that read
config absent from CI by design) and fixed that too. A watchdog that cries wolf
recreates the original problem.

**The lesson:** I had written five health-check scripts and scheduled almost none of
them. Monitoring you don't run is documentation. The failure here wasn't missing
automation — it was automation with no way to tell a human it had stopped.

---

## Key decisions & trade-offs

| Decision | Why | Trade-off |
| --- | --- | --- |
| Deterministic agents (not one big LLM loop) | Reproducible, debuggable, cheap; LLM used only where prose is needed | More code than a single prompt |
| Minimal dependencies (Next/React + one SDK) | Smaller attack/maintenance surface, fast installs | Some wheels reinvented (rate limit, sanitizers) |
| Content as typed modules, not a CMS | Type safety, zero infra, git-reviewable | Doesn't scale to many non-technical authors → **next step: MDX/CMS** |
| PR-gated LLM output | Human stays in the loop; AI content is never published blind | Slower than full autopilot |

---

## What I'd do differently (and why that matters)

Honest senior-signal section, because judgment is the skill:

- **It's over-built for its stage.** The auth/account system and the autopilot are
  impressive but premature for a pre-audience site. I'd cut auth entirely (a blog
  doesn't need logins) to shrink the security/maintenance surface.
- **Auto-aggregated content is an SEO and quality risk.** The right move is fewer,
  original, genuinely useful articles — the LLM as a drafting *assistant*, not an author.
- **Content belongs in MDX or a CMS,** not TypeScript object literals — that's the one
  refactor that unlocks scalable publishing for both humans and the writer agent.

The point of this project was to prove I can design and ship a non-trivial system. The
lesson I took from it is the harder one: knowing what *not* to build.

---

## Skills demonstrated

`Next.js 16 App Router` · `TypeScript (strict)` · `web security (CSP, CSRF, SSRF, rate limiting, session mgmt)` ·
`OAuth 2.0` · `LLM/Claude API + structured output` · `multi-agent orchestration` ·
`i18n` · `technical SEO` · `unit testing (Vitest)` · `CI/CD (GitHub Actions)` · `incident response & root-cause analysis` · `observability` · `ESM tooling`

---

## How to talk about it in an interview (60-second version)

> "I built a bilingual content platform on Next.js with an autonomous back office —
> agents that ingest AI/CS news from 21 first-party sources, audit editorial balance,
> draft with the Claude API and open pull requests, all behind quality gates. But the
> part I'd actually want to talk about is the failure. It ran silently broken for 80
> days: a drifted lockfile meant `npm ci` refused to install, which took down all
> eleven workflows at once, and the failures went to notifications I'd stopped reading.
> Fixing it uncovered three more faults it had masked — including a news section that
> rendered empty because every stored item violated the site's own editorial policy.
> They shared a pattern: correct locally, broken in production. So I built a watchdog
> that checks the deployed site daily and repairs dependency drift itself, but only
> commits after the full build passes, and reports through a single issue it opens and
> closes. I'd written five health-check scripts and scheduled almost none of them —
> monitoring you don't run is just documentation."
